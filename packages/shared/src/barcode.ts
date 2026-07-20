const UPC_A_LENGTH = 12;
const EAN_13_LENGTH = 13;

/** Strip non-digits and validate a sneaker box UPC/EAN barcode. */
export function normalizeBarcode(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');

  if (digits.length === UPC_A_LENGTH) {
    return digits;
  }

  if (digits.length === EAN_13_LENGTH) {
    return digits;
  }

  return null;
}

export function isValidBarcode(raw: string): boolean {
  return normalizeBarcode(raw) !== null;
}
