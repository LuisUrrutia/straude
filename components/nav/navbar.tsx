'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Home, Trophy, Search } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/search', label: 'Search', icon: Search },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-light/80 backdrop-blur-md border-b border-sand">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-heading text-xl font-bold text-dark hover:text-accent transition-colors">
          STRAUDE
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-heading text-sm font-medium transition-colors',
                  isActive
                    ? 'text-accent bg-accent/10'
                    : 'text-gray hover:text-dark hover:bg-sand'
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-4">
          <SignedOut>
            <Link
              href="/sign-in"
              className="px-4 py-2 font-heading text-sm font-semibold text-accent hover:text-coral-dark transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 bg-accent text-light font-heading text-sm font-semibold rounded-lg hover:bg-coral-dark transition-colors"
            >
              Sign up
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'size-9',
                },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
