'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Avatar } from '@/components/ui/avatar';
import { Flame } from 'lucide-react';

// 5 BFL FLUX.2 generated endurance sport backgrounds (B&W)
const sportBackgrounds = [
  '/backgrounds/sport-1.jpg', // Trail running
  '/backgrounds/sport-2.jpg', // Cycling
  '/backgrounds/sport-3.jpg', // Swimming
  '/backgrounds/sport-4.jpg', // Running track
  '/backgrounds/sport-5.jpg', // Hiking/mountaineering
];

const navItems: { href: string; label: string; disabled?: boolean }[] = [
  { href: '/feed', label: 'Dashboard' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/history', label: 'History', disabled: true },
  { href: '/settings', label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isSignedIn } = useUser();
  const [streak, setStreak] = useState<number | null>(null);
  // Use first background as default to avoid hydration mismatch, randomize client-side
  const [backgroundStyle, setBackgroundStyle] = useState(sportBackgrounds[0]);

  useEffect(() => {
    // Randomize background on client mount
    const randomIndex = Math.floor(Math.random() * sportBackgrounds.length);
    setBackgroundStyle(sportBackgrounds[randomIndex]);
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch('/api/users/me/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.streak !== undefined) {
          setStreak(data.streak);
        }
      })
      .catch(() => {});
  }, [isSignedIn]);

  const displayName = user?.fullName || user?.firstName || user?.username || 'Welcome';
  const username = user?.username || 'user';

  return (
    <aside className="border-r-2 border-dark flex flex-col bg-light h-full">
      {/* User Card - Endurance sport themed background */}
      <div className="user-card" style={{ backgroundImage: `url(${backgroundStyle})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="relative z-10">
          <Avatar
            src={user?.imageUrl}
            alt={username}
            size="lg"
            className="border-2 border-white mb-4"
          />
          <h2 className="type-display-condensed text-xl leading-tight">
            {displayName}
          </h2>
          <div className="type-mono-look mt-2 opacity-80">
            @{username}
          </div>
        </div>

        <div className="relative z-10 mt-auto flex items-center gap-2 justify-end">
          <Flame className="size-6" />
          <span className="type-display-condensed text-3xl text-accent">
            {streak !== null ? streak : '--'}
          </span>
          <span className="text-base uppercase tracking-wider opacity-80">
            {streak === 1 ? 'Day' : 'Days'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          if (item.disabled) {
            return (
              <span
                key={item.href}
                className="nav-item text-gray opacity-50 cursor-not-allowed"
              >
                <span>{item.label}</span>
              </span>
            );
          }
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
        <div className="type-mono-look text-gray">Syncing...</div>
      </div>
    </aside>
  );
}
