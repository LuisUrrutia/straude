/**
 * Resolve a username conflict by enforcing a canonical Clerk username
 * and merging any Supabase user row that currently owns the target username.
 *
 * Usage:
 *   CLERK_SECRET_KEY=... \
 *   SUPABASE_URL=... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   PRIMARY_USERNAME=ohong \
 *   ALIAS_USERNAME=oscar \
 *   PRIMARY_CLERK_USER_ID=clerk_user_id_optional \
 *   APPLY=true \
 *   bun run scripts/resolve-username-conflict.ts
 */

import { createClient } from '@supabase/supabase-js';

const {
  CLERK_SECRET_KEY,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  PRIMARY_USERNAME,
  ALIAS_USERNAME,
  PRIMARY_CLERK_USER_ID,
  APPLY,
} = process.env;

if (!CLERK_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !PRIMARY_USERNAME) {
  console.error('Missing required environment variables.');
  process.exit(1);
}

const applyChanges = APPLY === 'true';
const targetUsername = PRIMARY_USERNAME.toLowerCase();
const aliasUsername = ALIAS_USERNAME?.toLowerCase() || null;

async function fetchClerkUsers(query: string) {
  const url = `https://api.clerk.com/v1/users?query=${encodeURIComponent(query)}&limit=10`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Clerk list users failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<Array<{ id: string; username: string | null }>>;
}

