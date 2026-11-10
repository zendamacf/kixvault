import type { CatalogProductDetail, CatalogSearchResult } from '@kixvault/shared';
import { catalogProductDetailSchema } from '@kixvault/shared';
import { queryOptions } from '@tanstack/react-query';
import { i18n } from '@/i18n';
import { api, parseApiError } from './api';

export type CatalogSearchResponse = {
  results: CatalogSearchResult[];
  unavailable?: boolean;
};

export type CatalogProductResponse = CatalogProductDetail & {
  unavailable?: boolean;
};

export function catalogSearchQueryOptions(query: string) {
  return queryOptions({
    queryKey: ['catalog', 'search', query],
    queryFn: async (): Promise<CatalogSearchResponse> => {
      const response = await api.api.catalog.search.$get({
        query: { q: query, limit: '10' },
      });

      if (response.status === 503) {
        return { results: [], unavailable: true };
      }

      if (!response.ok) {
        throw new Error(await parseApiError(response, i18n.t('errors.catalogSearch')));
      }

      const data = await response.json();
      return 'results' in data ? data : { results: [] };
    },
    enabled: query.length >= 3,
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function catalogProductQueryOptions(catalogId: string) {
  return queryOptions({
    queryKey: ['catalog', 'product', catalogId],
    queryFn: async (): Promise<CatalogProductResponse> => {
      const response = await api.api.catalog.products[':catalogId'].$get({
        param: { catalogId },
      });

      if (response.status === 503) {
        return {
          product: {
            catalogSource: 'kicksdb:stockx',
            catalogId,
            title: '',
            brand: '',
            model: '',
            colorway: null,
            nickname: null,
            sku: '',
            imageUrl: null,
            gallery360Urls: [],
            releaseDate: null,
            description: null,
          },
          variantPrices: [],
          unavailable: true,
        };
      }

      if (!response.ok) {
        throw new Error(await parseApiError(response, i18n.t('errors.loadCatalogProduct')));
      }

      const data = await response.json();
      return catalogProductDetailSchema.parse(data);
    },
    enabled: catalogId.length > 0,
    staleTime: 24 * 60 * 60 * 1000,
  });
}
