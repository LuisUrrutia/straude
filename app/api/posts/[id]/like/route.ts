import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: postId } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: currentUserData } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  const currentUser = currentUserData as { id: string } | null;
  if (!currentUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Check if post exists
  const { data: postData } = await supabase
    .from('posts')
    .select('id')
    .eq('id', postId)
    .single();

  const post = postData as { id: string } | null;
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  // Check if already liked
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', currentUser.id)
    .eq('post_id', postId)
    .maybeSingle();

  if (existing) {
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    return NextResponse.json({ liked: true, count: count || 0 });
  }

  // Create like
  const { error } = await supabase.from('likes').insert({
    user_id: currentUser.id,
    post_id: postId,
  } as never);

  if (error) {
    console.error('Error liking:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  const { count } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  return NextResponse.json({ liked: true, count: count || 0 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: postId } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: currentUserData } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  const currentUser = currentUserData as { id: string } | null;
  if (!currentUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Delete like
  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', currentUser.id)
    .eq('post_id', postId);

  if (error) {
    console.error('Error unliking:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  const { count } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  return NextResponse.json({ liked: false, count: count || 0 });
}
