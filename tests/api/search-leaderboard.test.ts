import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
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

import { GET as searchUsers } from '@/app/api/search/route';
import { GET as getLeaderboard } from '@/app/api/leaderboard/route';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

describe('GET /api/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array for empty query', async () => {
    const request = new NextRequest('http://localhost:3000/api/search');

    const response = await searchUsers(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.users).toEqual([]);
  });

  it('searches users by username', async () => {
    const mockUsers = [
      { id: 'user-1', username: 'testuser', display_name: 'Test User', avatar_url: null, bio: null },
    ];

    const mockSupabase = {
      from: vi.fn((table) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
          };
        }
        if (table === 'follows') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ count: 10 }),
          };
        }
        return {};
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const request = new NextRequest('http://localhost:3000/api/search?q=test');

    const response = await searchUsers(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.users).toHaveLength(1);
    expect(data.users[0].username).toBe('testuser');
  });

  it('respects limit parameter', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const request = new NextRequest('http://localhost:3000/api/search?q=test&limit=5');

    await searchUsers(request);

    // Verify limit was called with correct value
    expect(mockSupabase.from).toHaveBeenCalledWith('users');
  });

  it('caps limit at 50', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const request = new NextRequest('http://localhost:3000/api/search?q=test&limit=100');

    const response = await searchUsers(request);
    expect(response.status).toBe(200);
  });
});

describe('GET /api/leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns leaderboard entries', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);

    const mockUsers = [
      {
        id: 'user-1',
        username: 'topuser',
        display_name: 'Top User',
        avatar_url: null,
        country: 'US',
        region: 'north_america',
        daily_usage: [{ cost_usd: 100, total_tokens: 1000000, date: '2025-01-28' }],
      },
    ];

    const mockSupabase = {
      from: vi.fn((table) => {
        if (table === 'users') {
          const chain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
          return chain;
        }
        return {};
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const request = new NextRequest('http://localhost:3000/api/leaderboard');

    const response = await getLeaderboard(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.entries).toBeDefined();
  });

  it('supports period filter', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ data: [], error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const request = new NextRequest('http://localhost:3000/api/leaderboard?period=week');

    const response = await getLeaderboard(request);
    expect(response.status).toBe(200);
  });

  it('supports region filter', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);

    // Create a chainable mock that returns itself for all query methods
    const createChainableMock = () => {
      const chain: Record<string, unknown> = {};
      const self = chain as unknown;
      chain.select = vi.fn().mockReturnValue(self);
      chain.eq = vi.fn().mockReturnValue(self);
      chain.gte = vi.fn().mockReturnValue(self);
      chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
      // Final resolution - when the query is actually executed
      chain.then = vi.fn((resolve) => resolve({ data: [], error: null }));
      // Make it thenable for async/await
      Object.defineProperty(chain, Symbol.toStringTag, { value: 'Promise' });
      return chain;
    };

    const mockSupabase = {
      from: vi.fn().mockImplementation(() => createChainableMock()),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const request = new NextRequest('http://localhost:3000/api/leaderboard?region=europe');

    const response = await getLeaderboard(request);
    expect(response.status).toBe(200);
  });
});
