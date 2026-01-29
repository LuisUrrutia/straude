import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { commentSchema } from '@/lib/validators/usage';

interface CommentRow {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get('cursor');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  const supabase = await createClient();

  let query = supabase
    .from('comments')
    .select(`
      *,
      user:users(id, username, display_name, avatar_url)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .limit(limit + 1);

  if (cursor) {
    query = query.gt('created_at', cursor);
  }

  const { data: commentsData, error } = await query;

  if (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  const comments = commentsData as CommentRow[] | null;

  const hasMore = comments && comments.length > limit;
  const commentsToReturn = hasMore ? comments.slice(0, limit) : comments || [];
  const nextCursor = hasMore
    ? commentsToReturn[commentsToReturn.length - 1].created_at
    : null;

  return NextResponse.json({
    comments: commentsToReturn,
    next_cursor: nextCursor,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: postId } = await params;
  const body = await request.json();

  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid data', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

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

  // Create comment
  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      user_id: currentUser.id,
      post_id: postId,
      content: parsed.data.content,
    } as never)
    .select(`
      *,
      user:users(id, username, display_name, avatar_url)
    `)
    .single();

  if (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json(comment);
}
