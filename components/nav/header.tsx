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
        <div className="type-mono-look mt-1">Claude Usage Tracker // v1.0</div>
      </div>

      <div className="flex items-end gap-8">
        {/* Global Stats */}
        <div className="hidden md:flex gap-12">
          <div className="flex flex-col items-end">
            <span className="text-xs uppercase opacity-60">Total Global Tokens</span>
            <span className="type-display-condensed text-lg">
              45<span className="slash-sep">/</span>892<span className="slash-sep">/</span>001
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs uppercase opacity-60">Est. Cost</span>
            <span className="type-display-condensed text-lg">
              $4<span className="slash-sep">/</span>120.50
            </span>
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
