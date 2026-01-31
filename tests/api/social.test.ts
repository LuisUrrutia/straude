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

import { POST as followUser, DELETE as unfollowUser } from '@/app/api/follow/[username]/route';
import { POST as likePost } from '@/app/api/posts/[id]/like/route';
import { GET as getComments, POST as createComment } from '@/app/api/posts/[id]/comments/route';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

describe('POST /api/follow/[username]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);

    const request = new NextRequest('http://localhost:3000/api/follow/testuser');
    const response = await followUser(request, { params: Promise.resolve({ username: 'testuser' }) });

    expect(response.status).toBe(401);
  });

  it('returns 404 when current user not found', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as never);

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const request = new NextRequest('http://localhost:3000/api/follow/testuser');
    const response = await followUser(request, { params: Promise.resolve({ username: 'testuser' }) });

    expect(response.status).toBe(404);
  });

  it('returns 400 when trying to follow yourself', async () => {
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
        return {};
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const request = new NextRequest('http://localhost:3000/api/follow/testuser');
    const response = await followUser(request, { params: Promise.resolve({ username: 'testuser' }) });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Cannot follow yourself');
  });

  it('successfully follows a user', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as never);

    let callCount = 0;
    const mockSupabase = {
      from: vi.fn((table) => {
        if (table === 'users') {
          callCount++;
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: callCount === 1 ? 'user-123' : 'user-456' },
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
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const request = new NextRequest('http://localhost:3000/api/follow/targetuser');
    const response = await followUser(request, { params: Promise.resolve({ username: 'targetuser' }) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.following).toBe(true);
  });
});

describe('DELETE /api/follow/[username]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);

    const request = new NextRequest('http://localhost:3000/api/follow/testuser', { method: 'DELETE' });
    const response = await unfollowUser(request, { params: Promise.resolve({ username: 'testuser' }) });

    expect(response.status).toBe(401);
  });
});

describe('POST /api/posts/[id]/like', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);

    const request = new NextRequest('http://localhost:3000/api/posts/post-123/like');
    const response = await likePost(request, { params: Promise.resolve({ id: 'post-123' }) });

    expect(response.status).toBe(401);
  });

  it('returns 404 when post not found', async () => {
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
        if (table === 'posts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const request = new NextRequest('http://localhost:3000/api/posts/post-123/like');
    const response = await likePost(request, { params: Promise.resolve({ id: 'post-123' }) });

    expect(response.status).toBe(404);
  });
});

describe('GET /api/posts/[id]/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when no comments', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        gt: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const request = new NextRequest('http://localhost:3000/api/posts/post-123/comments');
    const response = await getComments(request, { params: Promise.resolve({ id: 'post-123' }) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.comments).toEqual([]);
  });
});

describe('POST /api/posts/[id]/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);

    const request = new NextRequest('http://localhost:3000/api/posts/post-123/comments', {
      method: 'POST',
      body: JSON.stringify({ content: 'Great post!' }),
    });
    const response = await createComment(request, { params: Promise.resolve({ id: 'post-123' }) });

    expect(response.status).toBe(401);
  });

  it('returns 400 for empty comment', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as never);

    const request = new NextRequest('http://localhost:3000/api/posts/post-123/comments', {
      method: 'POST',
      body: JSON.stringify({ content: '' }),
    });
    const response = await createComment(request, { params: Promise.resolve({ id: 'post-123' }) });

    expect(response.status).toBe(400);
  });

  it('returns 400 for comment too long', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as never);

    const request = new NextRequest('http://localhost:3000/api/posts/post-123/comments', {
      method: 'POST',
      body: JSON.stringify({ content: 'a'.repeat(501) }),
    });
    const response = await createComment(request, { params: Promise.resolve({ id: 'post-123' }) });

    expect(response.status).toBe(400);
  });
});
