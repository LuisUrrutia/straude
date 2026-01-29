import Image from 'next/image';
import { clsx } from 'clsx';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 80,
  xl: 120,
};

export function Avatar({ src, alt, size = 'md', className }: AvatarProps) {
  const dimension = sizeMap[size];

  return (
    <div
      className={clsx(
        'relative rounded-full overflow-hidden bg-sand border-2 border-light shadow-sm flex-shrink-0',
        className
      )}
      style={{ width: dimension, height: dimension }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-accent/20 text-accent font-heading font-bold">
          {alt.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}
