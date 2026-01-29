import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import type { UserProfileResponse } from '@/types';

interface UserRow {
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
}

interface UserWithUsage {
  id: string;
  daily_usage: Array<{ cost_usd: number }>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = await createClient();

  // Get user
  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  const user = userData as UserRow | null;
  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Get current user
  const { userId } = await auth();
  let isOwnProfile = false;
  let isFollowing = false;

  if (userId) {
    const { data: currentUserData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    const currentUser = currentUserData as { id: string } | null;
    if (currentUser) {
      isOwnProfile = currentUser.id === user.id;

      if (!isOwnProfile) {
        const { data: follow } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', currentUser.id)
          .eq('following_id', user.id)
          .maybeSingle();

        isFollowing = !!follow;
      }
    }
  }

  // Get stats
  const [
    { count: followersCount },
    { count: followingCount },
    { data: allTimeUsageData },
  ] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
    supabase.from('daily_usage').select('cost_usd').eq('user_id', user.id),
  ]);

  const allTimeUsage = allTimeUsageData as Array<{ cost_usd: number }> | null;
  const totalSpent = allTimeUsage?.reduce((sum, u) => sum + Number(u.cost_usd), 0) || 0;

  // Calculate streak manually
  const { data: usageDates } = await supabase
    .from('daily_usage')
    .select('date')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  const dates = (usageDates as Array<{ date: string }> | null)?.map(d => d.date) || [];
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (dates.length > 0 && (dates[0] === today || dates[0] === yesterday)) {
    streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
  }

  // Get ranks (simplified - just based on all-time cost for now)
  let globalRank: number | null = null;
  let regionalRank: number | null = null;

  if (user.is_public) {
    // Get global rank
    const { data: globalData } = await supabase
      .from('users')
      .select(`
        id,
        daily_usage!inner(cost_usd)
      `)
      .eq('is_public', true);

    const globalDataTyped = globalData as UserWithUsage[] | null;
    if (globalDataTyped) {
      const userTotals = globalDataTyped.map((u) => ({
        id: u.id,
        total: Array.isArray(u.daily_usage)
          ? u.daily_usage.reduce((sum: number, d: { cost_usd: number }) => sum + Number(d.cost_usd), 0)
          : 0,
      }));
      userTotals.sort((a, b) => b.total - a.total);
      const userIndex = userTotals.findIndex((u) => u.id === user.id);
      if (userIndex !== -1) globalRank = userIndex + 1;
    }

    // Get regional rank
    const { data: regionalData } = await supabase
      .from('users')
      .select(`
        id,
        daily_usage!inner(cost_usd)
      `)
      .eq('is_public', true)
      .eq('region', user.region);

    const regionalDataTyped = regionalData as UserWithUsage[] | null;
    if (regionalDataTyped) {
      const userTotals = regionalDataTyped.map((u) => ({
        id: u.id,
        total: Array.isArray(u.daily_usage)
          ? u.daily_usage.reduce((sum: number, d: { cost_usd: number }) => sum + Number(d.cost_usd), 0)
          : 0,
      }));
      userTotals.sort((a, b) => b.total - a.total);
      const userIndex = userTotals.findIndex((u) => u.id === user.id);
      if (userIndex !== -1) regionalRank = userIndex + 1;
    }
  }

  const response: UserProfileResponse = {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    bio: user.bio,
    avatar_url: user.avatar_url,
    country: user.country,
    region: user.region,
    link: user.link,
    github_username: user.github_username,
    is_public: user.is_public,
    created_at: user.created_at,
    stats: {
      global_rank: globalRank,
      regional_rank: regionalRank,
      current_streak: streak,
      total_spent: totalSpent,
      followers_count: followersCount || 0,
      following_count: followingCount || 0,
    },
    is_following: isFollowing,
    is_own_profile: isOwnProfile,
  };

  return NextResponse.json(response);
}
