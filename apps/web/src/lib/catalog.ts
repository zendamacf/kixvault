import type { CatalogSearchResult } from "@kixvault/shared";
import { queryOptions } from "@tanstack/react-query";
import { api, parseApiError } from "./api";

export type CatalogSearchResponse = {
  results: CatalogSearchResult[];
  unavailable?: boolean;
};

export function catalogSearchQueryOptions(query: string) {
  return queryOptions({
    queryKey: ["catalog", "search", query],
    queryFn: async (): Promise<CatalogSearchResponse> => {
      const response = await api.api.catalog.search.$get({
        query: { q: query, limit: 10 },
      });

      if (response.status === 503) {
        return { results: [], unavailable: true };
      }

      if (!response.ok) {
        throw new Error(await parseApiError(response, "Catalog search failed"));
      }

      const data = await response.json();
      return "results" in data ? data : { results: [] };
    },
    enabled: query.length >= 2,
    staleTime: 24 * 60 * 60 * 1000,
  });
}
