'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { clsx } from 'clsx';

interface LikeButtonProps {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  onLike?: (postId: string) => void;
}

export function LikeButton({ postId, initialLiked, initialCount, onLike }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;

    setIsLoading(true);
    const wasLiked = isLiked;

    // Optimistic update
    setIsLiked(!wasLiked);
    setCount((prev) => (wasLiked ? prev - 1 : prev + 1));

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: wasLiked ? 'DELETE' : 'POST',
      });

      if (!res.ok) {
        // Revert on error
        setIsLiked(wasLiked);
        setCount((prev) => (wasLiked ? prev + 1 : prev - 1));
      } else {
        onLike?.(postId);
      }
    } catch {
      // Revert on error
      setIsLiked(wasLiked);
      setCount((prev) => (wasLiked ? prev + 1 : prev - 1));
    }

    setIsLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={clsx(
        'flex items-center gap-2 transition-colors',
        isLiked ? 'text-accent' : 'text-gray hover:text-accent'
      )}
    >
      <Heart
        className={clsx(
          'size-5 transition-transform',
          isLiked && 'fill-current scale-110'
        )}
      />
      <span className="text-sm">{count}</span>
    </button>
  );
}
