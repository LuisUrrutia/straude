import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { postUpdateSchema } from '@/lib/validators/usage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

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

  const { data: postData, error } = await supabase
    .from('posts')
    .select(`
      *,
      user:users(id, username, display_name, avatar_url),
      usage:daily_usage(cost_usd, total_tokens, is_verified, models)
    `)
    .eq('id', id)
    .single();

  const post = postData as PostRow | null;
  if (error || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  // Get counts
  const [{ count: likeCount }, { count: commentCount }] = await Promise.all([
    supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', id),
    supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', id),
  ]);

  // Check if current user liked
  const { userId } = await auth();
  let isLiked = false;

  if (userId) {
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    const user = userData as { id: string } | null;
    if (user) {
      const { data: like } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      isLiked = !!like;
    }
  }

  return NextResponse.json({
    ...post,
    like_count: likeCount || 0,
    comment_count: commentCount || 0,
    is_liked: isLiked,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = postUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid data', details: parsed.error.flatten() },
      { status: 400 }
    );
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

  // Verify post ownership
  const { data: existingPostData } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', id)
    .single();

  const existingPost = existingPostData as { user_id: string } | null;
  if (!existingPost || existingPost.user_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { data: post, error } = await supabase
    .from('posts')
    .update({
      description: parsed.data.description,
      images: parsed.data.images,
    } as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json(post);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
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

  // Verify post ownership
  const { data: existingPostData } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', id)
    .single();

  const existingPost = existingPostData as { user_id: string } | null;
  if (!existingPost || existingPost.user_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { error } = await supabase.from('posts').delete().eq('id', id);

  if (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
