import { afterEach, describe, expect, mock, test } from 'bun:test';
import type { CatalogSearchResult } from '@kixvault/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { CatalogSearchPicker } from '@/components/sneakers/catalog-search-picker';
import { createJsonResponse, installFetchMock } from '@/test/mocks/api';

const stockxResult: CatalogSearchResult = {
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
  releaseDate: '2015-04-25',
  description: 'Released in 1985, the Air Jordan 1 changed basketball forever.',
};

// Bypass the 1s debounce so queries fire immediately in tests
mock.module('@/lib/hooks', () => ({
  useDebouncedValue: <T,>(value: T) => value,
}));

afterEach(() => {
  cleanup();
});

function StatefulPicker(props: Partial<Parameters<typeof CatalogSearchPicker>[0]> = {}) {
  const [query, setQuery] = useState('');
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return (
    <QueryClientProvider client={client}>
      <CatalogSearchPicker
        query={query}
        onQueryChange={setQuery}
        onSelect={props.onSelect ?? mock()}
        {...props}
      />
    </QueryClientProvider>
  );
}

function renderPicker(props: Partial<Parameters<typeof CatalogSearchPicker>[0]> = {}) {
  return render(<StatefulPicker {...props} />);
}

function searchFor(query: string) {
  fireEvent.change(screen.getByLabelText('Find a sneaker'), { target: { value: query } });
}

describe('CatalogSearchPicker', () => {
  test('renders results and calls onSelect when a result is clicked', async () => {
    const catalogSearch = mock(async () => createJsonResponse({ results: [stockxResult] }));
    installFetchMock({ catalogSearch });
    const onSelect = mock();

    renderPicker({ onSelect });
    searchFor('jordan');

    const resultButton = await screen.findByRole('button', {
      name: /Air Jordan 1 Retro High OG Chicago/,
    });

    expect(screen.getByText('"Chicago"')).toBeTruthy();
    expect(screen.getByText('DZ5485-612')).toBeTruthy();

    fireEvent.click(resultButton);

    expect(onSelect).toHaveBeenCalledWith(stockxResult);
  });

  test('highlights the selected result', async () => {
    installFetchMock({
      catalogSearch: async () => createJsonResponse({ results: [stockxResult] }),
    });

    renderPicker({ selectedCatalogId: stockxResult.catalogId });
    searchFor('jordan');

    const resultButton = await screen.findByRole('button', {
      name: /Air Jordan 1 Retro High OG Chicago/,
    });

    expect(resultButton.className).toContain('border-primary');
  });

  test('does not search until the query has at least 3 characters', async () => {
    const catalogSearch = mock(async () => createJsonResponse({ results: [] }));
    installFetchMock({ catalogSearch });

    renderPicker();
    searchFor('jo');

    expect(await screen.findByText('Type at least 3 characters to search.')).toBeTruthy();
    expect(catalogSearch).not.toHaveBeenCalled();
  });

  test('searches StockX', async () => {
    installFetchMock({
      catalogSearch: async (url) => {
        expect(url.searchParams.has('marketplace')).toBe(false);
        return createJsonResponse({ results: [] });
      },
    });

    renderPicker();
    searchFor('jordan');

    await waitFor(() => {
      expect(screen.getByText(/No sneakers found on StockX for/)).toBeTruthy();
    });
  });

  test('shows an empty state when no results are found', async () => {
    installFetchMock({
      catalogSearch: async () => createJsonResponse({ results: [] }),
    });

    renderPicker();
    searchFor('nonexistent shoe');

    expect(await screen.findByText(/No sneakers found on StockX for/)).toBeTruthy();
  });

  test('shows an unavailable message when the API returns 503', async () => {
    installFetchMock({
      catalogSearch: async () => createJsonResponse({ error: 'Not configured' }, 503),
    });

    renderPicker();
    searchFor('jordan');

    expect(
      await screen.findByText(
        'Catalog search is unavailable. Switch to manual entry to add a pair.',
      ),
    ).toBeTruthy();
  });

  test('shows an error message when the search fails', async () => {
    installFetchMock({
      catalogSearch: async () => createJsonResponse({ error: 'Rate limit exceeded' }, 429),
    });

    renderPicker();
    searchFor('jordan');

    expect(await screen.findByText('Rate limit exceeded')).toBeTruthy();
  });
});
