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

type BarcodeScannerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (value: string) => void;
};

function getCameraErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      return 'Camera access was denied. Allow camera permissions and try again.';
    }

    if (error.name === 'NotFoundError') {
      return 'No camera was found on this device.';
    }
  }

  return 'Unable to access the camera. Try typing the barcode instead.';
}

/** Camera modal that decodes sneaker box UPC/EAN barcodes. */
export function BarcodeScanner({ open, onOpenChange, onScan }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const videoDescriptionId = useId();

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
        const videoElement = videoRef.current;

        if (!videoElement) {
          throw new Error('Video element is not available');
        }

        const controls = await reader.decodeFromVideoDevice(undefined, videoElement, (result) => {
          if (!result) {
            return;
          }

          onScan(result.getText());
          onOpenChange(false);
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
  }, [open, onOpenChange, onScan]);

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
