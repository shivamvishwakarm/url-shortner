import { z } from 'zod';

// Reserved words that shouldn't be usable as aliases (collide with real routes)
const RESERVED_ALIASES = ['shorten', 'api', 'admin', 'health', 'favicon.ico'];

export const shortenBodySchema = z.object({
  url: z
    .httpUrl('url must be a valid http/https URL')
    .trim(),
  alias: z
    .string()
    .trim()
    .min(8, 'alias must be at least 8 characters')
    .max(8, 'alias must be at most 8 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'alias may only contain letters, numbers, hyphens, and underscores')
    .refine((val) => !RESERVED_ALIASES.includes(val.toLowerCase()), {
      message: 'not available',
    })
    .optional(),
});

export const shortIdParamSchema = z.object({
  shortId: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid shortId format'),
});

export type ShortenBody = z.infer<typeof shortenBodySchema>;
export type ShortIdParam = z.infer<typeof shortIdParamSchema>;