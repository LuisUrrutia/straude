'use client';

import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FollowButton } from '@/components/social/follow-button';
import { getCountryByCode } from '@/lib/data/countries';
import { formatCurrency, formatCompactNumber } from '@/lib/utils/format';
import { MapPin, Link as LinkIcon, Github, Flame, Trophy, Globe } from 'lucide-react';
import type { UserProfileResponse } from '@/types';

interface ProfileHeaderProps {
  user: UserProfileResponse;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const country = getCountryByCode(user.country);

  return (
    <div className="bg-light border border-sand rounded-xl p-6">
      {/* Top section */}
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Avatar */}
        <Avatar
          src={user.avatar_url}
          alt={user.username}
          size="xl"
          className="mx-auto sm:mx-0"
        />

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="font-heading text-2xl font-bold text-dark">
            {user.display_name || user.username}
          </h1>
          <p className="text-gray">@{user.username}</p>

          {user.bio && (
            <p className="mt-3 font-body text-dark">{user.bio}</p>
          )}

          {/* Meta */}
          <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-gray">
            {country && (
              <span className="flex items-center gap-1">
                <MapPin className="size-4" />
                {country.flag} {country.name}
              </span>
            )}
            {user.link && (
              <a
                href={user.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-slate-blue hover:underline"
              >
                <LinkIcon className="size-4" />
                {user.link.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            )}
            {user.github_username && (
              <a
                href={`https://github.com/${user.github_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-dark"
              >
                <Github className="size-4" />
                {user.github_username}
              </a>
            )}
          </div>

          {/* Follow counts */}
          <div className="mt-4 flex justify-center sm:justify-start gap-4">
            <Link
              href={`/u/${user.username}/followers`}
              className="hover:text-accent"
            >
              <span className="font-heading font-bold text-dark">
                {formatCompactNumber(user.stats.followers_count)}
              </span>{' '}
              <span className="text-gray">followers</span>
            </Link>
            <Link
              href={`/u/${user.username}/following`}
              className="hover:text-accent"
            >
              <span className="font-heading font-bold text-dark">
                {formatCompactNumber(user.stats.following_count)}
              </span>{' '}
              <span className="text-gray">following</span>
            </Link>
          </div>
        </div>

        {/* Action button */}
        <div>
          {user.is_own_profile ? (
            <Link href="/settings">
              <Button variant="secondary">Edit Profile</Button>
            </Link>
          ) : (
            <FollowButton
              username={user.username}
              initialFollowing={user.is_following || false}
            />
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-sand">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-accent mb-1">
            <Globe className="size-4" />
          </div>
          <div className="font-heading text-xl font-bold text-dark">
            {user.stats.global_rank ? `#${user.stats.global_rank}` : '-'}
          </div>
          <div className="text-xs text-gray">Global Rank</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-accent mb-1">
            <Trophy className="size-4" />
          </div>
          <div className="font-heading text-xl font-bold text-dark">
            {user.stats.regional_rank ? `#${user.stats.regional_rank}` : '-'}
          </div>
          <div className="text-xs text-gray">Regional Rank</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-accent mb-1">
            <Flame className="size-4" />
          </div>
          <div className="font-heading text-xl font-bold text-dark">
            {user.stats.current_streak}
          </div>
          <div className="text-xs text-gray">Day Streak</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-xl font-bold text-dark">
            {formatCurrency(user.stats.total_spent)}
          </div>
          <div className="text-xs text-gray">All-time Spent</div>
        </div>
      </div>
    </div>
  );
}
