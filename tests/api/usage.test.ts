import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies before importing routes
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  clerkClient: {
    users: {
      getUserList: vi.fn(),
      updateUser: vi.fn(),
      getUser: vi.fn(),
    },
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { POST as submitUsage } from '@/app/api/usage/submit/route';
import { GET as getTodayUsage } from '@/app/api/usage/today/route';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

describe('POST /api/usage/submit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);

    const request = new NextRequest('http://localhost:3000/api/usage/submit', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await submitUsage(request);
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid data', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as never);

    const request = new NextRequest('http://localhost:3000/api/usage/submit', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
    });

    const response = await submitUsage(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Invalid data');
  });

  it('returns 400 for non-today date', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as never);

    const request = new NextRequest('http://localhost:3000/api/usage/submit', {
      method: 'POST',
      body: JSON.stringify({
        date: '2020-01-01', // Old date
        data: {
          date: '2020-01-01',
          models: ['claude-3-5-sonnet-20241022'],
          inputTokens: 50000,
          outputTokens: 10000,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          totalTokens: 60000,
          costUSD: 5.25,
        },
        source: 'web',
      }),
    });

    const response = await submitUsage(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('today');
  });

  it('returns 404 when user not found', async () => {
    const today = new Date().toISOString().split('T')[0];
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as never);

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const request = new NextRequest('http://localhost:3000/api/usage/submit', {
      method: 'POST',
      body: JSON.stringify({
        date: today,
        data: {
          date: today,
          models: ['claude-3-5-sonnet-20241022'],
          inputTokens: 50000,
          outputTokens: 10000,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          totalTokens: 60000,
          costUSD: 5.25,
        },
        source: 'web',
      }),
    });

    const response = await submitUsage(request);
    expect(response.status).toBe(404);
  });

  it('successfully submits usage data', async () => {
    const today = new Date().toISOString().split('T')[0];
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as never);

    const mockSupabase = {
      from: vi.fn((table) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-123' },
              error: null,
            }),
          };
        }
        if (table === 'daily_usage') {
          return {
            upsert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'usage-123' },
              error: null,
            }),
          };
        }
        if (table === 'posts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
            insert: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'post-123' },
              error: null,
            }),
          };
        }
        return {};
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const request = new NextRequest('http://localhost:3000/api/usage/submit', {
      method: 'POST',
      body: JSON.stringify({
        date: today,
        data: {
          date: today,
          models: ['claude-3-5-sonnet-20241022'],
          inputTokens: 50000,
          outputTokens: 10000,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          totalTokens: 60000,
          costUSD: 5.25,
        },
        source: 'web',
      }),
    });

    const response = await submitUsage(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.usage_id).toBe('usage-123');
  });
});

describe('GET /api/usage/today', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);

    const response = await getTodayUsage();
    expect(response.status).toBe(401);
  });

  it('returns 404 when user not found', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as never);

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const response = await getTodayUsage();
    expect(response.status).toBe(404);
  });

  it('returns null when no usage for today', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as never);

    const mockSupabase = {
      from: vi.fn((table) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-123' },
              error: null,
            }),
          };
        }
        if (table === 'daily_usage') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        return {};
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const response = await getTodayUsage();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toBeNull();
  });
});
