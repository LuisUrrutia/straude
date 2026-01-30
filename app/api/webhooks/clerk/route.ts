import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env');
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400,
    });
  }

  const supabase = createAdminClient();

  // Handle the webhook
  switch (evt.type) {
    case 'user.created': {
      const { id, image_url, external_accounts } = evt.data;

      // Extract GitHub username if they signed up with GitHub
      const githubAccount = external_accounts?.find(
        (acc) => acc.provider === 'oauth_github'
      );
      const githubUsername = githubAccount?.username || null;
      const username = evt.data.username?.toLowerCase() || `user_${id.slice(-8)}`;

      // For new users, we just store the clerk_id
      // The rest of the profile is completed during onboarding
      // We create a placeholder user that will be updated during onboarding
      const { error } = await supabase.from('users').insert({
        clerk_id: id,
        // Generate temporary username from email or random
        username,
        avatar_url: image_url,
        github_username: githubUsername,
        // These will be set during onboarding
        country: 'US',
        region: 'north_america',
        timezone: 'America/New_York',
        onboarding_completed: false,
      } as never);

      if (error) {
        console.error('Error creating user:', error);
        return new Response('Error creating user', { status: 500 });
      }

      break;
    }

    case 'user.updated': {
      const { id, image_url } = evt.data;
      const username = evt.data.username?.toLowerCase();

      // Only update avatar if changed
      const { error } = await supabase
        .from('users')
        .update(
          {
            avatar_url: image_url,
            ...(username ? { username } : {}),
          } as never
        )
        .eq('clerk_id', id);

      if (error) {
        console.error('Error updating user:', error);
        return new Response('Error updating user', { status: 500 });
      }

      break;
    }

    case 'user.deleted': {
      const { id } = evt.data;

      if (!id) {
        return new Response('No user id provided', { status: 400 });
      }

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('clerk_id', id);

      if (error) {
        console.error('Error deleting user:', error);
        return new Response('Error deleting user', { status: 500 });
      }

      break;
    }
  }

  return new Response('', { status: 200 });
}
