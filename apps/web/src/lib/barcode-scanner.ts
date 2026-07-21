type VideoInputDevice = {
  deviceId: string;
  label: string;
};

/** Prefer a rear camera on phones; otherwise use the first available webcam. */
export function selectVideoInputDeviceId(devices: VideoInputDevice[]): string | undefined {
  const usableDevices = devices.filter((device) => device.deviceId);

  if (usableDevices.length === 0) {
    return undefined;
  }

  const environmentCamera = usableDevices.find((device) =>
    /back|rear|environment/i.test(device.label),
  );

  return environmentCamera?.deviceId ?? usableDevices[0]?.deviceId;
}

export function getCameraErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      return 'Camera access was denied. Allow camera permissions and try again.';
    }

    if (error.name === 'NotFoundError') {
      return 'No camera was found on this device.';
    }

    if (error.name === 'OverconstrainedError') {
      return 'No compatible camera was found on this device.';
    }
  }

  return 'Unable to access the camera. Try typing the barcode instead.';
}

export async function waitForVideoElement(
  getElement: () => HTMLVideoElement | null,
  timeoutMs = 3000,
): Promise<HTMLVideoElement> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const element = getElement();

    if (element) {
      return element;
    }

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }

  throw new Error('Video element is not available');
}
