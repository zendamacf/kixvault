import { Hono } from 'hono';
import { createSneakerImageResponse } from '../lib/sneaker-image-response';
import { getSneakerImageByKey } from '../lib/sneaker-images';
import { parseSneakerId } from '../lib/sneakers';
import type { ApiEnv } from '../types';

function parseSortOrder(value: string): number | null {
  const sortOrder = Number(value);

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    return null;
  }

  return sortOrder;
}

export const imageRoutes = new Hono<ApiEnv>().get('/:sneakerId/:sortOrder', async (c) => {
  const sneakerId = parseSneakerId(c.req.param('sneakerId'));
  const sortOrder = parseSortOrder(c.req.param('sortOrder'));

  if (!sneakerId || sortOrder === null) {
    return c.json({ error: 'Invalid image path' }, 400);
  }

  const image = await getSneakerImageByKey(sneakerId, sortOrder);
  const response = await createSneakerImageResponse(image);

  if (response.status === 404) {
    return c.json({ error: 'Image not found' }, { status: 404 });
  }

  return response;
});
