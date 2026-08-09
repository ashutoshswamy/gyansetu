"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteLocalHost } from "@/actions/local-hosts";
import { Button } from "@/components/ui/button";

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
    <Button
      onClick={handleDelete}
      disabled={loading}
      variant="destructive"
      size="sm"
      className="flex-shrink-0"
    >
      {loading ? "..." : "Delete"}
    </Button>
  );
}
