"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole } from "@/actions/users";
import type { UserRole } from "@/types";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "earc_staff", label: "EARC Staff" },
];

export function RoleSelect({ clerkId, role }: { clerkId: string; role: UserRole | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleChange(value: string) {
    setLoading(true);
    setStatus(null);
    try {
      await updateUserRole(clerkId, value as UserRole);
      setStatus({ type: "success", text: "Role updated" });
      router.refresh();
    } catch (err: unknown) {
      setStatus({ type: "error", text: err instanceof Error ? err.message : "Failed to update role" });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(null), 3000);
    }
  }

  return (
    <div className="flex items-center gap-2">
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

      {loading && (
        <span style={{ fontSize: 12, color: "#9B9188" }}>Updating role&hellip;</span>
      )}
      {!loading && status && (
        <span style={{ fontSize: 12, fontWeight: 600, color: status.type === "success" ? "#2A5E3A" : "#B8381E" }}>
          {status.text}
        </span>
      )}
    </div>
  );
}
