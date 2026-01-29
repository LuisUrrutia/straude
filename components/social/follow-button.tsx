'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface FollowButtonProps {
  username: string;
  initialFollowing: boolean;
}

export function FollowButton({ username, initialFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;

    setIsLoading(true);
    const wasFollowing = isFollowing;

    // Optimistic update
    setIsFollowing(!wasFollowing);

    try {
      const res = await fetch(`/api/follow/${username}`, {
        method: wasFollowing ? 'DELETE' : 'POST',
      });

      if (!res.ok) {
        // Revert on error
        setIsFollowing(wasFollowing);
      }
    } catch {
      // Revert on error
      setIsFollowing(wasFollowing);
    }

    setIsLoading(false);
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant={isFollowing ? 'secondary' : 'primary'}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
}
