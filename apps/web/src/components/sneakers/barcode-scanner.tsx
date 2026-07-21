import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { ScanLine } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getCameraErrorMessage,
  selectVideoInputDeviceId,
  waitForVideoElement,
} from '@/lib/barcode-scanner';

type BarcodeScannerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (value: string) => void;
};

async function startBarcodeScanner(
  reader: BrowserMultiFormatReader,
  videoElement: HTMLVideoElement,
  onResult: (value: string) => void,
): Promise<IScannerControls> {
  const devices = await BrowserMultiFormatReader.listVideoInputDevices();
  const deviceId = selectVideoInputDeviceId(devices);

  const onDecode = (result: { getText: () => string } | undefined) => {
    if (!result) {
      return;
    }

    onResult(result.getText());
  };

  if (deviceId) {
    return reader.decodeFromVideoDevice(deviceId, videoElement, onDecode);
  }

  // ZXing defaults to facingMode: "environment", which laptops do not have.
  return reader.decodeFromConstraints({ video: true }, videoElement, onDecode);
}

/** Camera modal that decodes sneaker box UPC/EAN barcodes. */
export function BarcodeScanner({ open, onOpenChange, onScan }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const onScanRef = useRef(onScan);
  const onOpenChangeRef = useRef(onOpenChange);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const videoDescriptionId = useId();

  onScanRef.current = onScan;
  onOpenChangeRef.current = onOpenChange;

  useEffect(() => {
    if (!open) {
      controlsRef.current?.stop();
      controlsRef.current = null;
      readerRef.current = null;
      setError(null);
      setIsStarting(false);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Barcode scanning requires a camera and is not supported in this browser.');
      return;
    }

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    let cancelled = false;

    const startScanner = async () => {
      setIsStarting(true);
      setError(null);

      try {
        const videoElement = await waitForVideoElement(() => videoRef.current);

        if (cancelled) {
          return;
        }

        const controls = await startBarcodeScanner(reader, videoElement, (value) => {
          onScanRef.current(value);
          onOpenChangeRef.current(false);
        });

        if (cancelled) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
      } catch (startError) {
        if (!cancelled) {
          setError(getCameraErrorMessage(startError));
        }
      } finally {
        if (!cancelled) {
          setIsStarting(false);
        }
      }
    };

    void startScanner();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
      readerRef.current = null;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan box barcode</DialogTitle>
          <DialogDescription>
            Point your camera at the UPC barcode on the sneaker box.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="overflow-hidden rounded-lg border bg-black">
            <video
              ref={videoRef}
              className="aspect-[4/3] w-full object-cover"
              autoPlay
              muted
              playsInline
              aria-describedby={videoDescriptionId}
            />
          </div>
          <p id={videoDescriptionId} className="sr-only">
            Live camera preview for barcode scanning
          </p>

          {isStarting ? (
            <p className="text-sm text-muted-foreground">Starting camera…</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Hold the barcode steady inside the frame.
            </p>
          )}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

type BarcodeScanButtonProps = {
  onScan: (value: string) => void;
  disabled?: boolean;
};

/** Opens the barcode scanner from catalog search. */
export function BarcodeScanButton({ onScan, disabled = false }: BarcodeScanButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="shrink-0"
        disabled={disabled}
        onClick={() => setOpen(true)}
        aria-label="Scan box barcode"
      >
        <ScanLine className="size-4" />
        <span className="sr-only sm:not-sr-only">Scan</span>
      </Button>

      <BarcodeScanner open={open} onOpenChange={setOpen} onScan={onScan} />
    </>
  );
}
