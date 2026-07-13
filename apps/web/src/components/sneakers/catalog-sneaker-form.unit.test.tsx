import { afterEach, describe, expect, mock, test } from 'bun:test';
import type { CatalogSearchResult } from '@kixvault/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { CatalogSneakerForm } from '@/components/sneakers/catalog-sneaker-form';
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
      <CatalogSneakerForm submitLabel="Add to collection" onSubmit={onSubmit} />
    </QueryClientProvider>,
  );
}

describe('CatalogSneakerForm', () => {
  test('submits catalog id and collection details after selecting a result', async () => {
    installFetchMock({
      catalogSearch: async () => createJsonResponse({ results: [catalogResult] }),
    });
    const onSubmit = mock(async () => {});

    renderForm(onSubmit);

    fireEvent.change(screen.getByLabelText('Find a sneaker'), { target: { value: 'jordan' } });

    fireEvent.click(
      await screen.findByRole('button', { name: /Air Jordan 1 Retro High OG Chicago/ }),
    );

    expect(screen.getByText('SKU DZ5485-612')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Size'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add to collection' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit).toHaveBeenCalledWith({
      catalogSource: 'kicksdb:goat',
      catalogId: 'air-jordan-1-chicago',
      size: 10,
      condition: 'deadstock',
      purchasePrice: null,
      purchaseDate: null,
      notes: null,
    });
  });
});
