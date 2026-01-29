'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface TabStripProps {
  postCount?: number;
}

const tabs = [
  { href: '/feed', label: 'Activity' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/settings', label: 'Profile' },
];

export function TabStrip({ postCount = 0 }: TabStripProps) {
  const pathname = usePathname();

  return (
    <div className="tab-strip md:hidden">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
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
