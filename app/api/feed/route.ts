import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

interface PostRow {
  id: string;
  user_id: string;
  daily_usage_id: string;
  description: string | null;
  images: string[];
  created_at: string;
  updated_at: string;
  user: {
    id: string;
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
}

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get('cursor');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  const supabase = await createClient();

  // Get user from clerk_id
  const { data: currentUserData } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  const currentUser = currentUserData as { id: string } | null;
  if (!currentUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Get users the current user follows
  const { data: followingData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', currentUser.id);

  const following = followingData as Array<{ following_id: string }> | null;
  const followingIds = following?.map((f) => f.following_id) || [];

  // Include own posts in feed
  followingIds.push(currentUser.id);

  // Build query
  let query = supabase
    .from('posts')
    .select(`
      *,
      user:users(id, username, display_name, avatar_url),
      usage:daily_usage(cost_usd, total_tokens, is_verified, models)
    `)
    .in('user_id', followingIds)
    .order('created_at', { ascending: false })
    .limit(limit + 1); // Fetch one extra to check for next page

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data: postsData, error } = await query;

  if (error) {
    console.error('Error fetching feed:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  const posts = postsData as PostRow[] | null;

  // Check if there are more posts
  const hasMore = posts && posts.length > limit;
  const postsToReturn = hasMore ? posts.slice(0, limit) : posts || [];
  const nextCursor = hasMore ? postsToReturn[postsToReturn.length - 1].created_at : null;

  // Get like counts and check if user liked
  const postsWithCounts = await Promise.all(
    postsToReturn.map(async (post) => {
      const [{ count: likeCount }, { count: commentCount }, { data: liked }] = await Promise.all([
        supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase.from('likes').select('id').eq('post_id', post.id).eq('user_id', currentUser.id).maybeSingle(),
      ]);

      return {
        ...post,
        like_count: likeCount || 0,
        comment_count: commentCount || 0,
        is_liked: !!liked,
      };
    })
  );

  return NextResponse.json({
    posts: postsWithCounts,
    next_cursor: nextCursor,
  });
}
