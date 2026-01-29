import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Integration tests for complete user flows
 * These tests verify end-to-end behavior across multiple API calls
 */

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// Helper to create a consistent mock Supabase client for testing flows
function createFlowMockClient(mockData: Record<string, unknown> = {}) {
  const users = mockData.users || [];
  const posts = mockData.posts || [];
  const usage = mockData.usage || [];
  const follows = mockData.follows || [];
  const likes = mockData.likes || [];
  const comments = mockData.comments || [];

  return {
    from: vi.fn((table: string) => {
      const createChain = (data: unknown[] = []) => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: Array.isArray(data) && data.length > 0 ? data[0] : null,
          error: null,
        }),
        maybeSingle: vi.fn().mockResolvedValue({
          data: Array.isArray(data) && data.length > 0 ? data[0] : null,
          error: null,
        }),
      });

      switch (table) {
        case 'users':
          return createChain(users as unknown[]);
        case 'posts':
          return createChain(posts as unknown[]);
        case 'daily_usage':
          return createChain(usage as unknown[]);
        case 'follows':
          return createChain(follows as unknown[]);
        case 'likes':
          return createChain(likes as unknown[]);
        case 'comments':
          return createChain(comments as unknown[]);
        default:
          return createChain([]);
      }
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}

describe('User Registration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('new user can complete onboarding', async () => {
    // 1. User signs up via Clerk (simulated by webhook)
    // 2. User completes onboarding form
    // 3. User is redirected to feed

    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-new-user' } as never);

    // Simulate checking username availability
    const mockClient1 = createFlowMockClient({ users: [] });
    vi.mocked(createClient).mockResolvedValue(mockClient1 as never);

    const { GET: checkUsername } = await import('@/app/api/users/check-username/route');

    const checkRequest = new NextRequest(
      'http://localhost:3000/api/users/check-username?username=newuser123'
    );
    const checkResponse = await checkUsername(checkRequest);
    expect(checkResponse.status).toBe(200);
    const checkData = await checkResponse.json();
    expect(checkData.available).toBe(true);

    // Simulate completing onboarding
    const mockClient2 = {
      ...createFlowMockClient({ users: [] }),
      from: vi.fn((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            update: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-new', username: 'newuser123', onboarding_completed: true },
              error: null,
            }),
          };
        }
        return createFlowMockClient().from(table);
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockClient2 as never);

    const { POST: onboarding } = await import('@/app/api/users/me/onboarding/route');

    const onboardingRequest = new NextRequest(
      'http://localhost:3000/api/users/me/onboarding',
      {
        method: 'POST',
        body: JSON.stringify({
          username: 'newuser123',
          country: 'US',
          region: 'north_america',
          is_public: true,
          bio: 'Hello world!',
          link: null,
          timezone: 'America/New_York',
        }),
      }
    );

    const onboardingResponse = await onboarding(onboardingRequest);
    expect(onboardingResponse.status).toBe(200);
  });
});

describe('Usage Submission Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('user can submit daily usage and it creates a post', async () => {
    const today = new Date().toISOString().split('T')[0];
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as never);

    // Mock client that simulates:
    // 1. Finding the user
    // 2. Upserting usage data
    // 3. Creating a post
    const mockClient = {
      from: vi.fn((table: string) => {
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
              data: { id: 'usage-123', date: today },
              error: null,
            }),
          };
        }
        if (table === 'posts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
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
    vi.mocked(createClient).mockResolvedValue(mockClient as never);

    const { POST: submitUsage } = await import('@/app/api/usage/submit/route');

    const submitRequest = new NextRequest('http://localhost:3000/api/usage/submit', {
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
        source: 'cli',
      }),
    });

    const submitResponse = await submitUsage(submitRequest);
    expect(submitResponse.status).toBe(200);

    const submitData = await submitResponse.json();
    expect(submitData.usage_id).toBe('usage-123');
    expect(submitData.post_url).toBe('/posts/post-123');
  });
});

describe('Social Interaction Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('user can follow another user, like their post, and comment', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-follower' } as never);

    // Step 1: Follow a user
    let userCallCount = 0;
    const followMockClient = {
      from: vi.fn((table: string) => {
        if (table === 'users') {
          userCallCount++;
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: userCallCount === 1 ? 'follower-123' : 'followee-456' },
              error: null,
            }),
          };
        }
        if (table === 'follows') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      }),
    };
    vi.mocked(createClient).mockResolvedValue(followMockClient as never);

    const { POST: followUser } = await import('@/app/api/follow/[username]/route');

    const followRequest = new NextRequest('http://localhost:3000/api/follow/targetuser');
    const followResponse = await followUser(followRequest, {
      params: Promise.resolve({ username: 'targetuser' }),
    });

    expect(followResponse.status).toBe(200);
    const followData = await followResponse.json();
    expect(followData.following).toBe(true);

    // Step 2: Like a post
    const likeMockClient = {
      from: vi.fn((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'follower-123' },
              error: null,
            }),
          };
        }
        if (table === 'posts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'post-123' },
              error: null,
            }),
          };
        }
        if (table === 'likes') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {
          select: vi.fn().mockResolvedValue({ count: 1 }),
        };
      }),
    };
    vi.mocked(createClient).mockResolvedValue(likeMockClient as never);

    const { POST: likePost } = await import('@/app/api/posts/[id]/like/route');

    const likeRequest = new NextRequest('http://localhost:3000/api/posts/post-123/like');
    const likeResponse = await likePost(likeRequest, {
      params: Promise.resolve({ id: 'post-123' }),
    });

    expect(likeResponse.status).toBe(200);
    const likeData = await likeResponse.json();
    expect(likeData.liked).toBe(true);

    // Step 3: Add a comment
    const commentMockClient = {
      from: vi.fn((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'follower-123' },
              error: null,
            }),
          };
        }
        if (table === 'posts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'post-123' },
              error: null,
            }),
          };
        }
        if (table === 'comments') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'comment-123',
                content: 'Great work!',
                user: { id: 'follower-123', username: 'follower', display_name: null, avatar_url: null },
              },
              error: null,
            }),
          };
        }
        return {};
      }),
    };
    vi.mocked(createClient).mockResolvedValue(commentMockClient as never);

    const { POST: createComment } = await import('@/app/api/posts/[id]/comments/route');

    const commentRequest = new NextRequest('http://localhost:3000/api/posts/post-123/comments', {
      method: 'POST',
      body: JSON.stringify({ content: 'Great work!' }),
    });
    const commentResponse = await createComment(commentRequest, {
      params: Promise.resolve({ id: 'post-123' }),
    });

    expect(commentResponse.status).toBe(200);
  });
});

