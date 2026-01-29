import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: commentId } = await params;
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

  // Verify ownership
  const { data: commentData } = await supabase
    .from('comments')
    .select('user_id')
    .eq('id', commentId)
    .single();

  const comment = commentData as { user_id: string } | null;
  if (!comment || comment.user_id !== currentUser.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Delete comment
  const { error } = await supabase.from('comments').delete().eq('id', commentId);

  if (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
