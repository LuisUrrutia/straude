import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface UserRow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  if (!query || query.length < 1) {
    return NextResponse.json({ users: [] });
  }

  const supabase = await createClient();

  const { data: usersData, error } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url, bio')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .eq('onboarding_completed', true)
    .limit(limit);

  if (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  const users = usersData as UserRow[] | null;

  // Get follower counts
  const usersWithCounts = await Promise.all(
    (users || []).map(async (user) => {
      const { count } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);

      return {
        ...user,
        followers_count: count || 0,
      };
    })
  );

  return NextResponse.json({ users: usersWithCounts });
}
