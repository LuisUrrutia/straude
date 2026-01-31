import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const onboardingSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-z0-9_]+$/),
  country: z.string().length(2),
  region: z.enum(['north_america', 'south_america', 'europe', 'asia', 'africa', 'oceania']),
  is_public: z.boolean(),
  bio: z.string().max(160).nullable(),
  link: z.string().max(200).nullable(),
  timezone: z.string(),
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid data', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { username, country, region, is_public, bio, link, timezone } = parsed.data;
  const normalizedUsername = username.toLowerCase();

  const supabase = await createClient();

  // Check if username is taken in Clerk (source of truth)
  try {
    const clerkResults = await clerkClient.users.getUserList({
      query: normalizedUsername,
      limit: 10,
    });
    const clerkTaken = clerkResults.data.some(
      (user) => user.username?.toLowerCase() === normalizedUsername && user.id !== userId
    );
    if (clerkTaken) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }
  } catch (error) {
    console.error('Error checking Clerk username:', error);
    return NextResponse.json({ error: 'Clerk lookup failed' }, { status: 500 });
  }

  // Check if username is taken
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('username', normalizedUsername)
    .neq('clerk_id', userId)
    .maybeSingle();

  if (existingUser) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
  }

  // Update Clerk username + onboarding status (canonical source)
  try {
    const clerkUser = await clerkClient.users.getUser(userId);
    const publicMetadata = clerkUser.publicMetadata || {};

    await clerkClient.users.updateUser(userId, {
      username: normalizedUsername,
      publicMetadata: {
        ...publicMetadata,
        onboardingCompleted: true,
      },
    });
  } catch (error) {
    console.error('Error updating Clerk username:', error);
    return NextResponse.json({ error: 'Failed to update username' }, { status: 500 });
  }

  // Upsert user profile (handles case where webhook hasn't fired yet)
  const { data, error } = await supabase
    .from('users')
    .upsert({
      clerk_id: userId,
      username: normalizedUsername,
      country,
      region,
      is_public,
      bio,
      link,
      timezone,
      onboarding_completed: true,
    } as never, {
      onConflict: 'clerk_id',
    })
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  const response = NextResponse.json({ user: data });
  response.cookies.set('onboarding_completed', 'true', {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
