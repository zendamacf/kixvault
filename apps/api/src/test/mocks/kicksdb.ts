import { mock } from 'bun:test';

type SdkResponse = {
  data: { data: unknown[] } | null;
  error: unknown;
  response: { status: number };
};

export const mockConfigureClient = mock(() => {});
export const mockGetStockxProducts = mock(
  (): Promise<SdkResponse> =>
    Promise.resolve({
      data: { data: [] },
      error: null,
      response: { status: 200 },
    }),
);
export const mockGetGoatProducts = mock(
  (): Promise<SdkResponse> =>
    Promise.resolve({
      data: { data: [] },
      error: null,
      response: { status: 200 },
    }),
);

export function mockKicksdbSdk() {
  mock.module('@kicksdb/sdk', () => ({
    configureClient: mockConfigureClient,
    getStockxProducts: mockGetStockxProducts,
    getGoatProducts: mockGetGoatProducts,
  }));
}

export function resetKicksdbSdkMocks() {
  mockConfigureClient.mockClear();
  mockGetStockxProducts.mockClear();
  mockGetGoatProducts.mockClear();
}
