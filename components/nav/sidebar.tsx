'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Avatar } from '@/components/ui/avatar';

const navItems = [
  { href: '/feed', label: 'Dashboard' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/history', label: 'History' },
  { href: '/settings', label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <aside className="border-r-2 border-dark flex flex-col bg-light">
      {/* User Card - Purple background with decorative element */}
      <div className="user-card">
        <div className="relative z-10">
          <Avatar
            src={user?.imageUrl}
            alt={user?.username || 'User'}
            size="lg"
            className="border-2 border-white mb-4"
          />
          <h2 className="type-display-condensed text-xl leading-tight">
            {user?.firstName || user?.username || 'Welcome'}
            {user?.lastName && (
              <>
                <br />
                {user.lastName}
              </>
            )}
          </h2>
          <div className="type-mono-look mt-2 opacity-80">
            @{user?.username || 'user'}
          </div>
        </div>

        <div className="relative z-10 mt-auto">
          <div className="text-sm uppercase tracking-wider mb-1 opacity-80">Daily Usage</div>
          <div className="stat-big type-display">--</div>
          <div className="text-sm mt-1 opacity-80">Push to update</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item text-dark no-underline ${isActive ? 'active' : ''}`}
            >
              <span>{item.label}</span>
              {isActive && <span>&rarr;</span>}
            </Link>
          );
        })}
      </nav>

      {/* Status */}
      <div className="p-6 border-t border-dark mt-auto">
        <div className="type-mono-look">API Status: Online</div>
        <div className="type-mono-look text-accent-purple">Syncing...</div>
      </div>
    </aside>
  );
}
