// API types and ccusage types

export * from './database';

// ccusage CLI output types
export interface CcusageDailyEntry {
  date: string; // "2026-01-28"
  models: string[];
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  costUSD: number;
}

export interface CcusageSummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheCreationTokens: number;
  totalCacheReadTokens: number;
  totalTokens: number;
  totalCostUSD: number;
}

export interface CcusageOutput {
  type: 'daily';
  data: CcusageDailyEntry[];
  summary: CcusageSummary;
}

// API Request/Response types
export interface UsageSubmitRequest {
  date: string;
  data: CcusageDailyEntry;
  hash?: string; // SHA-256 hash (CLI only)
  source: 'cli' | 'web';
}

export interface UsageSubmitResponse {
  usage_id: string;
  post_url: string;
}

export interface FeedResponse {
  posts: PostWithDetails[];
  next_cursor?: string;
}

export interface PostWithDetails {
  id: string;
  user_id: string;
  daily_usage_id: string;
  description: string | null;
  images: string[];
  created_at: string;
  updated_at: string;
  user: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  usage: {
    cost_usd: number;
    total_tokens: number;
    is_verified: boolean;
    models: string[];
  };
  like_count: number;
  comment_count: number;
  is_liked?: boolean; // only when user is logged in
}

export interface LeaderboardResponse {
  entries: LeaderboardEntryWithRank[];
  user_rank?: number;
  next_cursor?: string;
}

export interface LeaderboardEntryWithRank {
  rank: number;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  country: string;
  region: string;
  total_cost: number;
  total_tokens: number;
  streak?: number;
}

export interface UserProfileResponse {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  country: string;
  region: string;
  link: string | null;
  github_username: string | null;
  is_public: boolean;
  created_at: string;
  stats: {
    global_rank: number | null;
    regional_rank: number | null;
    current_streak: number;
    total_spent: number;
    followers_count: number;
    following_count: number;
  };
  is_following?: boolean;
  is_own_profile?: boolean;
}

export interface ContributionsResponse {
  data: Array<{
    date: string;
    cost_usd: number;
  }>;
  streak: number;
}

// CLI Auth types
export interface CLIAuthInitResponse {
  code: string;
  verify_url: string;
}

export interface CLIAuthPollResponse {
  token?: string;
  status: 'pending' | 'completed' | 'expired';
}

// Pagination
export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

// Search
export interface SearchResponse {
  users: Array<{
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    followers_count: number;
  }>;
}

// Period for leaderboard
export type LeaderboardPeriod = 'day' | 'week' | 'month' | 'all_time';
