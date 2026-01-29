import { jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';

export interface CliAuthPayload {
  userId: string;
  clerkId?: string;
  username?: string;
}

export function getBearerToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization') || '';
  if (!header.toLowerCase().startsWith('bearer ')) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

export async function verifyCliToken(token: string): Promise<CliAuthPayload | null> {
  const secret = process.env.CLI_JWT_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const userId = typeof payload.sub === 'string' ? payload.sub : null;
    if (!userId) return null;

    return {
      userId,
      clerkId: typeof payload.clerk_id === 'string' ? payload.clerk_id : undefined,
      username: typeof payload.username === 'string' ? payload.username : undefined,
    };
  } catch {
    return null;
  }
}
