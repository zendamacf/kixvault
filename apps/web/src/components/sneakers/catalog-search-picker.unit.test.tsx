import { afterEach, describe, expect, mock, test } from 'bun:test';
import type { CatalogSearchResult } from '@kixvault/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { CatalogSearchPicker } from '@/components/sneakers/catalog-search-picker';
import { createJsonResponse, installFetchMock } from '@/test/mocks/api';

const goatResult: CatalogSearchResult = {
  catalogSource: 'kicksdb:goat',
  catalogId: 'air-jordan-1-chicago-goat',
  title: 'Air Jordan 1 Retro High OG Chicago',
  brand: 'Jordan',
  model: 'Air Jordan 1',
  colorway: 'White/Black-Varsity Red',
  nickname: 'Chicago',
  sku: 'DZ5485-612',
  imageUrl: 'https://images.goat.com/chicago.png',
  releaseDate: '2015-04-25',
  description: 'Released in 1985, the Air Jordan 1 changed basketball forever.',
};

// Bypass the 1s debounce so queries fire immediately in tests
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

function renderPicker(props: Partial<Parameters<typeof CatalogSearchPicker>[0]> = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <CatalogSearchPicker onSelect={mock()} {...props} />
    </QueryClientProvider>,
  );
}

function searchFor(query: string) {
  fireEvent.change(screen.getByLabelText('Find a sneaker'), { target: { value: query } });
}

describe('CatalogSearchPicker', () => {
  test('renders results and calls onSelect when a result is clicked', async () => {
    const catalogSearch = mock(async () => createJsonResponse({ results: [goatResult] }));
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

    expect(onSelect).toHaveBeenCalledWith(goatResult);
  });

  test('highlights the selected result', async () => {
    installFetchMock({
      catalogSearch: async () => createJsonResponse({ results: [goatResult] }),
    });

    renderPicker({ selectedCatalogId: goatResult.catalogId });
    searchFor('jordan');

    const resultButton = await screen.findByRole('button', {
      name: /Air Jordan 1 Retro High OG Chicago/,
    });

    expect(resultButton.className).toContain('border-primary');
  });

  test('does not search until the query has at least 2 characters', async () => {
    const catalogSearch = mock(async () => createJsonResponse({ results: [] }));
    installFetchMock({ catalogSearch });

    renderPicker();
    searchFor('j');

    expect(await screen.findByText('Type at least 2 characters to search.')).toBeTruthy();
    expect(catalogSearch).not.toHaveBeenCalled();
  });

  test('searches GOAT by default and StockX after switching marketplaces', async () => {
    const requestedMarketplaces: Array<string | null> = [];
    installFetchMock({
      catalogSearch: async (url) => {
        requestedMarketplaces.push(url.searchParams.get('marketplace'));
        return createJsonResponse({ results: [] });
      },
    });
    const onMarketplaceChange = mock();

    renderPicker({ onMarketplaceChange });
    searchFor('jordan');

    await waitFor(() => {
      expect(requestedMarketplaces).toContain('goat');
    });

    fireEvent.change(screen.getByLabelText('Marketplace'), { target: { value: 'stockx' } });

    expect(onMarketplaceChange).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(requestedMarketplaces).toContain('stockx');
    });
  });

  test('shows an empty state when no results are found', async () => {
    installFetchMock({
      catalogSearch: async () => createJsonResponse({ results: [] }),
    });

    renderPicker();
    searchFor('nonexistent shoe');

    expect(await screen.findByText(/No sneakers found on GOAT for/)).toBeTruthy();
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
