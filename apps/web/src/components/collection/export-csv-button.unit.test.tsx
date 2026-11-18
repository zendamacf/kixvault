import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const downloadCollectionCsv = mock(async () => {});
const toastError = mock((_message: string) => {});

mock.module('@/lib/export', () => ({ downloadCollectionCsv }));
mock.module('sonner', () => ({ toast: { error: toastError, success: () => {} } }));

const { ExportCsvButton } = await import('./export-csv-button');

function renderButton(props: { disabled?: boolean } = {}) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <ExportCsvButton {...props} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  downloadCollectionCsv.mockReset();
  downloadCollectionCsv.mockImplementation(async () => {});
  toastError.mockClear();
});

afterEach(() => {
  cleanup();
});

describe('ExportCsvButton', () => {
  test('starts the download when clicked', async () => {
    renderButton();

    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

    await waitFor(() => expect(downloadCollectionCsv).toHaveBeenCalledTimes(1));
    expect(toastError).not.toHaveBeenCalled();
  });

  test('shows a loading state while the export runs', async () => {
    let finish = () => {};
    downloadCollectionCsv.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    renderButton();

    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

    const loading = await screen.findByRole('button', { name: 'Exporting…' });
    expect((loading as HTMLButtonElement).disabled).toBe(true);

    finish();
    await screen.findByRole('button', { name: 'Export CSV' });
  });

  test('shows an error toast when the export fails', async () => {
    downloadCollectionCsv.mockImplementation(async () => {
      throw new Error('boom');
    });
    renderButton();

    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        'Could not export your collection. Try again in a moment.',
      ),
    );
    expect((screen.getByRole('button', { name: 'Export CSV' }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  test('is disabled when told to be', () => {
    renderButton({ disabled: true });

    expect((screen.getByRole('button', { name: 'Export CSV' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});
