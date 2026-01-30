'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

interface TabStripProps {
  postCount?: number;
}

export function TabStrip({ postCount = 0 }: TabStripProps) {
  const pathname = usePathname();
  const { user } = useUser();

  const tabs = [
    { href: '/feed', label: 'Activity', matchPattern: '/feed' },
    { href: '/leaderboard', label: 'Leaderboard', matchPattern: '/leaderboard' },
    { href: user?.username ? `/u/${user.username}` : '/settings', label: 'Profile', matchPattern: '/u/' },
  ];

  return (
    <div className="tab-strip md:hidden">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href ||
          pathname.startsWith(tab.matchPattern + '/') ||
          pathname === tab.matchPattern ||
          (tab.matchPattern === '/u/' && pathname.startsWith('/u/'));
        const label = tab.href === '/feed' && postCount > 0
          ? `${tab.label} (${postCount})`
          : tab.label;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`tab ${isActive ? 'active' : ''}`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
