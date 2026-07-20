import { z } from 'zod';

export const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const verifyEmailPendingSearchSchema = z.object({
  email: z.string().email().optional(),
});
