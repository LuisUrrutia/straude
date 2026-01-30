import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { ProfileHeader } from '@/components/profile/profile-header';
import { ContributionGraph } from '@/components/profile/contribution-graph';
import { PostList } from '@/components/feed/post-list';
import { TabStrip } from '@/components/feed/tab-strip';
import type { UserProfileResponse, PostWithDetails } from '@/types';

interface PageProps {
  params: Promise<{ username: string }>;
}

interface UserRow {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  country: string;
  region: string;
  link: string | null;
  github_username: string | null;
  is_public: boolean;
  created_at: string;
}

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

async function getProfile(username: string): Promise<UserProfileResponse | null> {
  const supabase = await createClient();
  const { userId } = await auth();

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  const user = userData as UserRow | null;
  if (!user) return null;

  let isOwnProfile = false;
  let isFollowing = false;

  if (userId) {
    const { data: currentUserData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    const currentUser = currentUserData as { id: string } | null;

    if (currentUser) {
      isOwnProfile = currentUser.id === user.id;

      if (!isOwnProfile) {
        const { data: follow } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', currentUser.id)
          .eq('following_id', user.id)
          .maybeSingle();
        isFollowing = !!follow;
      }
    }
  }

  const canViewStats = user.is_public || isOwnProfile || isFollowing;

  const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
  ]);

  let totalSpent: number | null = null;
  let streak: number | null = null;

  if (canViewStats) {
    const [{ data: allTimeUsage }, { data: usageDates }] = await Promise.all([
      supabase.from('daily_usage').select('cost_usd').eq('user_id', user.id),
      supabase.from('daily_usage').select('date').eq('user_id', user.id).order('date', { ascending: false }),
    ]);

    const usageData = allTimeUsage as Array<{ cost_usd: number }> | null;
    totalSpent = usageData?.reduce((sum, u) => sum + Number(u.cost_usd), 0) || 0;

    const dates = (usageDates as Array<{ date: string }> | null)?.map(d => d.date) || [];
    let streakCount = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dates.length > 0 && (dates[0] === today || dates[0] === yesterday)) {
      streakCount = 1;
      for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i - 1]);
        const curr = new Date(dates[i]);
        const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
        if (diffDays === 1) {
          streakCount++;
        } else {
          break;
        }
      }
    }
    streak = streakCount;
  }

  return {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    bio: user.bio,
    avatar_url: user.avatar_url,
    country: user.country,
    region: user.region,
    link: user.link,
    github_username: user.github_username,
    is_public: user.is_public,
    created_at: user.created_at,
    stats: {
      global_rank: null, // Simplified for now
      regional_rank: null,
      current_streak: streak,
      total_spent: totalSpent,
      followers_count: followersCount || 0,
      following_count: followingCount || 0,
    },
    stats_visible: canViewStats,
    is_following: isFollowing,
    is_own_profile: isOwnProfile,
  };
}

async function getContributions(userId: string, canViewStats: boolean) {
  if (!canViewStats) {
    return [];
  }
  const supabase = await createClient();
  const yearAgo = new Date();
  yearAgo.setDate(yearAgo.getDate() - 365);

  const { data } = await supabase
    .from('daily_usage')
    .select('date, cost_usd')
    .eq('user_id', userId)
    .gte('date', yearAgo.toISOString().split('T')[0]);

  const typedData = data as Array<{ date: string; cost_usd: number }> | null;
  return typedData?.map((u) => ({ date: u.date, cost_usd: Number(u.cost_usd) })) || [];
}

async function getPosts(
  userId: string
): Promise<{ posts: PostWithDetails[]; currentUserId: string | null }> {
  const supabase = await createClient();
  const { userId: clerkId } = await auth();

  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      user:users(id, username, display_name, avatar_url),
      usage:daily_usage(cost_usd, total_tokens, is_verified, models)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!posts) return { posts: [], currentUserId: null };

  const typedPosts = posts as PostRow[];

  let currentUserId: string | null = null;
  if (clerkId) {
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single();
    currentUserId = (currentUser as { id: string } | null)?.id || null;
  }

  const postsWithCounts = await Promise.all(
    typedPosts.map(async (post) => {
      const [{ count: likeCount }, { count: commentCount }, liked] = await Promise.all([
        supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
        currentUserId
          ? supabase.from('likes').select('id').eq('post_id', post.id).eq('user_id', currentUserId).maybeSingle()
          : { data: null },
      ]);

      return {
        ...post,
        like_count: likeCount || 0,
        comment_count: commentCount || 0,
        is_liked: !!liked.data,
      } as PostWithDetails;
    })
  );

  return { posts: postsWithCounts, currentUserId };
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  return {
    title: `@${username} | Straude`,
  };
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getProfile(username);
  const referenceDate = new Date().toISOString();

  if (!profile) {
    notFound();
  }

  const [contributions, postsResult] = await Promise.all([
    getContributions(profile.id, profile.stats_visible),
    getPosts(profile.id),
  ]);
  const { posts, currentUserId } = postsResult;

  return (
    <div className="flex flex-col h-full">
      {/* Mobile Tab Strip */}
      <TabStrip />

      <div className="max-w-3xl mx-auto space-y-6 p-4 md:p-6">
      <ProfileHeader user={profile} />

      {/* Contribution Graph */}
      <div className="panel-brutal p-6">
        <h2 className="type-display-condensed text-lg text-dark mb-4">
          Activity
        </h2>
        <ContributionGraph data={contributions} referenceDate={referenceDate} />
      </div>

      {/* Posts */}
      <div>
        <h2 className="type-display-condensed text-lg text-dark mb-4">
          Posts
        </h2>
        <PostList initialPosts={posts} currentUserId={currentUserId} />
      </div>
      </div>
    </div>
  );
}
