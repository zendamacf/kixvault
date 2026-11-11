import type {
  DepartureType,
  SneakerCondition,
  SneakerStatus,
  WishlistPriority,
} from '@kixvault/shared';
import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { i18n } from '@/i18n';
import { api } from './api';

export type Sneaker = {
  id: string;
  userId: string;
  brand: string;
  model: string;
  colorway: string | null;
  nickname: string | null;
  size: number;
  condition: SneakerCondition;
  purchasePrice: number | null;
  purchaseDate: string | null;
  notes: string | null;
  sku: string | null;
  primaryImage: {
    id: string;
    url: string;
  } | null;
  catalogSource: string | null;
  catalogId: string | null;
  catalogUrl: string | null;
  releaseDate: string | null;
  description: string | null;
  currentMarketPrice: number | null;
  pricedAt: string | null;
  gainLoss: number | null;
  wearCount: number;
  /** Purchase price divided by wears. Null when unknown, never worn, or retired. */
  costPerWear: number | null;
  lastWornOn: string | null;
  suggestedCondition: SneakerCondition | null;
  /** Set when the pair left the vault. Null means it is still in the collection. */
  departureType: DepartureType | null;
  departedOn: string | null;
  salePrice: number | null;
  departureNotes: string | null;
  /** Sale price minus purchase price. Only for sold pairs with both prices known. */
  realizedGainLoss: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthUser = {
  id: string;
  email: string;
};

export type WishlistItem = {
  id: string;
  userId: string;
  brand: string;
  model: string;
  colorway: string | null;
  priority: WishlistPriority;
  notes: string | null;
  sku: string | null;
  catalogSource: string | null;
  catalogId: string | null;
  catalogUrl: string | null;
  nickname: string | null;
  releaseDate: string | null;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export const sessionQueryOptions = queryOptions({
  queryKey: ['auth', 'me'],
  queryFn: async () => {
    const response = await api.api.auth.me.$get();

    if (!response.ok) {
      throw new Error(i18n.t('errors.loadSession'));
    }

    return response.json();
  },
});

export const authConfigQueryOptions = queryOptions({
  queryKey: ['auth', 'config'],
  queryFn: async () => {
    const response = await api.api.auth.config.$get();

    if (!response.ok) {
      throw new Error(i18n.t('errors.loadAuthConfig'));
    }

    return response.json();
  },
  staleTime: Number.POSITIVE_INFINITY,
});

export const statsQueryOptions = queryOptions({
  queryKey: ['stats'],
  queryFn: async () => {
    const response = await api.api.stats.$get();

    if (!response.ok) {
      throw new Error(i18n.t('errors.loadStats'));
    }

    return response.json();
  },
});

export const analyticsQueryOptions = queryOptions({
  queryKey: ['stats', 'analytics'],
  queryFn: async () => {
    const response = await api.api.stats.analytics.$get();

    if (!response.ok) {
      throw new Error(i18n.t('errors.loadAnalytics'));
    }

    return response.json();
  },
});

export function sneakersQueryOptions(filters: {
  search?: string;
  condition?: SneakerCondition;
  /** Active pairs by default. */
  status?: SneakerStatus;
  departureType?: DepartureType;
  sort?: string;
  order?: string;
}) {
  return queryOptions({
    queryKey: ['sneakers', filters],
    // Keep the current grid on screen while a new search, filter, or sort loads.
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const response = await api.api.sneakers.$get({
        query: {
          search: filters.search || undefined,
          condition: filters.condition,
          status: filters.status,
          departureType: filters.departureType,
          sort:
            (filters.sort as
              | 'created_at'
              | 'purchase_date'
              | 'purchase_price'
              | 'brand'
              | 'departed_on') ?? 'created_at',
          order: (filters.order as 'asc' | 'desc') ?? 'desc',
        },
      });

      if (!response.ok) {
        throw new Error(i18n.t('errors.loadSneakers'));
      }

      return response.json();
    },
  });
}

export function sneakerQueryOptions(id: string) {
  return queryOptions({
    queryKey: ['sneakers', id],
    queryFn: async () => {
      const response = await api.api.sneakers[':id'].$get({
        param: { id },
      });

      if (!response.ok) {
        throw new Error(i18n.t('errors.loadSneaker'));
      }

      return response.json();
    },
  });
}

export const wishlistQueryOptions = queryOptions({
  queryKey: ['wishlist'],
  queryFn: async () => {
    const response = await api.api.wishlist.$get();

    if (!response.ok) {
      throw new Error(i18n.t('errors.loadGrails'));
    }

    return response.json();
  },
});

export function wishlistItemQueryOptions(id: string) {
  return queryOptions({
    queryKey: ['wishlist', id],
    queryFn: async () => {
      const response = await api.api.wishlist[':id'].$get({
        param: { id },
      });

      if (!response.ok) {
        throw new Error(i18n.t('errors.loadGrail'));
      }

      return response.json();
    },
    enabled: id.length > 0,
  });
}

export const auditEventsQueryOptions = queryOptions({
  queryKey: ['audit', 'events'],
  queryFn: async () => {
    const response = await api.api.audit.$get({
      query: {},
    });

    if (!response.ok) {
      throw new Error(i18n.t('errors.loadActivity'));
    }

    return response.json();
  },
});

export function sneakerPriceHistoryQueryOptions(id: string) {
  return queryOptions({
    queryKey: ['sneakers', id, 'price-history'],
    queryFn: async () => {
      const response = await api.api.sneakers[':id']['price-history'].$get({
        param: { id },
      });

      if (!response.ok) {
        throw new Error(i18n.t('errors.loadPriceHistory'));
      }

      return response.json();
    },
    enabled: id.length > 0,
  });
}

export function wearsQueryOptions(range: { from: string; to: string }) {
  return queryOptions({
    queryKey: ['wears', range],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const response = await api.api.wears.$get({ query: range });

      if (!response.ok) {
        throw new Error(i18n.t('errors.loadWears'));
      }

      return response.json();
    },
  });
}
