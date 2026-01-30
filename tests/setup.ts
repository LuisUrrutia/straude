import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// Mock Next.js headers
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    getAll: vi.fn(() => []),
  }),
  headers: () => new Headers(),
}));

// Mock Clerk
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve({ userId: null })),
  currentUser: vi.fn(() => Promise.resolve(null)),
  clerkClient: {
    users: {
      getUserList: vi.fn(() => Promise.resolve({ data: [] })),
      updateUser: vi.fn(() => Promise.resolve({})),
      getUser: vi.fn(() => Promise.resolve({ username: null })),
    },
  },
}));

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient()),
  createAdminClient: vi.fn(() => mockSupabaseClient()),
}));

// Helper to create mock Supabase client
export function mockSupabaseClient() {
  const chainMethods = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  return {
    from: vi.fn(() => chainMethods),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}

// Global test utilities
export function createMockUser(overrides = {}) {
  return {
    id: 'user-123',
    clerk_id: 'clerk-123',
    username: 'testuser',
    display_name: 'Test User',
    bio: 'Test bio',
    avatar_url: 'https://example.com/avatar.jpg',
    country: 'US',
    region: 'north_america',
    link: null,
    github_username: null,
    is_public: true,
    timezone: 'America/New_York',
    onboarding_completed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockUsage(overrides = {}) {
  return {
    id: 'usage-123',
    user_id: 'user-123',
    date: new Date().toISOString().split('T')[0],
    cost_usd: 5.25,
    input_tokens: 50000,
    output_tokens: 10000,
    cache_creation_tokens: 0,
    cache_read_tokens: 0,
    total_tokens: 60000,
    models: ['claude-3-5-sonnet-20241022'],
    session_count: 5,
    is_verified: true,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockPost(overrides = {}) {
  return {
    id: 'post-123',
    user_id: 'user-123',
    daily_usage_id: 'usage-123',
    description: 'Built a new feature today',
    images: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}
