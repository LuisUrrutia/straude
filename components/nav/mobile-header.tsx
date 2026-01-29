'use client';

import { useEffect, useState } from 'react';

interface MobileHeaderProps {
  streak?: number;
  totalTokens?: string;
}

export function MobileHeader({ streak = 0, totalTokens = '--' }: MobileHeaderProps) {
  const [timeString, setTimeString] = useState('--:--:--');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-accent-orange p-4 border-b border-dark flex flex-col min-h-[200px]">
      {/* Meta bar */}
      <div className="flex justify-between items-start type-mono-look text-ink mb-6">
        <span>STRAUDE &copy; 2025</span>
        <span>CLAUDE CODE TRACKER</span>
        <span>{timeString}</span>
      </div>

      {/* Main headline */}
      <div className="mb-4">
        <h1 className="font-display text-[2.8rem] leading-[0.9] tracking-tight text-ink font-bold">
          Your coding<br />rhythm.
        </h1>
      </div>

      {/* Stats ticker */}
      <div className="flex gap-4 mt-auto border-t border-dark pt-3">
        <div className="flex flex-col">
          <span className="type-mono-look text-ink opacity-80">Daily Streak</span>
          <span className="font-display text-2xl font-semibold text-ink">
            {streak > 0 ? `${streak} Days` : '--'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="type-mono-look text-ink opacity-80">Total Tokens</span>
          <span className="font-display text-2xl font-semibold text-ink">
            {totalTokens}
          </span>
        </div>
      </div>
    </header>
  );
}
