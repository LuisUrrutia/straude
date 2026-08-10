import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
  '/api/auth/cli/(.*)',
  '/u/(.*)', // Public profile pages
  '/leaderboard',
  '/api/leaderboard',
  '/api/users/(.*)', // Public user APIs
  '/api/posts/(.*)', // Public post APIs
]);

// Routes that require onboarding to be completed
const requiresOnboarding = createRouteMatcher([
  '/feed(.*)',
  '/settings(.*)',
  '/api/usage/(.*)',
  '/api/feed(.*)',
  '/api/follow/(.*)',
]);

async function fetchOnboardingCompleted(userId: string): Promise<boolean | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  const url = new URL(`${supabaseUrl}/rest/v1/users`);
  url.searchParams.set('select', 'onboarding_completed');
  url.searchParams.set('clerk_id', `eq.${userId}`);
  url.searchParams.set('limit', '1');

  try {
    const res = await fetch(url.toString(), {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Onboarding lookup failed:', res.status);
      return null;
    }

    const data = (await res.json()) as Array<{ onboarding_completed?: boolean }>;
    if (!data || data.length === 0) {
      return null; // user not found in DB
    }
    return data[0].onboarding_completed === true;
  } catch (error) {
    console.error('Onboarding lookup error:', error);
    return null;
  }
}

async function fetchClerkOnboardingCompleted(userId: string): Promise<boolean | null> {
  const clerkKey = process.env.CLERK_SECRET_KEY;
  if (!clerkKey) {
    return null;
  }

  try {
    const res = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${clerkKey}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Clerk onboarding lookup failed:', res.status);
      return null;
    }

    const data = (await res.json()) as {
      public_metadata?: Record<string, unknown>;
      publicMetadata?: Record<string, unknown>;
    };
    const publicMetadata = data.public_metadata || data.publicMetadata || {};
    const value = publicMetadata.onboardingCompleted;
    if (value === true) return true;
    if (value === false) return false;
    return null;
  } catch (error) {
    console.error('Clerk onboarding lookup error:', error);
    return null;
  }
}

export default clerkMiddleware(async (auth, request) => {
  const { userId, sessionClaims } = await auth();
  const claims = sessionClaims as Record<string, unknown> | null;
  const publicMetadata =
    (claims && (claims.publicMetadata || claims.public_metadata)) as
      | Record<string, unknown>
      | undefined;
  const onboardingFromClerk = publicMetadata?.onboardingCompleted === true;

  // Allow public routes
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // Protect all other routes
  if (!userId) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect_url', request.url);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect already-onboarded users away from /onboarding
  if (request.nextUrl.pathname.startsWith('/onboarding')) {
    const onboardingCompleted = request.cookies.get('onboarding_completed')?.value === 'true';
    if (onboardingCompleted || onboardingFromClerk) {
      return NextResponse.redirect(new URL('/feed', request.url));
    }
  }

  // Check if user needs onboarding (for routes that require it)
  if (requiresOnboarding(request)) {
    // We'll check onboarding status via a cookie set during auth
    const onboardingCompleted = request.cookies.get('onboarding_completed')?.value === 'true';

    if (onboardingFromClerk && !onboardingCompleted) {
      const response = NextResponse.next();
      response.cookies.set('onboarding_completed', 'true', {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      });
      return response;
    }

    if (!onboardingCompleted && !onboardingFromClerk) {
      const clerkCompleted = userId ? await fetchClerkOnboardingCompleted(userId) : null;

      if (clerkCompleted) {
        const response = NextResponse.next();
        response.cookies.set('onboarding_completed', 'true', {
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
        });
        return response;
      }

      if (clerkCompleted === false && !request.nextUrl.pathname.startsWith('/onboarding')) {
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }

      const dbCompleted = userId ? await fetchOnboardingCompleted(userId) : null;

      if (dbCompleted) {
        const response = NextResponse.next();
        response.cookies.set('onboarding_completed', 'true', {
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
        });
        return response;
      }

      if (dbCompleted === false && !request.nextUrl.pathname.startsWith('/onboarding')) {
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
