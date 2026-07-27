"use client";

import { useState } from "react";
import { deleteGroup } from "@/actions/groups";
import { useRouter } from "next/navigation";

export function DeleteGroupButton({ groupId }: { groupId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteGroup(groupId);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete group");
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex gap-1">
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 5, border: "none", background: "#B8381E", color: "white", cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1 }}
        >
          {deleting ? "Deleting..." : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          style={{ fontSize: 12, padding: "5px 10px", borderRadius: 5, border: "1.5px solid #E4DFD1", background: "white", color: "#5A5247", cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{ background: "transparent", color: "#B8381E", fontSize: 12, fontWeight: 500, padding: "5px 12px", borderRadius: 5, border: "1.5px solid rgba(184,56,30,0.28)", cursor: "pointer" }}
    >
      Delete
    </button>
  );
}
