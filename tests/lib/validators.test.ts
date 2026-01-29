import { describe, it, expect } from 'vitest';
import {
  ccusageDailyEntrySchema,
  usageSubmitSchema,
  postCreateSchema,
  postUpdateSchema,
  commentSchema,
} from '@/lib/validators/usage';

describe('ccusageDailyEntrySchema', () => {
  it('validates correct usage data', () => {
    const validData = {
      date: '2025-01-28',
      models: ['claude-3-5-sonnet-20241022'],
      inputTokens: 50000,
      outputTokens: 10000,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      totalTokens: 60000,
      costUSD: 5.25,
    };

    const result = ccusageDailyEntrySchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects invalid date format', () => {
    const invalidData = {
      date: '01-28-2025', // Wrong format
      models: ['claude-3-5-sonnet-20241022'],
      inputTokens: 50000,
      outputTokens: 10000,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      totalTokens: 60000,
      costUSD: 5.25,
    };

    const result = ccusageDailyEntrySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects negative token counts', () => {
    const invalidData = {
      date: '2025-01-28',
      models: ['claude-3-5-sonnet-20241022'],
      inputTokens: -100, // Negative
      outputTokens: 10000,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      totalTokens: 60000,
      costUSD: 5.25,
    };

    const result = ccusageDailyEntrySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects negative cost', () => {
    const invalidData = {
      date: '2025-01-28',
      models: ['claude-3-5-sonnet-20241022'],
      inputTokens: 50000,
      outputTokens: 10000,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      totalTokens: 60000,
      costUSD: -5.25, // Negative
    };

    const result = ccusageDailyEntrySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('allows empty models array', () => {
    const validData = {
      date: '2025-01-28',
      models: [],
      inputTokens: 0,
      outputTokens: 0,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      totalTokens: 0,
      costUSD: 0,
    };

    const result = ccusageDailyEntrySchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});

describe('usageSubmitSchema', () => {
  const validUsageData = {
    date: '2025-01-28',
    models: ['claude-3-5-sonnet-20241022'],
    inputTokens: 50000,
    outputTokens: 10000,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
    totalTokens: 60000,
    costUSD: 5.25,
  };

  it('validates CLI submission', () => {
    const result = usageSubmitSchema.safeParse({
      date: '2025-01-28',
      data: validUsageData,
      source: 'cli',
    });

    expect(result.success).toBe(true);
  });

  it('validates web submission', () => {
    const result = usageSubmitSchema.safeParse({
      date: '2025-01-28',
      data: validUsageData,
      source: 'web',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid source', () => {
    const result = usageSubmitSchema.safeParse({
      date: '2025-01-28',
      data: validUsageData,
      source: 'invalid',
    });

    expect(result.success).toBe(false);
  });

  it('allows optional hash field', () => {
    const result = usageSubmitSchema.safeParse({
      date: '2025-01-28',
      data: validUsageData,
      source: 'cli',
      hash: 'abc123def456',
    });

    expect(result.success).toBe(true);
  });
});

describe('postCreateSchema', () => {
  it('validates post with all fields', () => {
    const result = postCreateSchema.safeParse({
      daily_usage_id: '123e4567-e89b-12d3-a456-426614174000',
      description: 'Built a new feature',
      images: ['https://example.com/image1.jpg'],
    });

    expect(result.success).toBe(true);
  });

  it('validates post with only required fields', () => {
    const result = postCreateSchema.safeParse({
      daily_usage_id: '123e4567-e89b-12d3-a456-426614174000',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID', () => {
    const result = postCreateSchema.safeParse({
      daily_usage_id: 'not-a-uuid',
    });

    expect(result.success).toBe(false);
  });

  it('rejects description over 500 chars', () => {
    const result = postCreateSchema.safeParse({
      daily_usage_id: '123e4567-e89b-12d3-a456-426614174000',
      description: 'a'.repeat(501),
    });

    expect(result.success).toBe(false);
  });

  it('rejects more than 4 images', () => {
    const result = postCreateSchema.safeParse({
      daily_usage_id: '123e4567-e89b-12d3-a456-426614174000',
      images: [
        'https://example.com/1.jpg',
        'https://example.com/2.jpg',
        'https://example.com/3.jpg',
        'https://example.com/4.jpg',
        'https://example.com/5.jpg', // 5th image
      ],
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid image URLs', () => {
    const result = postCreateSchema.safeParse({
      daily_usage_id: '123e4567-e89b-12d3-a456-426614174000',
      images: ['not-a-url'],
    });

    expect(result.success).toBe(false);
  });
});

describe('postUpdateSchema', () => {
  it('validates update with description', () => {
    const result = postUpdateSchema.safeParse({
      description: 'Updated description',
    });

    expect(result.success).toBe(true);
  });

  it('allows null description', () => {
    const result = postUpdateSchema.safeParse({
      description: null,
    });

    expect(result.success).toBe(true);
  });

  it('validates empty update', () => {
    const result = postUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('commentSchema', () => {
  it('validates valid comment', () => {
    const result = commentSchema.safeParse({
      content: 'Great work!',
    });

    expect(result.success).toBe(true);
  });

  it('rejects empty comment', () => {
    const result = commentSchema.safeParse({
      content: '',
    });

    expect(result.success).toBe(false);
  });

  it('rejects comment over 500 chars', () => {
    const result = commentSchema.safeParse({
      content: 'a'.repeat(501),
    });

    expect(result.success).toBe(false);
  });
});
