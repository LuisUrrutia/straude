import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { SignJWT } from 'jose';

export async function POST(request: NextRequest) {
  const { code } = await request.json();

  if (!code) {
    return NextResponse.json({ error: 'Code required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  interface AuthCodeRow {
    id: string;
    code: string;
    user_id: string | null;
    status: string;
    expires_at: string;
    user: {
      id: string;
      clerk_id: string;
      username: string;
    } | null;
  }

  // Find the auth code
  const { data: authCode, error } = await supabase
    .from('cli_auth_codes')
    .select('*, user:users(id, clerk_id, username)')
    .eq('code', code)
    .single() as { data: AuthCodeRow | null; error: unknown };

  if (error || !authCode) {
    return NextResponse.json({ status: 'expired' });
  }

  // Check if expired
  if (new Date(authCode.expires_at) < new Date()) {
    await supabase
      .from('cli_auth_codes')
      .update({ status: 'expired' } as never)
      .eq('id', authCode.id);

    return NextResponse.json({ status: 'expired' });
  }

  // Check status
  if (authCode.status === 'pending') {
    return NextResponse.json({ status: 'pending' });
  }

  if (authCode.status === 'completed' && authCode.user) {
    // Generate JWT token
    const secret = new TextEncoder().encode(process.env.CLI_JWT_SECRET);

    const token = await new SignJWT({
      sub: authCode.user.id,
      clerk_id: authCode.user.clerk_id,
      username: authCode.user.username,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);

    // Delete the used auth code
    await supabase.from('cli_auth_codes').delete().eq('id', authCode.id);

    return NextResponse.json({
      status: 'completed',
      token,
      username: authCode.user.username,
    });
  }

  return NextResponse.json({ status: 'expired' });
}
