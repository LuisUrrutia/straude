'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency, formatNumber } from '@/lib/utils/format';
import { clsx } from 'clsx';
import type { LeaderboardEntryWithRank } from '@/types';

interface LeaderboardTableProps {
  entries: LeaderboardEntryWithRank[];
  currentUserId?: string;
}

function formatRank(rank: number): string {
  return rank.toString().padStart(2, '0');
}

export function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="card-brutal inline-block p-8">
          <h2 className="type-display-condensed text-xl mb-4">No Entries Yet</h2>
          <p className="text-gray">
            Push your Claude Code usage to appear on the leaderboard!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-container">
      {entries.map((entry) => {
        const isCurrentUser = entry.user_id === currentUserId;
        const displayName = entry.display_name || entry.username;

        return (
          <Link
            key={entry.user_id}
            href={`/u/${entry.username}`}
            className={clsx(
              'feed-row grid-cols-[0.5fr_2fr_1fr] md:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] no-underline text-dark',
              isCurrentUser && 'bg-accent/10'
            )}
          >
            {/* Rank */}
            <div className="rank text-2xl">
              {formatRank(entry.rank)}
            </div>

            {/* User */}
            <div className="flex items-center gap-3 min-w-0">
              {entry.avatar_url ? (
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-dark">
                  <Image
                    src={entry.avatar_url}
                    alt={entry.username}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="feed-avatar">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-heading text-lg truncate">
                {displayName}
              </span>
            </div>

            {/* Tokens */}
            <div className="metric type-display-condensed">
              {formatNumber(entry.total_tokens)}
              <span className="text-gray text-xs ml-1">TKS</span>
            </div>

            {/* Cost - hidden on mobile */}
            <div className="metric hidden md:block metric-price">
              {formatCurrency(entry.total_cost)}
            </div>

            {/* Time - placeholder */}
            <div className="metric hidden md:block text-gray">
              --
            </div>
          </Link>
        );
      })}
    </div>
  );
}
