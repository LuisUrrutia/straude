import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = await createClient();

  // Get user
  const { data: userData, error } = await supabase
    .from('users')
    .select('id, is_public, clerk_id')
    .eq('username', username)
    .single();

  const user = userData as { id: string; is_public: boolean; clerk_id: string | null } | null;
  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { userId } = await auth();
  let canView = user.is_public;

  if (userId) {
    if (user.clerk_id === userId) {
      canView = true;
    } else if (!user.is_public) {
      const { data: currentUserData } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', userId)
        .single();

      const currentUser = currentUserData as { id: string } | null;
      if (currentUser) {
        const { data: follow } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', currentUser.id)
          .eq('following_id', user.id)
          .maybeSingle();
        canView = !!follow;
      }
    }
  }

  if (!canView) {
    return NextResponse.json({ error: 'Private profile' }, { status: 403 });
  }

  // Get last 52 weeks of data
  const yearAgo = new Date();
  yearAgo.setDate(yearAgo.getDate() - 365);

  const { data: usageData } = await supabase
    .from('daily_usage')
    .select('date, cost_usd')
    .eq('user_id', user.id)
    .gte('date', yearAgo.toISOString().split('T')[0])
    .order('date', { ascending: true });

  const usage = usageData as Array<{ date: string; cost_usd: number }> | null;

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

  return NextResponse.json({
    data:
      usage?.map((u) => ({
        date: u.date,
        cost_usd: Number(u.cost_usd),
      })) || [],
    streak,
  });
}
