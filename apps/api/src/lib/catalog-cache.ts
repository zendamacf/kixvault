import type { CatalogSearchResult } from '@kixvault/shared';
import Redis from 'ioredis';
import { env } from './env';

const CACHE_KEY_PREFIX = 'catalog:search:';

export type CatalogSearchCache = {
  get(key: string): Promise<CatalogSearchResult[] | null>;
  set(key: string, results: CatalogSearchResult[], ttlMs: number): Promise<void>;
  clear(): Promise<void>;
};

class InMemoryCatalogSearchCache implements CatalogSearchCache {
  private readonly entries = new Map<
    string,
    { results: CatalogSearchResult[]; expiresAt: number }
  >();

  async get(key: string): Promise<CatalogSearchResult[] | null> {
    const entry = this.entries.get(key);

    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }

    return entry.results;
  }

  async set(key: string, results: CatalogSearchResult[], ttlMs: number): Promise<void> {
    this.entries.set(key, {
      results,
      expiresAt: Date.now() + ttlMs,
    });
  }

  async clear(): Promise<void> {
    this.entries.clear();
  }
}

class RedisCatalogSearchCache implements CatalogSearchCache {
  private readonly client: Redis;

  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
  }

  private toRedisKey(key: string): string {
    return `${CACHE_KEY_PREFIX}${key}`;
  }

  async get(key: string): Promise<CatalogSearchResult[] | null> {
    const value = await this.client.get(this.toRedisKey(key));

    if (!value) {
      return null;
    }

    return JSON.parse(value) as CatalogSearchResult[];
  }

  async set(key: string, results: CatalogSearchResult[], ttlMs: number): Promise<void> {
    await this.client.set(this.toRedisKey(key), JSON.stringify(results), 'PX', ttlMs);
  }

  async clear(): Promise<void> {
    const keys = await this.client.keys(`${CACHE_KEY_PREFIX}*`);

    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }
}

let cache: CatalogSearchCache | null = null;

export function getCatalogSearchCache(): CatalogSearchCache {
  if (!cache) {
    cache = env.redisUrl
      ? new RedisCatalogSearchCache(env.redisUrl)
      : new InMemoryCatalogSearchCache();
  }

  return cache;
}

export function resetCatalogSearchCacheForTests(): void {
  cache = new InMemoryCatalogSearchCache();
}
