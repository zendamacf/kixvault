import { afterEach, describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createJsonResponse } from '@/test/mocks/api';
import { RetireForm } from './retire-form';

afterEach(() => {
  cleanup();
});

const SNEAKER_ID = '11111111-1111-4111-8111-111111111111';

function installFetch(status = 200) {
  const bodies: unknown[] = [];
  const fetchMock = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);

    if (request.url.endsWith(`/api/sneakers/${SNEAKER_ID}/retire`)) {
      bodies.push(await request.json());

      return status === 200
        ? createJsonResponse({ sneaker: { id: SNEAKER_ID } })
        : createJsonResponse({ error: 'Sneaker is already retired' }, status);
    }

    return createJsonResponse({});
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return bodies;
}

function renderForm(props: { onBack?: () => void; onRetired?: () => void } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <RetireForm
        sneakerId={SNEAKER_ID}
        label="Nike Dunk Low"
        onBack={props.onBack ?? (() => {})}
        onRetired={props.onRetired ?? (() => {})}
      />
    </QueryClientProvider>,
  );
}

describe('RetireForm', () => {
  test('offers every departure type, with sold selected first', () => {
    renderForm();

    const labels = screen.getAllByRole('radio').map((radio) => radio.parentElement?.textContent);

    expect(labels).toEqual(['Sold', 'Donated', 'Gifted', 'Traded', 'Lost', 'Other']);
    expect((screen.getByLabelText('Sold') as HTMLInputElement).checked).toBe(true);
  });

  test('asks for a sale price only when the pair was sold or traded', () => {
    renderForm();

    expect(screen.getByLabelText('Sale price')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Traded'));
    expect(screen.getByLabelText('Trade value (optional)')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Gifted'));
    expect(screen.queryByLabelText('Sale price')).toBeNull();
    expect(screen.queryByLabelText('Trade value (optional)')).toBeNull();

    fireEvent.click(screen.getByLabelText('Donated'));
    expect(screen.queryByLabelText('Sale price')).toBeNull();
  });

  test('blocks a sold pair without a sale price and sends nothing', async () => {
    const bodies = installFetch();
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Retire pair' }));

    expect(await screen.findByText('Enter the sale price.')).toBeTruthy();
    expect(bodies).toEqual([]);
  });

  test('retires a sold pair with its price and notes', async () => {
    const bodies = installFetch();
    const onRetired = mock(() => {});
    renderForm({ onRetired });

    fireEvent.change(screen.getByLabelText('Sale price'), { target: { value: '250' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-03-01' } });
    fireEvent.change(screen.getByLabelText('Notes (optional)'), { target: { value: 'eBay' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retire pair' }));

    await waitFor(() => expect(onRetired).toHaveBeenCalled());
    expect(bodies).toEqual([
      { departureType: 'sold', departedOn: '2026-03-01', salePrice: 250, notes: 'eBay' },
    ]);
  });

  test('retires a gifted pair without a price', async () => {
    const bodies = installFetch();
    const onRetired = mock(() => {});
    renderForm({ onRetired });

    fireEvent.click(screen.getByLabelText('Sold'));
    fireEvent.change(screen.getByLabelText('Sale price'), { target: { value: '99' } });
    fireEvent.click(screen.getByLabelText('Gifted'));
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-03-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retire pair' }));

    await waitFor(() => expect(onRetired).toHaveBeenCalled());
    expect(bodies).toEqual([{ departureType: 'gifted', departedOn: '2026-03-01' }]);
  });

  test('shows the API error and stays open when retiring fails', async () => {
    installFetch(409);
    const onRetired = mock(() => {});
    renderForm({ onRetired });

    fireEvent.click(screen.getByLabelText('Gifted'));
    fireEvent.click(screen.getByRole('button', { name: 'Retire pair' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Sneaker is already retired');
    expect(onRetired).not.toHaveBeenCalled();
  });

  test('goes back without sending anything', () => {
    const bodies = installFetch();
    const onBack = mock(() => {});
    renderForm({ onBack });

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(onBack).toHaveBeenCalled();
    expect(bodies).toEqual([]);
  });
});
