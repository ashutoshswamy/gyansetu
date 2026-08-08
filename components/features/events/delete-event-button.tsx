"use client";

import { useState } from "react";
import { deleteEvent } from "@/actions/events";
import { useRouter } from "next/navigation";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteEvent(eventId);
      router.refresh();
    } catch {
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
          style={{ fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 5, border: "none", background: "var(--gs-danger-alt)", color: "white", cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1 }}
        >
          {deleting ? "Deleting..." : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          style={{ fontSize: 12, padding: "6px 10px", borderRadius: 5, border: "1.5px solid var(--border)", background: "white", color: "var(--gs-text-secondary)", cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{ background: "transparent", color: "var(--gs-danger-alt)", fontSize: 13, fontWeight: 500, padding: "6px 14px", borderRadius: 5, border: "1.5px solid rgba(var(--gs-danger-alt-rgb), 0.28)", cursor: "pointer" }}
    >
      Delete
    </button>
  );
}
