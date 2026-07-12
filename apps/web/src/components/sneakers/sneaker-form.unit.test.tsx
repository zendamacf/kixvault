import { afterEach, describe, expect, mock, test } from 'bun:test';
import type { CatalogSearchResult } from '@kixvault/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SneakerForm } from '@/components/sneakers/sneaker-form';
import { createJsonResponse, installFetchMock } from '@/test/mocks/api';

const catalogResult: CatalogSearchResult = {
  catalogSource: 'kicksdb:goat',
  catalogId: 'air-jordan-1-chicago',
  title: 'Air Jordan 1 Retro High OG Chicago',
  brand: 'Jordan',
  model: 'Air Jordan 1',
  colorway: 'White/Black-Varsity Red',
  nickname: 'Chicago',
  sku: 'DZ5485-612',
  imageUrl: 'https://images.goat.com/chicago.png',
  releaseDate: '2016-12-13',
  description: 'Released in December 2016, the Nike SB Dunk Low Pro OG QS.',
};

// Bypass the 1s catalog search debounce so results appear immediately
mock.module('@/lib/hooks', () => ({
  useDebouncedValue: <T,>(value: T) => value,
}));

mock.module('@/components/ui/select', () => ({
  Select: ({
    children,
    value,
    onValueChange,
  }: {
    children: ReactNode;
    value: string;
    onValueChange: (value: string) => void;
  }) => (
    <select
      aria-label="Marketplace"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ children, value }: { children: ReactNode; value: string }) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectValue: () => null,
}));

afterEach(() => {
  cleanup();
});

function renderForm(onSubmit: (values: unknown) => Promise<void>) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <SneakerForm enableCatalogSearch submitLabel="Add to collection" onSubmit={onSubmit} />
    </QueryClientProvider>,
  );
}

describe('SneakerForm', () => {
  test('submits catalog nickname after selecting a result', async () => {
    installFetchMock({
      catalogSearch: async () => createJsonResponse({ results: [catalogResult] }),
    });
    const onSubmit = mock(async () => {});

    renderForm(onSubmit);

    fireEvent.change(screen.getByLabelText('Find a sneaker'), { target: { value: 'jordan' } });

    fireEvent.click(
      await screen.findByRole('button', { name: /Air Jordan 1 Retro High OG Chicago/ }),
    );

    expect((screen.getByLabelText('Nickname') as HTMLInputElement).value).toBe('Chicago');

    fireEvent.change(screen.getByLabelText('Size'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add to collection' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        brand: 'Jordan',
        model: 'Air Jordan 1',
        nickname: 'Chicago',
        sku: 'DZ5485-612',
        releaseDate: '2016-12-13',
        description: 'Released in December 2016, the Nike SB Dunk Low Pro OG QS.',
        size: 10,
      }),
    );
  });
});
