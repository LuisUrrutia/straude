import { getServiceClient } from "@/lib/supabase/service";

export async function isActiveCliUser(userId: string): Promise<boolean> {
  try {
    const { data, error } = await getServiceClient().auth.admin.getUserById(userId);
    if (error || !data.user) return false;

    const bannedUntil = data.user.banned_until;
    if (!bannedUntil) return true;

    const bannedUntilMs = Date.parse(bannedUntil);
    return Number.isFinite(bannedUntilMs) && bannedUntilMs <= Date.now();
  } catch {
    return false;
  }
}
