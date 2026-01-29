import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PostList } from '@/components/feed/post-list';
import { TabStrip } from '@/components/feed/tab-strip';
import type { PostWithDetails } from '@/types';

export const metadata = {
  title: 'Feed | Straude',
};

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

async function getFeed() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const supabase = await createClient();

  // Get user from clerk_id
  const { data: currentUserData } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (!currentUserData) {
    redirect('/onboarding');
  }

  const currentUserId = (currentUserData as { id: string }).id;

  // Get users the current user follows
  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', currentUserId);

  const followingIds = (following as Array<{ following_id: string }> | null)?.map((f) => f.following_id) || [];
  followingIds.push(currentUserId); // Include own posts

  // Get posts
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      user:users(id, username, display_name, avatar_url),
      usage:daily_usage(cost_usd, total_tokens, is_verified, models)
    `)
    .in('user_id', followingIds)
    .order('created_at', { ascending: false })
    .limit(21);

  const typedPosts = posts as PostRow[] | null;

  if (!typedPosts) {
    return { posts: [], nextCursor: null, postCount: 0 };
  }

  const hasMore = typedPosts.length > 20;
  const postsToReturn = hasMore ? typedPosts.slice(0, 20) : typedPosts;
  const nextCursor = hasMore ? postsToReturn[postsToReturn.length - 1].created_at : null;

  // Get counts
  const postsWithCounts: PostWithDetails[] = await Promise.all(
    postsToReturn.map(async (post) => {
      const [likesResult, commentsResult, likedResult] = await Promise.all([
        supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase.from('likes').select('id').eq('post_id', post.id).eq('user_id', currentUserId).maybeSingle(),
      ]);

      return {
        ...post,
        like_count: likesResult.count || 0,
        comment_count: commentsResult.count || 0,
        is_liked: !!likedResult.data,
      } as PostWithDetails;
    })
  );

  return { posts: postsWithCounts, nextCursor, postCount: postsWithCounts.length };
}

export default async function FeedPage() {
  const { posts, nextCursor, postCount } = await getFeed();

  return (
    <div className="flex flex-col h-full">
      {/* Mobile Tab Strip */}
      <TabStrip postCount={postCount} />

      {/* Desktop Actions Bar */}
      <div className="hidden md:flex actions-bar">
        <Link
          href="/settings/import"
          className="action-btn primary"
        >
          <span>+ Import ccusage</span>
        </Link>
        <button className="action-btn">
          Filter View
        </button>
        <div className="flex-1" />
        <button className="action-btn border-l border-dark border-r-0">
          Export CSV
        </button>
      </div>

      {/* Desktop Import Area */}
      <div className="hidden md:flex import-area">
        <Link href="/settings/import" className="import-box type-display-condensed">
          Drag .json stats here
          <div className="text-sm mt-2 font-body normal-case font-normal">
            or click to browse local files
          </div>
        </Link>
      </div>

      {/* Feed Content */}
      <div className="flex-1 overflow-auto">
        {posts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="card-brutal inline-block p-8">
              <h2 className="type-display-condensed text-xl mb-4">No Posts Yet</h2>
              <p className="text-gray mb-6">
                Import your first ccusage data to get started!
              </p>
              <Link
                href="/settings/import"
                className="pill-btn inline-flex"
              >
                Import Now
              </Link>
            </div>
          </div>
        ) : (
          <PostList initialPosts={posts} initialCursor={nextCursor} />
        )}
      </div>

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-20 right-4 z-20">
        <Link href="/settings/import" className="pill-btn">
          <span>Import Stats</span>
          <span>+</span>
        </Link>
      </div>
    </div>
  );
}
