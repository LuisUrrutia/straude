import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

interface UsageRow {
  id: string;
  date: string;
  models: string[];
  input_tokens: number;
  output_tokens: number;
  cache_creation_tokens: number;
  cache_read_tokens: number;
  total_tokens: number;
  cost_usd: number;
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  // Get user from clerk_id
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  const user = userData as { id: string } | null;
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const today = new Date().toISOString().split('T')[0];

  const { data: usageData, error } = await supabase
    .from('daily_usage')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle();

  if (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  const usage = usageData as UsageRow | null;
  if (!usage) {
    return NextResponse.json(null);
  }

  // Transform to ccusage format
  return NextResponse.json({
    date: usage.date,
    models: usage.models,
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheCreationTokens: usage.cache_creation_tokens,
    cacheReadTokens: usage.cache_read_tokens,
    totalTokens: usage.total_tokens,
    costUSD: Number(usage.cost_usd),
  });
}
