import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { CommentSection } from '@/components/social/comment-section';
import { LikeButton } from '@/components/social/like-button';
import { formatDistanceToNow } from '@/lib/utils/date';
import { formatCurrency, formatNumber } from '@/lib/utils/format';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

interface PostRow {
  id: string;
  user_id: string;
  daily_usage_id: string;
  description: string | null;
  images: string[];
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  usage: {
    cost_usd: number;
    total_tokens: number;
    is_verified: boolean;
    models: string[];
  };
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: postData } = await supabase
    .from('posts')
    .select('user:users(username, display_name)')
    .eq('id', id)
    .single();

  if (!postData) {
    return { title: 'Post Not Found | Straude' };
  }

  const post = postData as { user: { username: string; display_name: string | null } };
  const name = post.user.display_name || post.user.username;

  return {
    title: `${name}'s Post | Straude`,
  };
}

async function getPost(id: string) {
  const supabase = await createClient();

  const { data: postData, error } = await supabase
    .from('posts')
    .select(`
      *,
      user:users(id, username, display_name, avatar_url),
      usage:daily_usage(cost_usd, total_tokens, is_verified, models)
    `)
    .eq('id', id)
    .single();

  if (error || !postData) {
    return null;
  }

  const post = postData as PostRow;

  const [{ count: likeCount }, { count: commentCount }] = await Promise.all([
    supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', id),
    supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', id),
  ]);

  return {
    ...post,
    like_count: likeCount || 0,
    comment_count: commentCount || 0,
  };
}

async function getCurrentUserId() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single();

  return (data as { id: string } | null)?.id || null;
}

async function getIsLiked(postId: string, userId: string | null) {
  if (!userId) return false;

  const supabase = await createClient();
  const { data } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  return !!data;
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const [post, currentUserId] = await Promise.all([
    getPost(id),
    getCurrentUserId(),
  ]);

  if (!post) {
    notFound();
  }

  const isLiked = await getIsLiked(id, currentUserId);
  const displayName = post.user.display_name || post.user.username;
  const initial = getInitial(displayName);

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      {/* Back button */}
      <Link
        href="/feed"
        className="inline-flex items-center gap-2 text-gray hover:text-dark mb-6 transition-colors"
      >
        <ArrowLeft className="size-4" />
        <span className="text-sm">Back to feed</span>
      </Link>

      {/* Post */}
      <article className="card-brutal p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <Link href={`/u/${post.user.username}`}>
            {post.user.avatar_url ? (
              <div className="w-12 h-12 rounded-full overflow-hidden border border-dark">
                <Image
                  src={post.user.avatar_url}
                  alt={post.user.username}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-dark text-light flex items-center justify-center font-display font-bold text-lg border border-dark">
                {initial}
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              href={`/u/${post.user.username}`}
              className="font-display font-semibold text-lg text-dark hover:text-accent transition-colors block"
            >
              {displayName}
            </Link>
            <span className="type-mono-look text-gray text-sm">
              {formatDistanceToNow(post.created_at)}
            </span>
          </div>
        </div>

        {/* Description */}
        {post.description && (
          <p className="text-dark mb-4">{post.description}</p>
        )}

        {/* Usage Stats */}
        <div className="flex items-center gap-4 text-sm mb-4">
          <span className="metric-price font-semibold text-lg">
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

        {/* Models */}
        {post.usage.models && post.usage.models.length > 0 && (
          <div className="code-snippet mb-4">
            &gt; Models: {post.usage.models.join(', ')}
          </div>
        )}

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className="grid gap-2 grid-cols-2 mb-4">
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
        <div className="flex items-center gap-4 pt-4 border-t border-dark">
          <LikeButton
            postId={post.id}
            initialLiked={isLiked}
            initialCount={post.like_count}
          />
          <span className="text-gray text-sm">
            {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
          </span>
        </div>
      </article>

      {/* Comments Section */}
      <div className="mt-6">
        <h2 className="font-display font-semibold text-lg mb-4">Comments</h2>
        <CommentSection postId={post.id} currentUserId={currentUserId || undefined} />
      </div>
    </div>
  );
}
