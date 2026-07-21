import { describe, expect, test } from 'bun:test';
import { getCameraErrorMessage, selectVideoInputDeviceId } from './barcode-scanner';

describe('selectVideoInputDeviceId', () => {
  test('returns undefined when no usable devices are available', () => {
    expect(selectVideoInputDeviceId([])).toBeUndefined();
    expect(selectVideoInputDeviceId([{ deviceId: '', label: 'Webcam' }])).toBeUndefined();
  });

  test('prefers a rear camera when labels indicate one is available', () => {
    const deviceId = selectVideoInputDeviceId([
      { deviceId: 'front', label: 'FaceTime HD Camera' },
      { deviceId: 'rear', label: 'Back Camera' },
    ]);

    expect(deviceId).toBe('rear');
  });

  test('falls back to the first usable camera for laptop webcams', () => {
    const deviceId = selectVideoInputDeviceId([
      { deviceId: 'laptop-webcam', label: 'Integrated Camera' },
    ]);

    expect(deviceId).toBe('laptop-webcam');
  });
});

describe('getCameraErrorMessage', () => {
  test('maps permission and device errors to user-facing messages', () => {
    expect(getCameraErrorMessage(new DOMException('denied', 'NotAllowedError'))).toBe(
      'Camera access was denied. Allow camera permissions and try again.',
    );
    expect(getCameraErrorMessage(new DOMException('missing', 'NotFoundError'))).toBe(
      'No camera was found on this device.',
    );
    expect(getCameraErrorMessage(new DOMException('unsupported', 'OverconstrainedError'))).toBe(
      'No compatible camera was found on this device.',
    );
  });
});
