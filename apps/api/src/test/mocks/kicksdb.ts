import { mock } from 'bun:test';

type SdkListResponse = {
  data: { data: unknown[] } | null;
  error: unknown;
  response: { status: number };
};

type SdkProductResponse = {
  data: { data: unknown } | null;
  error: unknown;
  response: { status: number };
};

export const mockConfigureClient = mock(() => {});
export const mockGetStockxProducts = mock(
  (): Promise<SdkListResponse> =>
    Promise.resolve({
      data: { data: [] },
      error: null,
      response: { status: 200 },
    }),
);
export const mockGetGoatProducts = mock(
  (): Promise<SdkListResponse> =>
    Promise.resolve({
      data: { data: [] },
      error: null,
      response: { status: 200 },
    }),
);
export const mockGetStockxProduct = mock(
  (): Promise<SdkProductResponse> =>
    Promise.resolve({
      data: null,
      error: { message: 'not found' },
      response: { status: 404 },
    }),
);
export const mockGetGoatProduct = mock(
  (): Promise<SdkProductResponse> =>
    Promise.resolve({
      data: null,
      error: { message: 'not found' },
      response: { status: 404 },
    }),
);

export const mockIsKicksdbConfigured = mock(() => false);
export const mockEnsureKicksdbClient = mock(() => {});

export function mockKicksdbSdk() {
  mock.module('@kicksdb/sdk', () => ({
    configureClient: mockConfigureClient,
    getStockxProducts: mockGetStockxProducts,
    getGoatProducts: mockGetGoatProducts,
    getStockxProduct: mockGetStockxProduct,
    getGoatProduct: mockGetGoatProduct,
  }));
}

export function resetKicksdbSdkMocks() {
  mockConfigureClient.mockClear();
  mockGetStockxProducts.mockClear();
  mockGetGoatProducts.mockClear();
  mockGetStockxProduct.mockClear();
  mockGetGoatProduct.mockClear();
  mockIsKicksdbConfigured.mockClear();
  mockEnsureKicksdbClient.mockClear();
  mockIsKicksdbConfigured.mockReturnValue(false);
}
