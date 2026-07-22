import { afterEach, describe, expect, mock, test } from 'bun:test';
import type { CatalogSearchResult } from '@kixvault/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CatalogSneakerForm } from '@/components/sneakers/catalog-sneaker-form';
import { createJsonResponse, installFetchMock } from '@/test/mocks/api';

const catalogResult: CatalogSearchResult = {
  catalogSource: 'kicksdb:stockx',
  catalogId: 'air-jordan-1-chicago',
  title: 'Air Jordan 1 Retro High OG Chicago',
  brand: 'Jordan',
  model: 'Air Jordan 1',
  colorway: 'White/Black-Varsity Red',
  nickname: 'Chicago',
  sku: 'DZ5485-612',
  imageUrl: 'https://images.stockx.com/chicago.png',
  imageUrls: ['https://images.stockx.com/chicago.png'],
  releaseDate: '2016-12-13',
  description: 'Released in December 2016, the Nike SB Dunk Low Pro OG QS.',
};

mock.module('@/lib/hooks', () => ({
  useDebouncedValue: <T,>(value: T) => value,
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
      catalogProduct: async (url) => {
        expect(url.pathname).toBe('/api/catalog/products/air-jordan-1-chicago');

        return createJsonResponse({
          product: catalogResult,
          variantPrices: [
            {
              size: '10',
              sizeType: 'us m',
              price: 220,
              variantId: 'variant-10',
            },
          ],
        });
      },
    });
    const onSubmit = mock(async () => {});

    renderForm(onSubmit);

    fireEvent.change(screen.getByLabelText('Find a sneaker'), { target: { value: 'jordan' } });

    fireEvent.click(
      await screen.findByRole('button', { name: /Air Jordan 1 Retro High OG Chicago/ }),
    );

    expect(screen.getByText('SKU DZ5485-612')).toBeTruthy();
    expect(screen.queryByLabelText('Find a sneaker')).toBeNull();

    fireEvent.change(screen.getByLabelText('Size'), { target: { value: '10' } });

    expect(await screen.findByText('Market preview')).toBeTruthy();
    expect(screen.getByText('$220')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Add to collection' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit).toHaveBeenCalledWith({
      catalogSource: 'kicksdb:stockx',
      catalogId: 'air-jordan-1-chicago',
      size: 10,
      condition: 'deadstock',
      purchasePrice: null,
      purchaseDate: null,
      notes: null,
    });
  });

  test('returns to search when back is clicked', async () => {
    installFetchMock({
      catalogSearch: async () => createJsonResponse({ results: [catalogResult] }),
      catalogProduct: async () =>
        createJsonResponse({
          product: catalogResult,
          variantPrices: [],
        }),
    });

    renderForm(mock(async () => {}));

    fireEvent.change(screen.getByLabelText('Find a sneaker'), { target: { value: 'jordan' } });

    fireEvent.click(
      await screen.findByRole('button', { name: /Air Jordan 1 Retro High OG Chicago/ }),
    );

    expect(screen.queryByLabelText('Find a sneaker')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '← Back to search' }));

    expect(screen.getByLabelText('Find a sneaker')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Air Jordan 1 Retro High OG Chicago/ })).toBeTruthy();
  });
});
