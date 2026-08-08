"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertKitAssignment, markKitDistributed } from "@/actions/kits";

const inputStyle: React.CSSProperties = {
  padding: "6px 10px", fontSize: 13,
  border: "1.5px solid var(--border)", borderRadius: 6, outline: "none",
  background: "var(--background)", color: "var(--foreground)", boxSizing: "border-box",
};

export function KitAssignmentActions({
  groupId, schoolCount, packed, distributed,
}: { groupId: string; schoolCount: number; packed: boolean; distributed: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(schoolCount);

  async function togglePacked() {
    setLoading(true);
    try {
      await upsertKitAssignment({ group_id: groupId, school_count: count, packed: !packed, distributed });
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setLoading(false);
    }
  }

  async function saveCount() {
    setLoading(true);
    try {
      await upsertKitAssignment({ group_id: groupId, school_count: count, packed, distributed });
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setLoading(false);
    }
  }

  async function handleDistribute() {
    setLoading(true);
    try {
      await markKitDistributed(groupId);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to mark distributed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        type="number" min={1} placeholder="Enter count" value={count}
        onChange={e => setCount(Number(e.target.value))}
        onBlur={saveCount}
        style={{ ...inputStyle, width: 64 }}
        disabled={loading}
      />
      <button
        onClick={togglePacked}
        disabled={loading}
        style={{
          fontSize: 12, fontWeight: 600, padding: "9px 14px", minHeight: 38, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: packed ? "var(--gs-success)" : "transparent",
          color: packed ? "white" : "var(--gs-text-secondary)",
          border: packed ? "none" : "1.5px solid var(--border)",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {packed ? "Packed" : "Mark Packed"}
      </button>
      {distributed ? (
        <span style={{ fontSize: 12, fontWeight: 600, padding: "9px 14px", minHeight: 38, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(var(--gs-accent-rgb), 0.08)", color: "var(--gs-accent)" }}>
          Distributed
        </span>
      ) : packed ? (
        <button
          onClick={handleDistribute}
          disabled={loading}
          style={{ fontSize: 12, fontWeight: 600, padding: "9px 14px", minHeight: 38, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--gs-accent)", color: "white", border: "none", cursor: loading ? "not-allowed" : "pointer" }}
        >
          Mark Distributed
        </button>
      ) : null}
    </div>
  );
}
