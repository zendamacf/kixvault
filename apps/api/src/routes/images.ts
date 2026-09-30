import type { Context } from 'hono';
import { Hono } from 'hono';
import { getSneakerOwnerId } from '../lib/sneaker-access';
import { getSneakerGallery360ImageByKey } from '../lib/sneaker-gallery-360-images';
import { createSneakerImageResponse } from '../lib/sneaker-image-response';
import { getSneakerPrimaryImage } from '../lib/sneaker-images';
import { parseSneakerId } from '../lib/sneakers';
import { requireAuth, sessionMiddleware } from '../middleware/session';
import type { ApiEnv } from '../types';

function parseSortOrder(value: string): number | null {
  const sortOrder = Number(value);

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    return null;
  }

  return sortOrder;
}

async function authorizeSneakerImageAccess(
  c: Context<ApiEnv>,
  sneakerId: string,
): Promise<Response | null> {
  const user = c.get('user');
  const ownerId = await getSneakerOwnerId(sneakerId);

  if (!ownerId) {
    return c.json({ error: 'Image not found' }, 404);
  }

  if (!user || ownerId !== user.id) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  return null;
}

export const imageRoutes = new Hono<ApiEnv>()
  .use(sessionMiddleware)
  .use(requireAuth)
  .get('/:sneakerId/360/:sortOrder', async (c) => {
    const sneakerId = parseSneakerId(c.req.param('sneakerId'));
    const sortOrder = parseSortOrder(c.req.param('sortOrder'));

    if (!sneakerId || sortOrder === null) {
      return c.json({ error: 'Invalid image path' }, 400);
    }

    const denied = await authorizeSneakerImageAccess(c, sneakerId);

    if (denied) {
      return denied;
    }

    const image = await getSneakerGallery360ImageByKey(sneakerId, sortOrder);
    const response = await createSneakerImageResponse(image);

    if (response.status === 404) {
      return c.json({ error: 'Image not found' }, { status: 404 });
    }

    return response;
  })
  .get('/:sneakerId', async (c) => {
    const sneakerId = parseSneakerId(c.req.param('sneakerId'));

    if (!sneakerId) {
      return c.json({ error: 'Invalid image path' }, 400);
    }

    const denied = await authorizeSneakerImageAccess(c, sneakerId);

    if (denied) {
      return denied;
    }

    const image = await getSneakerPrimaryImage(sneakerId);
    const response = await createSneakerImageResponse(image);

    if (response.status === 404) {
      return c.json({ error: 'Image not found' }, { status: 404 });
    }

    return response;
  });
