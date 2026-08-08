"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteIdCard } from "@/actions/id-cards";
import { Button } from "@/components/ui/button";

export function DeleteIdCardButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this ID card?")) return;
    setLoading(true);
    try {
      await deleteIdCard(id);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading} className="shrink-0">
      {loading ? "..." : "Delete"}
    </Button>
  );
}
