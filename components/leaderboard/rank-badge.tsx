import { clsx } from 'clsx';

interface RankBadgeProps {
  rank: number;
  size?: 'sm' | 'md';
}

export function RankBadge({ rank, size = 'md' }: RankBadgeProps) {
  const isTopThree = rank <= 3;
  const isTop10 = rank <= 10;

  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center font-heading font-bold rounded',
        {
          'min-w-[32px] h-7 px-2.5 text-sm': size === 'md',
          'min-w-[24px] h-5 px-1.5 text-xs': size === 'sm',
          // Gold
          'bg-gradient-to-br from-yellow-300 to-orange-400 text-dark': rank === 1,
          // Silver
          'bg-gradient-to-br from-gray-200 to-gray-400 text-dark': rank === 2,
          // Bronze
          'bg-gradient-to-br from-amber-500 to-amber-700 text-light': rank === 3,
          // 4-10
          'bg-accent text-light': !isTopThree && isTop10,
          // 11+
          'bg-sand text-dark': !isTop10,
        }
      )}
    >
      #{rank}
    </span>
  );
}
