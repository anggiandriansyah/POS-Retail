'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import type { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, ScanBarcode } from 'lucide-react';

export interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  buttonLabel?: string;
}

export default function BarcodeScanner({
  onScan,
  placeholder = 'Scan barcode dengan scanner USB atau ketik kode lalu Enter...',
  autoFocus = true,
  buttonLabel = 'Cari / Scan',
}: BarcodeScannerProps) {
  const [code, setCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
  const readerId = useId().replace(/:/g, '_');

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (!cameraActive) return;

    let isMounted = true;

    async function startCamera() {
      try {
        const { Html5Qrcode: Html5QrcodeClass } = await import('html5-qrcode');
        if (!isMounted) return;

        const html5QrCode = new Html5QrcodeClass(readerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 140 } },
          (decodedText) => {
            const now = Date.now();
            if (
              lastScanRef.current.code === decodedText &&
              now - lastScanRef.current.time < 1500
            ) {
              return;
            }
            lastScanRef.current = { code: decodedText, time: now };
            onScan(decodedText.trim());
          },
          () => {}
        );
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : String(err);
          setCameraError(`Kamera tidak dapat diakses: ${message}`);
          setCameraActive(false);
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      const activeScanner = scannerRef.current;
      if (activeScanner) {
        activeScanner
          .stop()
          .then(() => activeScanner.clear())
          .catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [cameraActive, onScan, readerId]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    onScan(trimmed);
    setCode('');
    inputRef.current?.focus();
  }

  return (
    <div className="scanner-wrapper">
      <form onSubmit={handleSubmit} className="scanner-form">
        <div className="scanner-input-group">
          <ScanBarcode size={18} className="scanner-icon" />
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={placeholder}
            className="input scanner-input"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          {buttonLabel}
        </button>
        <button
          type="button"
          className={`btn ${cameraActive ? 'btn-danger' : 'btn-outline'}`}
          onClick={() => {
            setCameraError('');
            setCameraActive((prev) => !prev);
          }}
          title={cameraActive ? 'Tutup Kamera' : 'Scan Pakai Kamera'}
        >
          {cameraActive ? <CameraOff size={18} /> : <Camera size={18} />}
          <span>{cameraActive ? 'Tutup Kamera' : 'Kamera'}</span>
        </button>
      </form>

      {cameraError && <p className="alert alert-error">{cameraError}</p>}

      {cameraActive && (
        <div className="camera-box">
          <div id={readerId} className="camera-reader" />
          <p className="muted-text">Arahkan kamera ke barcode / QR produk</p>
        </div>
      )}
    </div>
  );
}
