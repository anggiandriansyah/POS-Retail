'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import type { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, ImagePlus, ScanBarcode } from 'lucide-react';

interface NativeBarcodeResult {
  rawValue?: string;
}

interface NativeBarcodeDetector {
  detect(source: HTMLVideoElement | ImageBitmapSource): Promise<NativeBarcodeResult[]>;
}

interface NativeBarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): NativeBarcodeDetector;
  getSupportedFormats?: () => Promise<string[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: NativeBarcodeDetectorConstructor;
  }
}

const NATIVE_FORMATS = [
  'ean_13',
  'ean_8',
  'upc_a',
  'upc_e',
  'code_128',
  'code_39',
  'itf',
  'qr_code',
];

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
  const [cameraModeLabel, setCameraModeLabel] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [lastScannedNotice, setLastScannedNotice] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
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
    let rafTimer: number | null = null;

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

    async function startCamera() {
      try {
        // 1. Prioritas: Native BarcodeDetector API (Chrome / Edge / Android)
        if (typeof window !== 'undefined' && window.BarcodeDetector && navigator.mediaDevices) {
          let formats = NATIVE_FORMATS;
          if (window.BarcodeDetector.getSupportedFormats) {
            const supported = await window.BarcodeDetector.getSupportedFormats();
            const filtered = NATIVE_FORMATS.filter((f) => supported.includes(f));
            if (filtered.length > 0) formats = filtered;
          }

          const detector = new window.BarcodeDetector({ formats });
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });

          if (!isMounted) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }

          streamRef.current = stream;
          const videoEl = videoRef.current;
          if (videoEl) {
            videoEl.srcObject = stream;
            await videoEl.play();
          }

          // Enable continuous autofocus if supported
          const track = stream.getVideoTracks()[0];
          if (track && track.applyConstraints) {
            track
              .applyConstraints({
                advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
              })
              .catch(() => {});
          }

          setCameraModeLabel('Native HD Scanner');

          const scanLoop = async () => {
            if (!isMounted) return;
            const el = videoRef.current;
            if (el && el.readyState >= 2) {
              try {
                const results = await detector.detect(el);
                if (results.length > 0 && results[0].rawValue) {
                  handleDecoded(results[0].rawValue);
                }
              } catch {
                // ignore frame decode errors
              }
            }
            rafTimer = window.setTimeout(scanLoop, 120);
          };

          scanLoop();
          return;
        }

        // 2. Fallback: html5-qrcode full-frame (Safari / Firefox)
        setCameraModeLabel('ZXing Scanner');
        const { Html5Qrcode: Html5QrcodeClass, Html5QrcodeSupportedFormats } = await import(
          'html5-qrcode'
        );
        if (!isMounted) return;

        const html5QrCode = new Html5QrcodeClass(readerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 15, disableFlip: false },
          handleDecoded,
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
      setCameraModeLabel('');
      if (rafTimer !== null) {
        window.clearTimeout(rafTimer);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
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

  async function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setCameraError('');
    try {
      if (typeof window !== 'undefined' && window.BarcodeDetector) {
        const bitmap = await createImageBitmap(file);
        const detector = new window.BarcodeDetector({ formats: NATIVE_FORMATS });
        const results = await detector.detect(bitmap);
        bitmap.close();
        if (results.length > 0 && results[0].rawValue) {
          const scanned = results[0].rawValue.trim();
          setLastScannedNotice(scanned);
          onScanRef.current(scanned);
          setCameraActive(false);
          return;
        }
      }

      const { Html5Qrcode: Html5QrcodeClass } = await import('html5-qrcode');
      const tempScanner = new Html5QrcodeClass(`${readerId}_file`);
      const decoded = await tempScanner.scanFile(file, false);
      tempScanner.clear();
      const scanned = decoded.trim();
      setLastScannedNotice(scanned);
      onScanRef.current(scanned);
      setCameraActive(false);
    } catch {
      setCameraError(
        'Barcode tidak terbaca dari foto tersebut. Pastikan garis barcode terlihat jelas & tidak blur.'
      );
    }
  }

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
      <button
        type="button"
        className="btn btn-outline"
        onClick={() => fileInputRef.current?.click()}
        title="Ambil Foto / Pilih Gambar Barcode"
      >
        <ImagePlus size={18} />
        <span>Foto</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoUpload}
        style={{ display: 'none' }}
      />
    </>
  );

  const usesNativeVideo =
    typeof window !== 'undefined' && Boolean(window.BarcodeDetector);

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

      {/* Hidden container for html5-qrcode scanFile */}
      <div id={`${readerId}_file`} style={{ display: 'none' }} />

      {cameraActive && (
        <div className="camera-box">
          {usesNativeVideo ? (
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="camera-reader"
              style={{ width: '100%', borderRadius: 10 }}
            />
          ) : (
            <div id={readerId} className="camera-reader" />
          )}
          <p className="muted-text">
            {cameraModeLabel ? `${cameraModeLabel} • ` : ''}
            Arahkan barcode/QR ke kamera dengan jarak 15–20 cm, atau gunakan tombol{' '}
            <b>Foto</b> untuk hasil autofocus paling tajam.
          </p>
        </div>
      )}
    </div>
  );
}
