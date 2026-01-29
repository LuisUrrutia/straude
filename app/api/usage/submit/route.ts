import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { usageSubmitSchema } from '@/lib/validators/usage';
import { getBearerToken, verifyCliToken } from '@/lib/auth/cli';

interface UsageRow {
  id: string;
  user_id: string;
  date: string;
  cost_usd: number;
}

interface PostRow {
  id: string;
}

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  const bearerToken = getBearerToken(request);

  if (!clerkId && bearerToken && !process.env.CLI_JWT_SECRET) {
    return NextResponse.json({ error: 'CLI auth not configured' }, { status: 500 });
  }

  const cliAuth = !clerkId && bearerToken ? await verifyCliToken(bearerToken) : null;

  if (!clerkId && !cliAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = usageSubmitSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid data', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { date, data, source } = parsed.data;
  const authType = clerkId ? 'clerk' : 'cli';

  if (source === 'cli' && authType !== 'cli') {
    return NextResponse.json({ error: 'CLI auth required' }, { status: 403 });
  }
  if (source === 'web' && authType !== 'clerk') {
    return NextResponse.json({ error: 'Web auth required' }, { status: 403 });
  }

  // Validate date is recent (allow today or yesterday to handle timezone differences)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const submittedDate = new Date(date + 'T00:00:00');

  if (submittedDate < yesterday || submittedDate > today) {
    return NextResponse.json(
      { error: 'Only today\'s usage can be submitted' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Resolve user
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq(authType === 'clerk' ? 'clerk_id' : 'id', authType === 'clerk' ? clerkId! : cliAuth!.userId)
    .single();

  const user = userData as { id: string } | null;
  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Upsert daily_usage
  const { data: usageData, error: usageError } = await supabase
    .from('daily_usage')
    .upsert(
      {
        user_id: user.id,
        date,
        cost_usd: data.costUSD,
        input_tokens: data.inputTokens,
        output_tokens: data.outputTokens,
        cache_creation_tokens: data.cacheCreationTokens,
        cache_read_tokens: data.cacheReadTokens,
        total_tokens: data.totalTokens,
        models: data.models,
        is_verified: authType === 'cli',
      } as never,
      {
        onConflict: 'user_id,date',
      }
    )
    .select()
    .single();

  const usage = usageData as UsageRow | null;
  if (usageError || !usage) {
    console.error('Error upserting usage:', usageError);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  // Auto-create post if it doesn't exist
  const { data: existingPostData } = await supabase
    .from('posts')
    .select('id')
    .eq('daily_usage_id', usage.id)
    .maybeSingle();

  const existingPost = existingPostData as PostRow | null;
  let postId = existingPost?.id;

  if (!existingPost) {
    const { data: newPostData, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        daily_usage_id: usage.id,
      } as never)
      .select()
      .single();

    const newPost = newPostData as PostRow | null;
    if (postError) {
      console.error('Error creating post:', postError);
      // Don't fail the request, usage was saved
    } else if (newPost) {
      postId = newPost.id;
    }
  }

  return NextResponse.json({
    usage_id: usage.id,
    post_url: postId ? `/posts/${postId}` : null,
  });
}
