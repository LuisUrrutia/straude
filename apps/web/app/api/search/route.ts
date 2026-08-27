import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Safe public fields only — never expose email, private settings, etc.
const PUBLIC_USER_FIELDS = "id, username, display_name, bio, avatar_url, is_public";

/** Keep user-visible search text while removing PostgREST/ILIKE metacharacters. */
function sanitizeFilter(s: string): string {
  return s.normalize("NFKC").replace(/[^\p{L}\p{N}\s-]/gu, "").trim();
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const q = request.nextUrl.searchParams.get("q") ?? "";
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 50)
    : 20;

  if (q.length < 2 || q.length > 64) {
    return NextResponse.json(
      { error: "Query must be between 2 and 64 characters" },
      { status: 400 }
    );
  }

  const safe = sanitizeFilter(q);
  if (safe.length < 2) {
    return NextResponse.json(
      { error: "Query must contain at least 2 searchable characters" },
      { status: 400 },
    );
  }

  // Search by username, display name, or github_username
  const { data: users, error } = await supabase
    .from("users")
    .select(PUBLIC_USER_FIELDS)
    .eq("is_public", true)
    .or(`username.ilike.%${safe}%,display_name.ilike.%${safe}%,github_username.ilike.%${safe}%`)
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: users ?? [] });
}
