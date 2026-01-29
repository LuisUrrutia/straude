// Database types for Supabase
// Generated based on schema

export type Region = 'north_america' | 'south_america' | 'europe' | 'asia' | 'africa' | 'oceania';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          clerk_id: string;
          username: string;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          country: string;
          region: Region;
          link: string | null;
          github_username: string | null;
          is_public: boolean;
          timezone: string;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_id: string;
          username: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          country: string;
          region: Region;
          link?: string | null;
          github_username?: string | null;
          is_public?: boolean;
          timezone: string;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_id?: string;
          username?: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          country?: string;
          region?: Region;
          link?: string | null;
          github_username?: string | null;
          is_public?: boolean;
          timezone?: string;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      daily_usage: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          cost_usd: number;
          input_tokens: number;
          output_tokens: number;
          cache_creation_tokens: number;
          cache_read_tokens: number;
          total_tokens: number;
          models: string[];
          session_count: number;
          is_verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          cost_usd: number;
          input_tokens: number;
          output_tokens: number;
          cache_creation_tokens?: number;
          cache_read_tokens?: number;
          total_tokens: number;
          models?: string[];
          session_count?: number;
          is_verified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          cost_usd?: number;
          input_tokens?: number;
          output_tokens?: number;
          cache_creation_tokens?: number;
          cache_read_tokens?: number;
          total_tokens?: number;
          models?: string[];
          session_count?: number;
          is_verified?: boolean;
          created_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          daily_usage_id: string;
          description: string | null;
          images: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          daily_usage_id: string;
          description?: string | null;
          images?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          daily_usage_id?: string;
          description?: string | null;
          images?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      countries_to_regions: {
        Row: {
          country_code: string;
          region: Region;
        };
        Insert: {
          country_code: string;
          region: Region;
        };
        Update: {
          country_code?: string;
          region?: Region;
        };
      };
      cli_auth_codes: {
        Row: {
          id: string;
          code: string;
          user_id: string | null;
          status: 'pending' | 'completed' | 'expired';
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          user_id?: string | null;
          status?: 'pending' | 'completed' | 'expired';
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          user_id?: string | null;
          status?: 'pending' | 'completed' | 'expired';
          expires_at?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      leaderboard_daily: {
        Row: {
          user_id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          country: string;
          region: Region;
          total_cost: number;
          total_tokens: number;
          session_count: number;
        };
      };
      leaderboard_weekly: {
        Row: {
          user_id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          country: string;
          region: Region;
          total_cost: number;
          total_tokens: number;
          active_days: number;
        };
      };
      leaderboard_monthly: {
        Row: {
          user_id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          country: string;
          region: Region;
          total_cost: number;
          total_tokens: number;
          active_days: number;
        };
      };
      leaderboard_all_time: {
        Row: {
          user_id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          country: string;
          region: Region;
          total_cost: number;
          total_tokens: number;
          active_days: number;
        };
      };
    };
    Functions: {
      calculate_user_streak: {
        Args: { p_user_id: string };
        Returns: number;
      };
      refresh_leaderboards: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
  };
}

// Helper types
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type DailyUsage = Database['public']['Tables']['daily_usage']['Row'];
export type DailyUsageInsert = Database['public']['Tables']['daily_usage']['Insert'];

export type Post = Database['public']['Tables']['posts']['Row'];
export type PostInsert = Database['public']['Tables']['posts']['Insert'];
export type PostUpdate = Database['public']['Tables']['posts']['Update'];

export type Follow = Database['public']['Tables']['follows']['Row'];
export type Like = Database['public']['Tables']['likes']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type CommentInsert = Database['public']['Tables']['comments']['Insert'];

export type LeaderboardEntry = Database['public']['Views']['leaderboard_daily']['Row'];
