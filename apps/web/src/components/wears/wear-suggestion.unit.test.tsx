import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createJsonResponse } from '@/test/mocks/api';
import { WearSuggestion } from './wear-suggestion';

const SNEAKER_ID = '11111111-1111-4111-8111-111111111111';

function renderSuggestion() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <WearSuggestion sneakerId={SNEAKER_ID} wearCount={15} suggestedCondition="worn" />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe('WearSuggestion', () => {
  test('describes the suggested condition', () => {
    renderSuggestion();

    expect(screen.getByText(/Worn 15 times/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Mark as worn' })).toBeTruthy();
  });

  test('hides after Not now and stays hidden on the next visit', () => {
    const { unmount } = renderSuggestion();

    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
    expect(screen.queryByText(/Worn 15 times/)).toBeNull();

    unmount();
    renderSuggestion();
    expect(screen.queryByText(/Worn 15 times/)).toBeNull();
  });

  test('sends the new condition when accepted', async () => {
    const fetchMock = mock(async () => createJsonResponse({ sneaker: { id: SNEAKER_ID } }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    renderSuggestion();

    fireEvent.click(screen.getByRole('button', { name: 'Mark as worn' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [input, init] = fetchMock.mock.calls[0] as unknown as [RequestInfo | URL, RequestInit];
    const request = new Request(input, init);
    expect(request.method).toBe('PATCH');
    expect(new URL(request.url).pathname).toBe(`/api/sneakers/${SNEAKER_ID}`);
    await expect(request.json()).resolves.toEqual({ condition: 'worn' });
  });
});
