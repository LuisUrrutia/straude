'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { formatDistanceToNow } from '@/lib/utils/date';
import { formatCurrency, formatNumber } from '@/lib/utils/format';
import { LikeButton } from '@/components/social/like-button';
import { MessageCircle, Share2, CheckCircle, Pencil, X, Check, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import type { PostWithDetails } from '@/types';

interface PostCardProps {
  post: PostWithDetails;
  onLike?: (postId: string) => void;
  onPostUpdate?: (postId: string, updates: { description?: string; images?: string[] }) => void;
  currentUserId?: string | null;
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function getAvatarStyle(index: number): string {
  // Alternate between dark and pink avatars
  return index % 3 === 1 ? 'alt' : '';
}

export function PostCard({ post, onLike, onPostUpdate, currentUserId }: PostCardProps) {
  const [timeLabel, setTimeLabel] = useState('...');
  const [isEditing, setIsEditing] = useState(false);
  const [caption, setCaption] = useState(post.description || '');
  const [images, setImages] = useState<string[]>(post.images || []);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const isOwnPost = currentUserId ? currentUserId === post.user_id : false;

  useEffect(() => {
    setTimeLabel(formatDistanceToNow(post.created_at));
  }, [post.created_at]);

  const handleShare = () => {
    const url = `${window.location.origin}/posts/${post.id}`;
    navigator.clipboard.writeText(url);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: caption, images }),
      });
      if (res.ok) {
        setIsEditing(false);
        onPostUpdate?.(post.id, { description: caption, images });
      }
    } catch (e) {
      console.error('Failed to update post', e);
    }
    setIsSaving(false);
  };

  const handleCancelEdit = () => {
    setCaption(post.description || '');
    setImages(post.images || []);
    setIsEditing(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        setImages((prev) => [...prev, url]);
      }
    } catch (e) {
      console.error('Failed to upload image', e);
    }
    setIsUploading(false);
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const displayName = post.user.display_name || post.user.username;
  const initial = getInitial(displayName);

  return (
    <motion.article
      className="feed-item"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Avatar */}
      <Link href={`/u/${post.user.username}`}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.15 }}
        >
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
        </motion.div>
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
            {timeLabel}
          </span>
        </div>

        {/* Description / Caption */}
        {isEditing ? (
          <div className="mb-2 space-y-2">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="w-full text-sm p-2 border border-dark resize-none focus:outline-none focus:ring-1 focus:ring-accent"
              rows={2}
              autoFocus
            />

            {/* Image preview during edit */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 border border-dark">
                    <Image src={img} alt="" fill className="object-cover" />
                    <button
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute -top-1 -right-1 bg-error text-white rounded-full p-0.5"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1 text-xs text-success hover:text-dark"
              >
                <Check className="size-3" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1 text-xs text-gray hover:text-dark"
              >
                <X className="size-3" />
                Cancel
              </button>
              <label className="flex items-center gap-1 text-xs text-gray hover:text-dark cursor-pointer ml-auto">
                {isUploading ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <ImagePlus className="size-3" />
                )}
                <span>{isUploading ? 'Uploading...' : 'Add photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="mb-2 group/caption">
            {post.description ? (
              <p className="text-sm inline">{post.description}</p>
            ) : isOwnPost ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-gray hover:text-dark italic"
              >
                Add a caption...
              </button>
            ) : null}
            {isOwnPost && (
              <button
                onClick={() => setIsEditing(true)}
                className={`ml-2 text-gray hover:text-dark transition-opacity ${post.description ? 'opacity-0 group-hover/caption:opacity-100' : ''}`}
                title="Edit post"
              >
                <Pencil className="size-3 inline" />
              </button>
            )}
          </div>
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
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-dark">
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
          <motion.button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-gray hover:text-dark transition-colors ml-auto"
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
          >
            <Share2 className="size-4" />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
