import { z } from 'zod';

export const MAX_EMAIL_LENGTH = 254;
export const INVALID_EMAIL_MESSAGE = 'Enter a valid email address';

/** Trims and lowercases so one address always maps to one account. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(MAX_EMAIL_LENGTH)
  .pipe(z.email({ error: INVALID_EMAIL_MESSAGE }));

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1).max(256),
});

export const resendVerificationSchema = z.object({
  email: emailSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1).max(256),
  password: registerSchema.shape.password,
});

/** Error code returned by login when the account has not confirmed its email yet. */
export const EMAIL_NOT_VERIFIED_CODE = 'email_not_verified';

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
