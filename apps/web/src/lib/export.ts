import { api } from '@/lib/api';

/** Matches the name the API sends, for when the header is not readable. */
function fallbackFilename(): string {
  return `kixvault-export-${new Date().toISOString().slice(0, 10)}.csv`;
}

export function filenameFromDisposition(header: string | null): string {
  const match = header?.match(/filename="([^"]+)"/);

  return match?.[1] ?? fallbackFilename();
}

/** Downloads the collection as a CSV file. Throws when the request fails. */
export async function downloadCollectionCsv(): Promise<void> {
  const response = await api.api.sneakers.export.$get({ query: { format: 'csv' } });

  if (!response.ok) {
    throw new Error(`Export failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filenameFromDisposition(response.headers.get('Content-Disposition'));
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
