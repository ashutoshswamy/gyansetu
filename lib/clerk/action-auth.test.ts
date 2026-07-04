import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
  clerkClient: () => ({ users: { getUser: vi.fn() } }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => mockMaybeSingle(),
        }),
      }),
    }),
  }),
}));

import { requireAdminUser, requireVolunteerUser, requireEarcUser } from "./action-auth";

describe("role-gated action helpers", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockMaybeSingle.mockReset();
  });

  function mockSignedInAs(role: string | null) {
    mockAuth.mockResolvedValue({ userId: "user_123", sessionClaims: { metadata: { role } } });
    mockMaybeSingle.mockResolvedValue({ data: { id: "db-user-1", role }, error: null });
  }

  it("requireAdminUser allows an admin", async () => {
    mockSignedInAs("admin");
    const { user } = await requireAdminUser();
    expect(user.role).toBe("admin");
  });

  it("requireAdminUser rejects a volunteer", async () => {
    mockSignedInAs("volunteer");
    await expect(requireAdminUser()).rejects.toThrow("Unauthorized");
  });

  it("requireAdminUser rejects a signed-in user with no role", async () => {
    mockSignedInAs(null);
    await expect(requireAdminUser()).rejects.toThrow("Unauthorized");
  });

  it("requireAdminUser rejects when not signed in at all", async () => {
    mockAuth.mockResolvedValue({ userId: null, sessionClaims: null });
    await expect(requireAdminUser()).rejects.toThrow("Unauthorized");
  });

  it("requireVolunteerUser allows both volunteer and admin", async () => {
    mockSignedInAs("volunteer");
    await expect(requireVolunteerUser()).resolves.toBeTruthy();

    mockSignedInAs("admin");
    await expect(requireVolunteerUser()).resolves.toBeTruthy();
  });

  it("requireVolunteerUser rejects earc_staff", async () => {
    mockSignedInAs("earc_staff");
    await expect(requireVolunteerUser()).rejects.toThrow("Unauthorized");
  });

  it("requireEarcUser allows earc_staff and admin only", async () => {
    mockSignedInAs("earc_staff");
    await expect(requireEarcUser()).resolves.toBeTruthy();

    mockSignedInAs("volunteer");
    await expect(requireEarcUser()).rejects.toThrow("Unauthorized");
  });
});
