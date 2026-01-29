import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import type { LeaderboardPeriod, Region, LeaderboardEntryWithRank } from '@/types';

const viewMap: Record<LeaderboardPeriod, string> = {
  day: 'leaderboard_daily',
  week: 'leaderboard_weekly',
  month: 'leaderboard_monthly',
  all_time: 'leaderboard_all_time',
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = (searchParams.get('period') as LeaderboardPeriod) || 'day';
  const region = searchParams.get('region') as Region | null;
  // TODO: Implement cursor pagination
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  const viewName = viewMap[period];
  if (!viewName) {
    return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
  }

  const supabase = await createClient();

  // Get current user for highlighting
  const { userId } = await auth();
  let currentUserId: string | null = null;

  if (userId) {
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();
    const user = userData as { id: string } | null;
    currentUserId = user?.id || null;
  }

  // Build query - we need to query the materialized view
  // Since we can't directly query views with Supabase client, we'll use RPC or direct query
  // For now, let's query the underlying data

  let query = supabase
    .from('users')
    .select(`
      id,
      username,
      display_name,
      avatar_url,
      country,
      region,
      daily_usage!inner(cost_usd, total_tokens, date)
    `)
    .eq('is_public', true)
    .eq('onboarding_completed', true);

  // Filter by period
  const now = new Date();
  let startDate: string;

  switch (period) {
    case 'day':
      startDate = now.toISOString().split('T')[0];
      break;
    case 'week':
      const weekAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      startDate = weekAgo.toISOString().split('T')[0];
      break;
    case 'month':
      const monthAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
      startDate = monthAgo.toISOString().split('T')[0];
      break;
    case 'all_time':
    default:
      startDate = '2020-01-01'; // Far back enough
  }

  query = query.gte('daily_usage.date', startDate);

  if (region) {
    query = query.eq('region', region);
  }

  interface LeaderboardRow {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    country: string;
    region: string;
    daily_usage: Array<{ cost_usd: number; total_tokens: number; date: string }>;
  }

  const { data: rawQueryData, error } = await query;

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  const rawData = rawQueryData as LeaderboardRow[] | null;

  // Aggregate data by user
  const aggregated = new Map<
    string,
    {
      user_id: string;
      username: string;
      display_name: string | null;
      avatar_url: string | null;
      country: string;
      region: string;
      total_cost: number;
      total_tokens: number;
    }
  >();

  for (const row of rawData || []) {
    const existing = aggregated.get(row.id);
    const usageArray = Array.isArray(row.daily_usage) ? row.daily_usage : [row.daily_usage];

    const totalCost = usageArray.reduce((sum: number, u: { cost_usd: number }) => sum + Number(u.cost_usd), 0);
    const totalTokens = usageArray.reduce((sum: number, u: { total_tokens: number }) => sum + Number(u.total_tokens), 0);

    if (existing) {
      existing.total_cost += totalCost;
      existing.total_tokens += totalTokens;
    } else {
      aggregated.set(row.id, {
        user_id: row.id,
        username: row.username,
        display_name: row.display_name,
        avatar_url: row.avatar_url,
        country: row.country,
        region: row.region,
        total_cost: totalCost,
        total_tokens: totalTokens,
      });
    }
  }

  // Sort by total_cost descending
  const sorted = Array.from(aggregated.values())
    .filter((e) => e.total_cost > 0)
    .sort((a, b) => b.total_cost - a.total_cost);

  // Add ranks
  const entries: LeaderboardEntryWithRank[] = sorted.slice(0, limit).map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  // Find current user's rank
  let userRank: number | undefined;
  if (currentUserId) {
    const userIndex = sorted.findIndex((e) => e.user_id === currentUserId);
    if (userIndex !== -1) {
      userRank = userIndex + 1;
    }
  }

  return NextResponse.json({
    entries,
    user_rank: userRank,
    next_cursor: entries.length >= limit ? 'more' : null,
  });
}
