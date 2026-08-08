"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteLocalHost } from "@/actions/local-hosts";

export function DeleteHostButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this local host?")) return;
    setLoading(true);
    try {
      await deleteLocalHost(id);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      style={{
        fontSize: 12, fontWeight: 600, padding: "9px 14px", minHeight: 38, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: "transparent", color: "var(--gs-danger-alt)",
        border: "1.5px solid rgba(var(--gs-danger-alt-rgb), 0.3)",
        cursor: loading ? "not-allowed" : "pointer", flexShrink: 0,
      }}
    >
      {loading ? "..." : "Delete"}
    </button>
  );
}
