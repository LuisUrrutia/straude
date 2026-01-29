import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code } = await request.json();

  if (!code) {
    return NextResponse.json({ error: 'Code required' }, { status: 400 });
  }

  const supabase = await createClient();
  const adminSupabase = createAdminClient();

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

  interface AuthCodeRow {
    id: string;
    expires_at: string;
    status: string;
  }

  // Find and update the auth code
  const { data: authCodeData, error: fetchError } = await adminSupabase
    .from('cli_auth_codes')
    .select('id, expires_at, status')
    .eq('code', code)
    .eq('status', 'pending')
    .single() as { data: AuthCodeRow | null; error: unknown };

  const authCode = authCodeData;
  if (fetchError || !authCode) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
  }

  // Check if expired
  if (new Date(authCode.expires_at) < new Date()) {
    await adminSupabase
      .from('cli_auth_codes')
      .update({ status: 'expired' } as never)
      .eq('id', authCode.id);

    return NextResponse.json({ error: 'Code expired' }, { status: 400 });
  }

  // Mark as completed
  const { error: updateError } = await adminSupabase
    .from('cli_auth_codes')
    .update({
      status: 'completed',
      user_id: user.id,
    } as never)
    .eq('id', authCode.id);

  if (updateError) {
    console.error('Error updating auth code:', updateError);
    return NextResponse.json({ error: 'Failed to verify' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