async function updateClerkUsername(userId: string, username: string) {
  const res = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Clerk update user failed: ${res.status} ${text}`);
  }
}

async function main() {
  console.log(`Target username: @${targetUsername}`);
  if (aliasUsername) {
    console.log(`Alias username: @${aliasUsername}`);
  }

  const [targetMatches, aliasMatches] = await Promise.all([
    fetchClerkUsers(targetUsername),
    aliasUsername ? fetchClerkUsers(aliasUsername) : Promise.resolve([]),
  ]);

  const findExact = (users: Array<{ id: string; username: string | null }>, username: string) =>
    users.find((user) => user.username?.toLowerCase() === username);

  const targetUser = findExact(targetMatches, targetUsername);
  const aliasUser = aliasUsername ? findExact(aliasMatches, aliasUsername) : null;

  const primaryClerkUserId = PRIMARY_CLERK_USER_ID || targetUser?.id || aliasUser?.id;

  if (!primaryClerkUserId) {
    throw new Error('Unable to determine primary Clerk user ID. Provide PRIMARY_CLERK_USER_ID.');
  }

  console.log(`Primary Clerk user ID: ${primaryClerkUserId}`);

  if (applyChanges) {
    console.log(`Updating Clerk username -> @${targetUsername}`);
    await updateClerkUsername(primaryClerkUserId, targetUsername);
  } else {
    console.log('[Dry run] Skipping Clerk username update.');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: primaryUser, error: primaryError } = await supabase
    .from('users')
    .select('id, username, clerk_id')
    .eq('clerk_id', primaryClerkUserId)
    .maybeSingle();

  if (primaryError || !primaryUser) {
    throw new Error('Primary Supabase user not found for this Clerk user ID.');
  }

  const { data: conflictUser } = await supabase
    .from('users')
    .select('id, username, clerk_id')
    .eq('username', targetUsername)
    .neq('id', primaryUser.id)
    .maybeSingle();

  if (conflictUser) {
    console.log(`Found conflicting Supabase user ${conflictUser.id} (@${conflictUser.username}).`);
    if (applyChanges) {
      await mergeUsers(supabase, conflictUser.id, primaryUser.id);
    } else {
      console.log('[Dry run] Skipping merge.');
    }
  }

  if (applyChanges) {
    const { error: updateError } = await supabase
      .from('users')
      .update({ username: targetUsername } as never)
      .eq('id', primaryUser.id);
    if (updateError) {
      throw updateError;
    }
  }

  console.log('Done.');
}

async function mergeUsers(
  supabase: ReturnType<typeof createClient>,
  sourceUserId: string,
  targetUserId: string
) {
  console.log(`Merging user ${sourceUserId} -> ${targetUserId}`);

  // daily_usage: delete duplicate dates before reassignment
  const { data: targetUsageDates, error: targetUsageError } = await supabase
    .from('daily_usage')
    .select('date')
    .eq('user_id', targetUserId);
  if (targetUsageError) throw targetUsageError;

  const targetDates = (targetUsageDates || []).map((row) => row.date);
  if (targetDates.length > 0) {
    const { error: deleteUsageError } = await supabase
      .from('daily_usage')
      .delete()
      .eq('user_id', sourceUserId)
      .in('date', targetDates);
    if (deleteUsageError) throw deleteUsageError;
  }

  const { error: updateUsageError } = await supabase
    .from('daily_usage')
    .update({ user_id: targetUserId } as never)
    .eq('user_id', sourceUserId);
  if (updateUsageError) throw updateUsageError;

  // posts
  const { error: postsError } = await supabase
    .from('posts')
    .update({ user_id: targetUserId } as never)
    .eq('user_id', sourceUserId);
  if (postsError) throw postsError;

  // follows (as follower)
  const { data: targetFollowing, error: targetFollowingError } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', targetUserId);
  if (targetFollowingError) throw targetFollowingError;

  const targetFollowingIds = (targetFollowing || []).map((row) => row.following_id);
  if (targetFollowingIds.length > 0) {
    const { error: deleteFollowsError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', sourceUserId)
      .in('following_id', targetFollowingIds);
    if (deleteFollowsError) throw deleteFollowsError;
  }

  const { error: updateFollowsError } = await supabase
    .from('follows')
    .update({ follower_id: targetUserId } as never)
    .eq('follower_id', sourceUserId);
  if (updateFollowsError) throw updateFollowsError;

  // follows (as following)
  const { data: targetFollowers, error: targetFollowersError } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', targetUserId);
  if (targetFollowersError) throw targetFollowersError;

  const targetFollowerIds = (targetFollowers || []).map((row) => row.follower_id);
  if (targetFollowerIds.length > 0) {
    const { error: deleteFollowersError } = await supabase
      .from('follows')
      .delete()
      .eq('following_id', sourceUserId)
      .in('follower_id', targetFollowerIds);
    if (deleteFollowersError) throw deleteFollowersError;
  }

  const { error: updateFollowersError } = await supabase
    .from('follows')
    .update({ following_id: targetUserId } as never)
    .eq('following_id', sourceUserId);
  if (updateFollowersError) throw updateFollowersError;

  // likes
  const { data: targetLikes, error: targetLikesError } = await supabase
    .from('likes')
    .select('post_id')
    .eq('user_id', targetUserId);
  if (targetLikesError) throw targetLikesError;

  const targetLikePostIds = (targetLikes || []).map((row) => row.post_id);
  if (targetLikePostIds.length > 0) {
    const { error: deleteLikesError } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', sourceUserId)
      .in('post_id', targetLikePostIds);
    if (deleteLikesError) throw deleteLikesError;
  }

  const { error: updateLikesError } = await supabase
    .from('likes')
    .update({ user_id: targetUserId } as never)
    .eq('user_id', sourceUserId);
  if (updateLikesError) throw updateLikesError;

  // comments
  const { error: commentsError } = await supabase
    .from('comments')
    .update({ user_id: targetUserId } as never)
    .eq('user_id', sourceUserId);
  if (commentsError) throw commentsError;

  // cli auth codes
  const { error: cliAuthError } = await supabase
    .from('cli_auth_codes')
    .update({ user_id: targetUserId } as never)
    .eq('user_id', sourceUserId);
  if (cliAuthError) throw cliAuthError;

  // delete source user
  const { error: deleteUserError } = await supabase
    .from('users')
    .delete()
    .eq('id', sourceUserId);
  if (deleteUserError) throw deleteUserError;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
