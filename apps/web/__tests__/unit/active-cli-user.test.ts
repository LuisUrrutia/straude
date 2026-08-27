import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserById = vi.fn();

vi.mock("@/lib/supabase/service", () => ({
  getServiceClient: vi.fn(() => ({
    auth: { admin: { getUserById } },
  })),
}));

import { isActiveCliUser } from "@/lib/api/active-cli-user";

describe("isActiveCliUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts an existing user without an active ban", async () => {
    getUserById.mockResolvedValue({
      data: { user: { id: "user-1", banned_until: null } },
      error: null,
    });

    expect(await isActiveCliUser("user-1")).toBe(true);
  });

  it("rejects a deleted user", async () => {
    getUserById.mockResolvedValue({
      data: { user: null },
      error: { message: "User not found" },
    });

    expect(await isActiveCliUser("deleted-user")).toBe(false);
  });

  it("rejects a user whose ban is still active", async () => {
    getUserById.mockResolvedValue({
      data: { user: { id: "user-1", banned_until: "2999-01-01T00:00:00Z" } },
      error: null,
    });

    expect(await isActiveCliUser("user-1")).toBe(false);
  });

  it("fails closed when the identity provider returns an invalid ban date", async () => {
    getUserById.mockResolvedValue({
      data: { user: { id: "user-1", banned_until: "invalid" } },
      error: null,
    });

    expect(await isActiveCliUser("user-1")).toBe(false);
  });
});
