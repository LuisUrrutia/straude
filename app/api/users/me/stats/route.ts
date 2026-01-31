import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { getBearerToken, verifyCliToken } from '@/lib/auth/cli';

interface UserRow {
  id: string;
  is_public: boolean;
}

interface UserWithUsage {
  id: string;
  daily_usage: Array<{ cost_usd: number }>;
}

export async function GET(request: NextRequest) {
  const { userId: clerkId } = await auth();
  const bearerToken = getBearerToken(request);

  if (!clerkId && bearerToken && !process.env.CLI_JWT_SECRET) {
    return NextResponse.json({ error: 'CLI auth not configured' }, { status: 500 });
  }

  const cliAuth = !clerkId && bearerToken ? await verifyCliToken(bearerToken) : null;

  if (!clerkId && !cliAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  // Get user
  const authType = clerkId ? 'clerk' : 'cli';
  const { data: userData, error } = await supabase
    .from('users')
    .select('id, is_public')
    .eq(authType === 'clerk' ? 'clerk_id' : 'id', authType === 'clerk' ? clerkId! : cliAuth!.userId)
    .single();

  const user = userData as UserRow | null;
  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Calculate streak manually
  const { data: usageDates } = await supabase
    .from('daily_usage')
    .select('date')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  const dates = (usageDates as Array<{ date: string }> | null)?.map(d => d.date) || [];
  let streak = 0;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const yesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

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

  // Get total spent
  const { data: usageData } = await supabase
    .from('daily_usage')
    .select('cost_usd')
    .eq('user_id', user.id);

  const usage = usageData as Array<{ cost_usd: number }> | null;
  const totalSpent = usage?.reduce((sum, u) => sum + Number(u.cost_usd), 0) || 0;

  // Get rank if public
  let rank: number | null = null;
  if (user.is_public) {
    const { data: allUsersData } = await supabase
      .from('users')
      .select(`
        id,
        daily_usage!inner(cost_usd)
      `)
      .eq('is_public', true);

    const allUsers = allUsersData as UserWithUsage[] | null;
    if (allUsers) {
      const userTotals = allUsers.map((u) => ({
        id: u.id,
        total: Array.isArray(u.daily_usage)
          ? u.daily_usage.reduce((sum: number, d: { cost_usd: number }) => sum + Number(d.cost_usd), 0)
          : 0,
      }));
      userTotals.sort((a, b) => b.total - a.total);
      const userIndex = userTotals.findIndex((u) => u.id === user.id);
      if (userIndex !== -1) rank = userIndex + 1;
    }
  }

  return NextResponse.json({
    streak,
    rank,
    total_spent: totalSpent,
  });
}
