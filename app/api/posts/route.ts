import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { postCreateSchema } from '@/lib/validators/usage';

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = postCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid data', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { daily_usage_id, description, images } = parsed.data;

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

  // Verify the daily_usage belongs to this user
  const { data: usageData } = await supabase
    .from('daily_usage')
    .select('id, user_id')
    .eq('id', daily_usage_id)
    .single();

  const usage = usageData as { id: string; user_id: string } | null;
  if (!usage || usage.user_id !== user.id) {
    return NextResponse.json({ error: 'Usage not found' }, { status: 404 });
  }

  // Create or update post
  const { data: post, error } = await supabase
    .from('posts')
    .upsert(
      {
        user_id: user.id,
        daily_usage_id,
        description: description || null,
        images: images || [],
      } as never,
      {
        onConflict: 'daily_usage_id',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json(post);
}
