'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import type { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, ScanBarcode } from 'lucide-react';

export interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  buttonLabel?: string;
  value?: string;
  onChange?: (barcode: string) => void;
  hideSubmit?: boolean;
  required?: boolean;
  closeCameraOnScan?: boolean;
}

export default function BarcodeScanner({
  onScan,
  placeholder = 'Scan barcode dengan scanner USB atau ketik kode lalu Enter...',
  autoFocus = true,
  buttonLabel = 'Cari / Scan',
  value,
  onChange,
  hideSubmit = false,
  required = false,
  closeCameraOnScan = false,
}: BarcodeScannerProps) {
  const [internalCode, setInternalCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [lastScannedNotice, setLastScannedNotice] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
  const onScanRef = useRef(onScan);
  const closeOnScanRef = useRef(closeCameraOnScan);
  const readerId = useId().replace(/:/g, '_');

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    closeOnScanRef.current = closeCameraOnScan;
  }, [closeCameraOnScan]);

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
        const { Html5Qrcode: Html5QrcodeClass, Html5QrcodeSupportedFormats } = await import(
          'html5-qrcode'
        );
        if (!isMounted) return;

        const formatsToSupport = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.QR_CODE,
        ];

        const html5QrCode = new Html5QrcodeClass(readerId, {
          formatsToSupport,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        const scanConfig = {
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => ({
            width: Math.max(200, Math.floor(viewfinderWidth * 0.85)),
            height: Math.max(110, Math.floor(viewfinderHeight * 0.55)),
          }),
          disableFlip: false,
        };

        const handleDecoded = (decodedText: string) => {
          const now = Date.now();
          const scanned = decodedText.trim();
          if (!scanned) return;
          if (
            lastScanRef.current.code === scanned &&
            now - lastScanRef.current.time < 1500
          ) {
            return;
          }
          lastScanRef.current = { code: scanned, time: now };
          setLastScannedNotice(scanned);
          onScanRef.current(scanned);
          if (closeOnScanRef.current) {
            setCameraActive(false);
          }
        };

        try {
          await html5QrCode.start(
            {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 },
            } as MediaTrackConstraints,
            scanConfig,
            handleDecoded,
            () => {}
          );
        } catch {
          // Fallback to default camera constraints if 1280x720 isn't supported
          if (!isMounted) return;
          await html5QrCode.start(
            { facingMode: 'environment' },
            scanConfig,
            handleDecoded,
            () => {}
          );
        }
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
  }, [cameraActive, readerId]);

  const code = value !== undefined ? value : internalCode;
  const setCode = (next: string) => {
    if (onChange) onChange(next);
    if (value === undefined) setInternalCode(next);
  };

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    onScan(trimmed);
    if (value === undefined) {
      setInternalCode('');
    }
    inputRef.current?.focus();
  }

  const controls = (
    <>
      <div className="scanner-input-group">
        <ScanBarcode size={18} className="scanner-icon" />
        <input
          ref={inputRef}
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={placeholder}
          className="input scanner-input"
          required={required}
        />
      </div>
      {!hideSubmit && (
        <button type="submit" className="btn btn-primary">
          {buttonLabel}
        </button>
      )}
      <button
        type="button"
        className={`btn ${cameraActive ? 'btn-danger' : 'btn-outline'}`}
        onClick={() => {
          setCameraError('');
          setLastScannedNotice('');
          setCameraActive((prev) => !prev);
        }}
        title={cameraActive ? 'Tutup Kamera' : 'Scan Pakai Kamera'}
      >
        {cameraActive ? <CameraOff size={18} /> : <Camera size={18} />}
        <span>{cameraActive ? 'Tutup Kamera' : 'Kamera'}</span>
      </button>
    </>
  );

  return (
    <div className="scanner-wrapper">
      {hideSubmit ? (
        <div className="scanner-form">{controls}</div>
      ) : (
        <form onSubmit={handleSubmit} className="scanner-form">
          {controls}
        </form>
      )}

      {cameraError && <p className="alert alert-error">{cameraError}</p>}
      {lastScannedNotice && (
        <p className="alert alert-success">
          Barcode terbaca: <code>{lastScannedNotice}</code>
        </p>
      )}

      {cameraActive && (
        <div className="camera-box">
          <div id={readerId} className="camera-reader" />
          <p className="muted-text">
            Arahkan barcode/QR sejajar di dalam kotak dengan pencahayaan cukup
          </p>
        </div>
      )}
    </div>
  );
}
