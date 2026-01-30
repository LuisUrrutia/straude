import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

interface UserRow {
  id: string;
  username: string;
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', userId)
    .single();

  let user = userData as UserRow | null;

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    const clerkUser = await clerkClient.users.getUser(userId);
    const clerkUsername = clerkUser.username?.toLowerCase() ?? null;

    if (clerkUsername && user.username !== clerkUsername) {
      const { data: conflict } = await supabase
        .from('users')
        .select('id')
        .eq('username', clerkUsername)
        .neq('id', user.id)
        .maybeSingle();

      if (conflict) {
        return NextResponse.json(
          { error: 'Username conflict', username: clerkUsername },
          { status: 409 }
        );
      }

      const { data: updatedUser } = await supabase
        .from('users')
        .update({ username: clerkUsername } as never)
        .eq('id', user.id)
        .select()
        .single();

      if (updatedUser) {
        user = updatedUser as UserRow;
      }
    }
  } catch (err) {
    console.error('Error syncing Clerk username:', err);
  }

  return NextResponse.json(user);
}

const updateSchema = z.object({
  display_name: z.string().max(50).nullable().optional(),
  bio: z.string().max(160).nullable().optional(),
  link: z.string().max(200).nullable().optional(),
  country: z.string().length(2).optional(),
  region: z.enum(['north_america', 'south_america', 'europe', 'asia', 'africa', 'oceania']).optional(),
  is_public: z.boolean().optional(),
  timezone: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid data', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from('users')
    .update(parsed.data as never)
    .eq('clerk_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json(user);
}
