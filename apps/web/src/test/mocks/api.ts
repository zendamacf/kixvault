import { mock } from 'bun:test';

export function createJsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

type FetchHandlers = {
  authMe?: () => Response | Promise<Response>;
  stats?: () => Response | Promise<Response>;
  sneakers?: (url: URL) => Response | Promise<Response>;
  catalogSearch?: (url: URL) => Response | Promise<Response>;
  catalogProduct?: (url: URL) => Response | Promise<Response>;
};

export function installFetchMock(handlers: FetchHandlers = {}) {
  globalThis.fetch = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);

    if (url.pathname === '/api/auth/me' && handlers.authMe) {
      return handlers.authMe();
    }

    if (url.pathname === '/api/stats' && handlers.stats) {
      return handlers.stats();
    }

    if (url.pathname.startsWith('/api/sneakers') && handlers.sneakers) {
      return handlers.sneakers(url);
    }

    if (url.pathname === '/api/catalog/search' && handlers.catalogSearch) {
      return handlers.catalogSearch(url);
    }

    if (url.pathname.startsWith('/api/catalog/products/') && handlers.catalogProduct) {
      return handlers.catalogProduct(url);
    }

    return createJsonResponse({ error: `Unhandled fetch: ${url.pathname}` }, 404);
  }) as unknown as typeof fetch;
}

export async function parseApiError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}
