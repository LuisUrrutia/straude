'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PostCard } from './post-card';
import { Loader2 } from 'lucide-react';
import type { PostWithDetails } from '@/types';

interface PostListProps {
  initialPosts: PostWithDetails[];
  initialCursor?: string | null;
  currentUserId?: string | null;
}

export function PostList({ initialPosts, initialCursor, currentUserId }: PostListProps) {
  const [posts, setPosts] = useState<PostWithDetails[]>(initialPosts);
  const [cursor, setCursor] = useState<string | null>(initialCursor || null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(!!initialCursor);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      if (cursor) params.set('cursor', cursor);
      params.set('limit', '20');

      const res = await fetch(`/api/feed?${params}`);
      const data = await res.json();

      setPosts((prev) => [...prev, ...data.posts]);
      setCursor(data.next_cursor);
      setHasMore(!!data.next_cursor);
    } catch (error) {
      console.error('Error loading posts:', error);
    }

    setIsLoading(false);
  }, [cursor, hasMore, isLoading]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoading]);

  const handlePostUpdate = useCallback(
    (postId: string, updates: { description?: string; images?: string[] }) => {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, ...updates } : post
        )
      );
    },
    []
  );

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray font-body">No posts yet.</p>
        <p className="text-gray font-body text-sm mt-2">
          Follow some builders to see their posts here!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onPostUpdate={handlePostUpdate}
          currentUserId={currentUserId}
        />
      ))}

      {/* Loader / sentinel element */}
      <div ref={loaderRef} className="py-4 flex justify-center">
        {isLoading && (
          <Loader2 className="size-6 text-accent animate-spin" />
        )}
        {!hasMore && posts.length > 0 && (
          <p className="text-sm text-gray">You&apos;re all caught up!</p>
        )}
      </div>
    </div>
  );
}
