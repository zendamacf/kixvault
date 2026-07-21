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

/** Return UPC/EAN variants to try when looking up a scanned barcode. */
export function getBarcodeLookupVariants(raw: string): string[] {
  const normalized = normalizeBarcode(raw);

  if (!normalized) {
    return [];
  }

  const variants = new Set<string>([normalized]);

  if (normalized.length === UPC_A_LENGTH) {
    variants.add(`0${normalized}`);
  }

  if (normalized.length === EAN_13_LENGTH && normalized.startsWith('0')) {
    variants.add(normalized.slice(1));
  }

  return [...variants];
}
