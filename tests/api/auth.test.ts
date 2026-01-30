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
  createAdminClient: vi.fn(),
}));

import { POST as initCliAuth } from '@/app/api/auth/cli/init/route';
import { POST as pollCliAuth } from '@/app/api/auth/cli/poll/route';
import { POST as verifyCliAuth } from '@/app/api/auth/cli/verify/route';
import { GET as checkUsername } from '@/app/api/users/check-username/route';
import { POST as onboarding } from '@/app/api/users/me/onboarding/route';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

describe('POST /api/auth/cli/init', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a device code', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      }),
    };
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as never);

    const response = await initCliAuth();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.code).toBeDefined();
    expect(data.code).toMatch(/^[A-Z]{4}-\d{4}$/);
    expect(data.verify_url).toContain('/cli/verify');
  });
});

describe('POST /api/auth/cli/poll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 without code', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/cli/poll', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await pollCliAuth(request);
    expect(response.status).toBe(400);
  });

  it('returns expired for invalid code', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      }),
    };
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as never);

    const request = new NextRequest('http://localhost:3000/api/auth/cli/poll', {
      method: 'POST',
      body: JSON.stringify({ code: 'ABCD-1234' }),
    });

    const response = await pollCliAuth(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('expired');
  });

  it('returns pending for pending code', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'auth-123',
            code: 'ABCD-1234',
            status: 'pending',
            expires_at: new Date(Date.now() + 60000).toISOString(),
            user: null,
          },
          error: null,
        }),
      }),
    };
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as never);

    const request = new NextRequest('http://localhost:3000/api/auth/cli/poll', {
      method: 'POST',
      body: JSON.stringify({ code: 'ABCD-1234' }),
    });

    const response = await pollCliAuth(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('pending');
  });
});

describe('POST /api/auth/cli/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);

    const request = new NextRequest('http://localhost:3000/api/auth/cli/verify', {
      method: 'POST',
      body: JSON.stringify({ code: 'ABCD-1234' }),
    });

    const response = await verifyCliAuth(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 without code', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as never);

    const request = new NextRequest('http://localhost:3000/api/auth/cli/verify', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await verifyCliAuth(request);
    expect(response.status).toBe(400);
  });
});

describe('GET /api/users/check-username', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns available for new username', async () => {
    vi.mocked(clerkClient.users.getUserList).mockResolvedValue({ data: [] } as never);

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const request = new NextRequest('http://localhost:3000/api/users/check-username?username=newuser');

    const response = await checkUsername(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.available).toBe(true);
  });

  it('returns unavailable for taken username', async () => {
    vi.mocked(clerkClient.users.getUserList).mockResolvedValue({ data: [] } as never);

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'user-123' },
          error: null,
        }),
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const request = new NextRequest('http://localhost:3000/api/users/check-username?username=existinguser');

    const response = await checkUsername(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.available).toBe(false);
  });

  it('returns 400 for missing username', async () => {
    const request = new NextRequest('http://localhost:3000/api/users/check-username');

    const response = await checkUsername(request);
    expect(response.status).toBe(400);
  });
});

describe('POST /api/users/me/onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    vi.mocked(clerkClient.users.getUserList).mockResolvedValue({ data: [] } as never);

    const request = new NextRequest('http://localhost:3000/api/users/me/onboarding', {
      method: 'POST',
      body: JSON.stringify({
        username: 'testuser',
        country: 'US',
        region: 'north_america',
        is_public: true,
        bio: null,
        link: null,
        timezone: 'America/New_York',
      }),
    });

    const response = await onboarding(request);
    expect(response.status).toBe(401);
  });

  it('validates username format', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as never);
    vi.mocked(clerkClient.users.getUserList).mockResolvedValue({ data: [] } as never);

    const request = new NextRequest('http://localhost:3000/api/users/me/onboarding', {
      method: 'POST',
      body: JSON.stringify({
        username: 'Invalid Username!', // Invalid characters
        country: 'US',
        region: 'north_america',
        is_public: true,
        bio: null,
        link: null,
        timezone: 'America/New_York',
      }),
    });

    const response = await onboarding(request);
    expect(response.status).toBe(400);
  });

  it('validates username length', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as never);
    vi.mocked(clerkClient.users.getUserList).mockResolvedValue({ data: [] } as never);

    const request = new NextRequest('http://localhost:3000/api/users/me/onboarding', {
      method: 'POST',
      body: JSON.stringify({
        username: 'ab', // Too short
        country: 'US',
        region: 'north_america',
        is_public: true,
        bio: null,
        link: null,
        timezone: 'America/New_York',
      }),
    });

    const response = await onboarding(request);
    expect(response.status).toBe(400);
  });

  it('returns 409 for taken username', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as never);
    vi.mocked(clerkClient.users.getUserList).mockResolvedValue({ data: [] } as never);
    vi.mocked(clerkClient.users.updateUser).mockResolvedValue({} as never);

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'user-456' }, // Username taken
          error: null,
        }),
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const request = new NextRequest('http://localhost:3000/api/users/me/onboarding', {
      method: 'POST',
      body: JSON.stringify({
        username: 'takenuser',
        country: 'US',
        region: 'north_america',
        is_public: true,
        bio: null,
        link: null,
        timezone: 'America/New_York',
      }),
    });

    const response = await onboarding(request);
    expect(response.status).toBe(409);
  });
});
