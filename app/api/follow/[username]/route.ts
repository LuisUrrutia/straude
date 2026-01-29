import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { username } = await params;
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

  // Get target user
  const { data: targetUserData } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single();

  const targetUser = targetUserData as { id: string } | null;
  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Can't follow yourself
  if (currentUser.id === targetUser.id) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
  }

  // Check if already following
  const { data: existing } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', currentUser.id)
    .eq('following_id', targetUser.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ following: true });
  }

  // Create follow
  const { error } = await supabase.from('follows').insert({
    follower_id: currentUser.id,
    following_id: targetUser.id,
  } as never);

  if (error) {
    console.error('Error following:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ following: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { username } = await params;
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

  // Get target user
  const { data: targetUserData } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single();

  const targetUser = targetUserData as { id: string } | null;
  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Delete follow
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', currentUser.id)
    .eq('following_id', targetUser.id);

  if (error) {
    console.error('Error unfollowing:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ following: false });
}
