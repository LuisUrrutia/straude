'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/feed', label: 'Feed' },
  { href: '/leaderboard', label: 'Board' },
  { href: '/search', label: 'Explore' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[60px] bg-light border-t border-dark z-50 md:hidden flex justify-between items-center px-4">
      <div className="flex gap-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`type-mono-look no-underline ${isActive ? 'text-accent-pink' : 'text-dark'}`}
            >
              {isActive && <span className="mr-1">&#9658;</span>}
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="type-mono-look text-gray">
        V 1.0.4
      </div>
    </nav>
  );
}
