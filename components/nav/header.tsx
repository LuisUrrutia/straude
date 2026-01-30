'use client';

import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export function Header() {
  return (
    <header className="border-b-2 border-dark p-6 flex justify-between items-end bg-light">
      <div>
        <Link href="/feed">
          <h1 className="type-display text-4xl md:text-5xl">
            STRAUDE<span className="text-accent">.</span>
          </h1>
        </Link>
        <div className="type-mono-look mt-1">Your Coding Rhythm</div>
      </div>

      <div className="flex items-end gap-8">
        {/* Global Stats */}
        <div className="hidden md:flex gap-12">
          <div className="flex flex-col items-end group relative cursor-help">
            <span className="text-xs uppercase opacity-60">Total Global Tokens</span>
            <span className="type-display-condensed text-lg">
              45<span className="slash-sep">/</span>892<span className="slash-sep">/</span>001
            </span>
            <div className="absolute top-full mt-2 right-0 bg-dark text-light text-xs px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Total tokens used across all Straude users
            </div>
          </div>
          <div className="flex flex-col items-end group relative cursor-help">
            <span className="text-xs uppercase opacity-60">Est. Cost</span>
            <span className="type-display-condensed text-lg">
              $4<span className="slash-sep">/</span>120.50
            </span>
            <div className="absolute top-full mt-2 right-0 bg-dark text-light text-xs px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Estimated total API spend across all users
            </div>
          </div>
        </div>

        {/* User Button */}
        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-10 h-10 border-2 border-dark',
              },
            }}
          />
        </SignedIn>
        <SignedOut>
          <Link
            href="/sign-in"
            className="action-btn primary"
          >
            Sign In
          </Link>
        </SignedOut>
      </div>
    </header>
  );
}
