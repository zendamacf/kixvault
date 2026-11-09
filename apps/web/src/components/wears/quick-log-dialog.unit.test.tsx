import { afterEach, describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createJsonResponse } from '@/test/mocks/api';
import { QuickLogDialog } from './quick-log-dialog';

afterEach(() => {
  cleanup();
});

const baseSneaker = {
  userId: 'user-1',
  colorway: null,
  nickname: null,
  size: 10,
  condition: 'worn',
  primaryImage: null,
  wearCount: 0,
  lastWornOn: null,
};

const sneakers = [
  { ...baseSneaker, id: '11111111-1111-4111-8111-111111111111', brand: 'Nike', model: 'Dunk Low' },
  {
    ...baseSneaker,
    id: '22222222-2222-4222-8222-222222222222',
    brand: 'Adidas',
    model: 'Samba',
    wearCount: 3,
    lastWornOn: '2026-11-01',
  },
];

function installFetch() {
  const fetchMock = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);

    if (url.pathname === '/api/sneakers') {
      return createJsonResponse({ sneakers });
    }

    return createJsonResponse({
      wear: { id: 'w1', sneakerId: sneakers[1].id, wornOn: '2026-11-09' },
      created: true,
      conditionChanged: false,
      sneaker: { ...sneakers[1], condition: 'worn' },
    });
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function hasPostTo(fetchMock: ReturnType<typeof installFetch>, sneakerId: string): boolean {
  return fetchMock.mock.calls.some(([input, init]) => {
    const request = new Request(input, init);
    return request.method === 'POST' && request.url.endsWith(`/api/wears/${sneakerId}`);
  });
}

function renderDialog(onOpenChange = mock(() => {})) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <QuickLogDialog open onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  );

  return onOpenChange;
}

describe('QuickLogDialog', () => {
  test('lists recently worn pairs first', async () => {
    installFetch();
    renderDialog();

    const options = await screen.findAllByRole('option');

    expect(options[0].textContent).toContain('Samba');
    expect(options[1].textContent).toContain('Dunk Low');
  });

  test('filters pairs as you type', async () => {
    installFetch();
    renderDialog();
    await screen.findAllByRole('option');

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'dunk' } });

    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByText('Dunk Low')).toBeTruthy();
  });

  test('shows an empty message when nothing matches', async () => {
    installFetch();
    renderDialog();
    await screen.findAllByRole('option');

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'yeezy' } });

    expect(screen.getByText('No pairs match that search.')).toBeTruthy();
  });

  test('logs the highlighted pair on Enter and closes', async () => {
    const fetchMock = installFetch();
    const onOpenChange = renderDialog();
    await screen.findAllByRole('option');

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });

    await waitFor(() => {
      const posted = hasPostTo(fetchMock, sneakers[0].id);
      expect(posted).toBe(true);
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test('logs a pair when tapped', async () => {
    const fetchMock = installFetch();
    renderDialog();

    fireEvent.click(await screen.findByText('Samba'));

    await waitFor(() => {
      const posted = hasPostTo(fetchMock, sneakers[1].id);
      expect(posted).toBe(true);
    });
  });
});
