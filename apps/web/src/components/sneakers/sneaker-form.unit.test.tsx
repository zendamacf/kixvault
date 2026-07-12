import { afterEach, describe, expect, mock, test } from 'bun:test';
import type { CatalogSearchResult } from '@kixvault/shared';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SneakerForm } from '@/components/sneakers/sneaker-form';

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
};

afterEach(() => {
  cleanup();
});

mock.module('@/components/sneakers/catalog-search-picker', () => ({
  CatalogSearchPicker: ({
    onSelect,
  }: {
    selectedCatalogId: string | null;
    onSelect: (result: CatalogSearchResult) => void;
    onMarketplaceChange: () => void;
  }) => (
    <button type="button" onClick={() => onSelect(catalogResult)}>
      Select catalog result
    </button>
  ),
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
    <select value={value} onChange={(event) => onValueChange(event.target.value)}>
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

describe('SneakerForm', () => {
  test('submits catalog nickname after selecting a result', async () => {
    const onSubmit = mock(async () => {});

    render(<SneakerForm enableCatalogSearch submitLabel="Add to collection" onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: 'Select catalog result' }));
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
        size: 10,
      }),
    );
  });
});
