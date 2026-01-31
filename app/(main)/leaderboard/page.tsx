import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { LeaderboardTable } from '@/components/leaderboard/leaderboard-table';
import { PeriodTabs } from '@/components/leaderboard/period-tabs';
import { TabStrip } from '@/components/feed/tab-strip';
import type { LeaderboardPeriod, Region, LeaderboardEntryWithRank } from '@/types';

export const metadata = {
  title: 'Leaderboard | Straude',
};

interface PageProps {
  searchParams: Promise<{ period?: string; region?: string }>;
}

async function getLeaderboard(period: LeaderboardPeriod, region?: Region) {
  const supabase = await createClient();
  const { userId } = await auth();

  let currentUserId: string | null = null;
  if (userId) {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();
    currentUserId = (user as { id: string } | null)?.id || null;
  }

  // Calculate date range - use local time to match user-submitted dates
  const now = new Date();
  const toLocalDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  let startDate: string;

  switch (period) {
    case 'day':
      startDate = toLocalDateStr(now);
      break;
    case 'week':
      const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      startDate = toLocalDateStr(weekAgo);
      break;
    case 'month':
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
      startDate = toLocalDateStr(monthAgo);
      break;
    case 'all_time':
    default:
      startDate = '2020-01-01';
  }

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
    .eq('onboarding_completed', true)
    .gte('daily_usage.date', startDate);

  if (region) {
    query = query.eq('region', region);
  }

  const { data: rawData } = await query;

  interface LeaderboardRow {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    country: string;
    region: string;
    daily_usage: Array<{ cost_usd: number; total_tokens: number; date: string }>;
  }

  // Aggregate
  const aggregated = new Map<string, LeaderboardEntryWithRank>();
  const typedData = rawData as LeaderboardRow[] | null;

  for (const row of typedData || []) {
    const usageArray = Array.isArray(row.daily_usage) ? row.daily_usage : [row.daily_usage];
    const totalCost = usageArray.reduce((sum: number, u: { cost_usd: number }) => sum + Number(u.cost_usd), 0);
    const totalTokens = usageArray.reduce((sum: number, u: { total_tokens: number }) => sum + Number(u.total_tokens), 0);

    const existing = aggregated.get(row.id);
    if (existing) {
      existing.total_cost += totalCost;
      existing.total_tokens += totalTokens;
    } else {
      aggregated.set(row.id, {
        rank: 0,
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

  const sorted = Array.from(aggregated.values())
    .filter((e) => e.total_cost > 0)
    .sort((a, b) => b.total_cost - a.total_cost)
    .slice(0, 50)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return { entries: sorted, currentUserId };
}

async function LeaderboardContent({
  period,
  region,
}: {
  period: LeaderboardPeriod;
  region?: Region;
}) {
  const { entries, currentUserId } = await getLeaderboard(period, region);

  return (
    <LeaderboardTable entries={entries} currentUserId={currentUserId || undefined} />
  );
}

export default async function LeaderboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const period = (params.period as LeaderboardPeriod) || 'day';
  const region = params.region as Region | undefined;

  return (
    <div className="flex flex-col h-full">
      {/* Mobile Tab Strip */}
      <TabStrip />

      {/* Desktop Actions Bar */}
      <div className="hidden md:flex actions-bar">
        <Suspense fallback={null}>
          <PeriodTabs />
        </Suspense>
      </div>

      {/* Leaderboard Header */}
      <div className="feed-header type-mono-look hidden md:grid grid-cols-[0.5fr_2fr_1fr_1fr_1fr]">
        <div className="col-head">#</div>
        <div className="col-head">User</div>
        <div className="col-head">Session Tokens</div>
        <div className="col-head">Cost</div>
        <div className="col-head">Time</div>
      </div>

      {/* Leaderboard Content */}
      <div className="flex-1 overflow-auto">
        <Suspense
          fallback={
            <div className="flex justify-center py-12">
              <div className="type-mono-look text-gray">Loading...</div>
            </div>
          }
        >
          <LeaderboardContent period={period} region={region} />
        </Suspense>
      </div>
    </div>
  );
}
