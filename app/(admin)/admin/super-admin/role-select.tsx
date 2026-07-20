"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole } from "@/actions/users";
import type { UserRole } from "@/types";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "enrollee", label: "Enrollee" },
  { value: "volunteer", label: "Volunteer" },
  { value: "admin", label: "Admin" },
  { value: "earc_staff", label: "EARC Staff" },
  { value: "super_admin", label: "Super Admin" },
];

export function RoleSelect({ clerkId, role }: { clerkId: string; role: UserRole | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleChange(value: string) {
    setLoading(true);
    try {
      await updateUserRole(clerkId, value as UserRole);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={role ?? "enrollee"}
      disabled={loading}
      onChange={(e) => handleChange(e.target.value)}
      style={{
        fontSize: 12, fontWeight: 600, padding: "8px 10px", borderRadius: 6,
        border: "1.5px solid #E4DFD1", color: "#19140F", background: "white",
        cursor: loading ? "not-allowed" : "pointer",
      }}
    >
      {ROLE_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
