import { join } from 'node:path';
import { env } from './env';

export function buildSneakerImageStoragePath(sneakerId: string, sortOrder: number): string {
  return join(sneakerId, `${sortOrder}.webp`);
}

export function getSneakerImageAbsolutePath(storagePath: string): string {
  return join(env.imageStoragePath, storagePath);
}
