"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateUserRole, deleteUser, syncDeletedUsers } from "@/actions/users";
import type { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "volunteer", label: "Volunteer" },
  { value: "enrollee", label: "Enrollee" },
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
      const message = err instanceof Error ? err.message : "Failed to update role";
      setStatus({ type: "error", text: message });
      toast.error(message);
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(null), 3000);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={role ?? "enrollee"}
        disabled={loading}
        onValueChange={(v) => handleChange(v ?? "enrollee")}
      >
        <SelectTrigger size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {loading && (
        <span style={{ fontSize: 12, color: "var(--gs-muted)" }}>Updating role&hellip;</span>
      )}
      {!loading && status && (
        <span style={{ fontSize: 12, fontWeight: 600, color: status.type === "success" ? "var(--gs-success)" : "var(--gs-danger-alt)" }}>
          {status.text}
        </span>
      )}
    </div>
  );
}

export function DeleteUserButton({ clerkId, name }: { clerkId: string; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm(`Delete ${name}? This removes them from Clerk and Supabase and cannot be undone.`)) return;
    setLoading(true);
    setError(null);
    try {
      await deleteUser(clerkId);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete user";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleDelete} disabled={loading} variant="destructive" size="sm">
        {loading ? "Deleting…" : "Delete"}
      </Button>
      {error && <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gs-danger-alt)" }}>{error}</span>}
    </div>
  );
}

export function SyncDeletedUsersButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSync() {
    if (!confirm("Check Clerk for users that no longer exist and remove their leftover Supabase records? This cannot be undone.")) return;
    setLoading(true);
    setResult(null);
    try {
      const { removed, names } = await syncDeletedUsers();
      setResult({
        type: "success",
        text: removed === 0 ? "No orphaned users found." : `Removed ${removed}: ${names.join(", ")}`,
      });
      router.refresh();
    } catch (err: unknown) {
      setResult({ type: "error", text: err instanceof Error ? err.message : "Sync failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button onClick={handleSync} disabled={loading} variant="outline" size="sm">
        {loading ? "Checking Clerk…" : "Sync Deleted Users"}
      </Button>
      {result && (
        <span style={{ fontSize: 12, fontWeight: 600, color: result.type === "success" ? "var(--gs-success)" : "var(--gs-danger-alt)" }}>
          {result.text}
        </span>
      )}
    </div>
  );
}
