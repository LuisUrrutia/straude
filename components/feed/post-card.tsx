'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from '@/lib/utils/date';
import { formatCurrency, formatNumber } from '@/lib/utils/format';
import { LikeButton } from '@/components/social/like-button';
import { MessageCircle, Share2, CheckCircle } from 'lucide-react';
import type { PostWithDetails } from '@/types';

interface PostCardProps {
  post: PostWithDetails;
  onLike?: (postId: string) => void;
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function getAvatarStyle(index: number): string {
  // Alternate between dark and pink avatars
  return index % 3 === 1 ? 'alt' : '';
}

export function PostCard({ post, onLike }: PostCardProps) {
  const handleShare = () => {
    const url = `${window.location.origin}/posts/${post.id}`;
    navigator.clipboard.writeText(url);
  };

  const displayName = post.user.display_name || post.user.username;
  const initial = getInitial(displayName);

  return (
    <article className="feed-item">
      {/* Avatar */}
      <Link href={`/u/${post.user.username}`}>
        {post.user.avatar_url ? (
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-dark">
            <Image
              src={post.user.avatar_url}
              alt={post.user.username}
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
        ) : (
          <div className="feed-avatar">
            {initial}
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex justify-between items-baseline mb-1.5">
          <Link
            href={`/u/${post.user.username}`}
            className="font-display font-semibold text-lg text-dark hover:text-accent transition-colors no-underline"
          >
            {displayName}
          </Link>
          <span className="type-mono-look text-gray">
            {formatDistanceToNow(post.created_at)}
          </span>
        </div>

        {/* Description */}
        {post.description && (
          <p className="text-sm mb-2">{post.description}</p>
        )}

        {/* Usage Stats */}
        <div className="flex items-center gap-4 text-sm">
          <span className="metric-price font-semibold">
            {formatCurrency(post.usage.cost_usd)}
          </span>
          <span className="text-gray">
            {formatNumber(post.usage.total_tokens)} tokens
          </span>
          {post.usage.is_verified && (
            <span className="flex items-center gap-1 text-success text-xs">
              <CheckCircle className="size-3" />
              Verified
            </span>
          )}
        </div>

        {/* Code Snippet / Models */}
        {post.usage.models && post.usage.models.length > 0 && (
          <div className="code-snippet">
            &gt; Models: {post.usage.models.join(', ')}
          </div>
        )}

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className="mt-3 grid gap-1 grid-cols-2">
            {post.images.slice(0, 4).map((image, idx) => (
              <div
                key={idx}
                className="relative aspect-video border border-dark"
              >
                <Image
                  src={image}
                  alt={`Post image ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-sand">
          <LikeButton
            postId={post.id}
            initialLiked={post.is_liked || false}
            initialCount={post.like_count}
            onLike={onLike}
          />
          <Link
            href={`/posts/${post.id}#comments`}
            className="flex items-center gap-1.5 text-gray hover:text-dark transition-colors"
          >
            <MessageCircle className="size-4" />
            <span className="text-sm">{post.comment_count}</span>
          </Link>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-gray hover:text-dark transition-colors ml-auto"
          >
            <Share2 className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