describe('CLI Authentication Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('CLI can initiate auth, user approves, CLI gets token', async () => {
    // Step 1: CLI initiates auth
    const initMockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      }),
    };
    vi.mocked(createAdminClient).mockReturnValue(initMockClient as never);

    const { POST: initCliAuth } = await import('@/app/api/auth/cli/init/route');
    const initResponse = await initCliAuth();
    expect(initResponse.status).toBe(200);

    const initData = await initResponse.json();
    expect(initData.code).toBeDefined();
    const code = initData.code;

    // Step 2: Poll shows pending
    const pendingMockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'auth-123',
            code,
            status: 'pending',
            expires_at: new Date(Date.now() + 60000).toISOString(),
            user: null,
          },
          error: null,
        }),
      }),
    };
    vi.mocked(createAdminClient).mockReturnValue(pendingMockClient as never);

    const { POST: pollCliAuth } = await import('@/app/api/auth/cli/poll/route');
    const pollRequest1 = new NextRequest('http://localhost:3000/api/auth/cli/poll', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    const pollResponse1 = await pollCliAuth(pollRequest1);
    const pollData1 = await pollResponse1.json();
    expect(pollData1.status).toBe('pending');

    // Step 3: User approves (verifies) the code
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-user' } as never);

    const verifyMockClient = {
      from: vi.fn((table: string) => {
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
        return {};
      }),
    };
    const verifyAdminMockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'auth-123',
            expires_at: new Date(Date.now() + 60000).toISOString(),
            status: 'pending',
          },
          error: null,
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    };
    vi.mocked(createClient).mockResolvedValue(verifyMockClient as never);
    vi.mocked(createAdminClient).mockReturnValue(verifyAdminMockClient as never);

    const { POST: verifyCliAuth } = await import('@/app/api/auth/cli/verify/route');
    const verifyRequest = new NextRequest('http://localhost:3000/api/auth/cli/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    const verifyResponse = await verifyCliAuth(verifyRequest);
    expect(verifyResponse.status).toBe(200);
  });
});

describe('Feed and Discovery Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('user can view feed with followed users posts', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-user' } as never);

    const mockPosts = [
      {
        id: 'post-1',
        user_id: 'user-2',
        description: 'Post from followed user',
        created_at: new Date().toISOString(),
        user: { id: 'user-2', username: 'followed', display_name: 'Followed User', avatar_url: null },
        usage: { cost_usd: 5.25, total_tokens: 60000, is_verified: true, models: ['claude-3-5-sonnet-20241022'] },
      },
    ];

    const feedMockClient = {
      from: vi.fn((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-1' },
              error: null,
            }),
          };
        }
        if (table === 'follows') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [{ following_id: 'user-2' }],
              error: null,
            }),
          };
        }
        if (table === 'posts') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            lt: vi.fn().mockResolvedValue({
              data: mockPosts,
              error: null,
            }),
          };
        }
        if (table === 'likes' || table === 'comments') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      }),
    };
    vi.mocked(createClient).mockResolvedValue(feedMockClient as never);

    const { GET: getFeed } = await import('@/app/api/feed/route');
    const feedRequest = new NextRequest('http://localhost:3000/api/feed');
    const feedResponse = await getFeed(feedRequest);

    expect(feedResponse.status).toBe(200);
    const feedData = await feedResponse.json();
    expect(feedData.posts).toBeDefined();
  });

  it('user can search for other users', async () => {
    const mockUsers = [
      { id: 'user-1', username: 'searchresult', display_name: 'Search Result', avatar_url: null, bio: 'Test' },
    ];

    const searchMockClient = {
      from: vi.fn((table: string) => {
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
            eq: vi.fn().mockResolvedValue({ count: 42 }),
          };
        }
        return {};
      }),
    };
    vi.mocked(createClient).mockResolvedValue(searchMockClient as never);

    const { GET: searchUsers } = await import('@/app/api/search/route');
    const searchRequest = new NextRequest('http://localhost:3000/api/search?q=search');
    const searchResponse = await searchUsers(searchRequest);

    expect(searchResponse.status).toBe(200);
    const searchData = await searchResponse.json();
    expect(searchData.users).toHaveLength(1);
    expect(searchData.users[0].username).toBe('searchresult');
    expect(searchData.users[0].followers_count).toBe(42);
  });
});
