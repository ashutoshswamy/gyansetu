"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteKitItem } from "@/actions/kits";

export function DeleteKitItemButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this kit item?")) return;
    setLoading(true);
    try {
      await deleteKitItem(id);
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
        background: "transparent", color: "#B8381E",
        border: "1.5px solid rgba(184,56,30,0.3)",
        cursor: loading ? "not-allowed" : "pointer", flexShrink: 0,
      }}
    >
      {loading ? "..." : "Delete"}
    </button>
  );
}
