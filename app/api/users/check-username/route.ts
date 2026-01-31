import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const usernameParam = searchParams.get('username');

  if (!usernameParam) {
    return NextResponse.json({ error: 'Username required' }, { status: 400 });
  }

  // Validate format
  const usernameRegex = /^[a-z0-9_]{3,20}$/;
  if (!usernameRegex.test(usernameParam)) {
    return NextResponse.json({ available: false, error: 'Invalid format' });
  }

  const username = usernameParam.toLowerCase();

  // Check Clerk first (source of truth)
  try {
    const clerkResults = await clerkClient.users.getUserList({
      query: username,
      limit: 10,
    });
    const clerkTaken = clerkResults.data.some(
      (user) => user.username?.toLowerCase() === username
    );
    if (clerkTaken) {
      return NextResponse.json({ available: false });
    }
  } catch (error) {
    console.error('Error checking Clerk username:', error);
    return NextResponse.json({ error: 'Clerk lookup failed' }, { status: 500 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    console.error('Error checking username:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ available: !data });
}
