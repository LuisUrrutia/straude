import { z } from 'zod';

// ccusage daily entry schema
export const ccusageDailyEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  models: z.array(z.string()),
  inputTokens: z.number().int().min(0),
  outputTokens: z.number().int().min(0),
  cacheCreationTokens: z.number().int().min(0),
  cacheReadTokens: z.number().int().min(0),
  totalTokens: z.number().int().min(0),
  costUSD: z.number().min(0),
});

// Usage submission schema
export const usageSubmitSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  data: ccusageDailyEntrySchema,
  hash: z.string().optional(), // SHA-256 hash (CLI only)
  source: z.enum(['cli', 'web']),
});

// Post creation schema
export const postCreateSchema = z.object({
  daily_usage_id: z.string().uuid(),
  description: z.string().max(500).optional(),
  images: z.array(z.string().url()).max(4).optional(),
});

// Post update schema
export const postUpdateSchema = z.object({
  description: z.string().max(500).optional().nullable(),
  images: z.array(z.string().url()).max(4).optional(),
});

// Comment schema
export const commentSchema = z.object({
  content: z.string().min(1).max(500),
});

export type CcusageDailyEntry = z.infer<typeof ccusageDailyEntrySchema>;
export type UsageSubmitInput = z.infer<typeof usageSubmitSchema>;
export type PostCreateInput = z.infer<typeof postCreateSchema>;
export type PostUpdateInput = z.infer<typeof postUpdateSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
