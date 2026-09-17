import { z } from 'zod'
import { AppError } from '../util/errors.ts'
import { ERROR_CODES } from '../../../shared/types.ts'

export const LoginBodySchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'Invalid credentials')
      .max(64, 'Invalid credentials')
      .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid credentials'),
    password: z
      .string()
      .min(8, 'Invalid credentials')
      .max(128, 'Invalid credentials')
      .refine((value) => !/[\u0000-\u001F]/.test(value), 'Invalid credentials'),
  })
  .strict()

export function parseLoginBody(raw: unknown): { username: string; password: string } {
  const parsed = LoginBodySchema.safeParse(raw)
  if (!parsed.success) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid username or password format', 400)
  }
  return parsed.data
}
