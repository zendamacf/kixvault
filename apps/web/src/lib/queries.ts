import { queryOptions } from '@tanstack/react-query';
import { api } from './api';

export type Sneaker = {
  id: string;
  userId: string;
  brand: string;
  model: string;
  colorway: string | null;
  nickname: string | null;
  size: number;
  condition: string;
  purchasePrice: number | null;
  purchaseDate: string | null;
  notes: string | null;
  sku: string | null;
  imageUrl: string | null;
  catalogSource: string | null;
  catalogId: string | null;
  catalogUrl: string | null;
  releaseDate: string | null;
  description: string | null;
  currentMarketPrice: number | null;
  pricedAt: string | null;
  gainLoss: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthUser = {
  id: string;
  email: string;
};

export const sessionQueryOptions = queryOptions({
  queryKey: ['auth', 'me'],
  queryFn: async () => {
    const response = await api.api.auth.me.$get();

    if (!response.ok) {
      throw new Error('Failed to load session');
    }

    return response.json();
  },
});

export const authConfigQueryOptions = queryOptions({
  queryKey: ['auth', 'config'],
  queryFn: async () => {
    const response = await api.api.auth.config.$get();

    if (!response.ok) {
      throw new Error('Failed to load auth config');
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
      throw new Error('Failed to load stats');
    }

    return response.json();
  },
});

export function sneakersQueryOptions(filters: {
  search?: string;
  condition?: string;
  sort?: string;
  order?: string;
}) {
  return queryOptions({
    queryKey: ['sneakers', filters],
    queryFn: async () => {
      const response = await api.api.sneakers.$get({
        query: {
          search: filters.search || undefined,
          condition: filters.condition as
            | 'deadstock'
            | 'lightly_worn'
            | 'worn'
            | 'beat'
            | undefined,
          sort:
            (filters.sort as 'created_at' | 'purchase_date' | 'purchase_price' | 'brand') ??
            'created_at',
          order: (filters.order as 'asc' | 'desc') ?? 'desc',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load sneakers');
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
        throw new Error('Failed to load sneaker');
      }

      return response.json();
    },
  });
}
