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

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

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

  // Check if user needs onboarding (for routes that require it)
  if (requiresOnboarding(request)) {
    // We'll check onboarding status via a cookie set during auth
    const onboardingCompleted = request.cookies.get('onboarding_completed')?.value === 'true';

    if (!onboardingCompleted && !request.nextUrl.pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
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
