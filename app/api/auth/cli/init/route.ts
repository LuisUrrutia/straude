import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

function generateCode(): string {
  // Generate a user-friendly code like "ABCD-1234"
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // No I or O to avoid confusion
  const numbers = '0123456789';

  let code = '';
  for (let i = 0; i < 4; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  code += '-';
  for (let i = 0; i < 4; i++) {
    code += numbers[Math.floor(Math.random() * numbers.length)];
  }
  return code;
}

export async function POST() {
  const supabase = createAdminClient();

  // Generate unique code
  let code = generateCode();
  let attempts = 0;

  while (attempts < 5) {
    const { data: existing } = await supabase
      .from('cli_auth_codes')
      .select('id')
      .eq('code', code)
      .eq('status', 'pending')
      .maybeSingle() as { data: { id: string } | null };

    if (!existing) break;
    code = generateCode();
    attempts++;
  }

  // Set expiration to 15 minutes from now
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error } = await supabase.from('cli_auth_codes').insert({
    code,
    expires_at: expiresAt,
    status: 'pending',
  } as never);

  if (error) {
    console.error('Error creating auth code:', error);
    return NextResponse.json({ error: 'Failed to create auth code' }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://straude.com';

  return NextResponse.json({
    code,
    verify_url: `${baseUrl}/cli/verify?code=${code}`,
  });
}
