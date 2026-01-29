'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { clsx } from 'clsx';
import type { LeaderboardPeriod, Region } from '@/types';

const periods: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all_time', label: 'All Time' },
];

const regions: { value: Region | 'global'; label: string }[] = [
  { value: 'global', label: 'Global' },
  { value: 'north_america', label: 'N. America' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia', label: 'Asia' },
];

export function PeriodTabs() {
  const searchParams = useSearchParams();
  const currentPeriod = (searchParams.get('period') as LeaderboardPeriod) || 'day';
  const currentRegion = searchParams.get('region') || 'global';

  const createUrl = (period: LeaderboardPeriod, region: string) => {
    const params = new URLSearchParams();
    params.set('period', period);
    if (region !== 'global') {
      params.set('region', region);
    }
    return `/leaderboard?${params}`;
  };

  return (
    <>
      {/* Period buttons */}
      {periods.map((period) => (
        <Link
          key={period.value}
          href={createUrl(period.value, currentRegion)}
          className={clsx(
            'action-btn border-r border-dark',
            currentPeriod === period.value && 'primary'
          )}
        >
          {period.label}
        </Link>
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Region dropdown */}
      <div className="relative group">
        <button className="action-btn border-l border-dark border-r-0">
          Region: {regions.find((r) => r.value === currentRegion)?.label || 'Global'}
        </button>
        <div className="absolute top-full right-0 hidden group-hover:block bg-light border border-dark shadow-lg z-20 min-w-[150px]">
          {regions.map((region) => (
            <Link
              key={region.value}
              href={createUrl(currentPeriod, region.value)}
              className={clsx(
                'block px-4 py-2 type-mono-look hover:bg-sand transition-colors no-underline text-dark',
                currentRegion === region.value && 'bg-accent text-light'
              )}
            >
              {region.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
