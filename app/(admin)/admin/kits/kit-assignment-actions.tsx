"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertKitAssignment, markKitDistributed } from "@/actions/kits";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
      <Input
        type="number" min={1} placeholder="Count" value={count}
        onChange={e => setCount(Number(e.target.value))}
        onBlur={saveCount}
        className="w-16 text-xs h-9"
        disabled={loading}
      />
      <Button
        size="sm"
        variant={packed ? "default" : "outline"}
        onClick={togglePacked}
        disabled={loading}
        className={packed ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
      >
        {packed ? "Packed" : "Mark Packed"}
      </Button>
      {distributed ? (
        <Badge variant="secondary" className="h-9 px-3 text-xs font-semibold">
          Distributed
        </Badge>
      ) : packed ? (
        <Button
          size="sm"
          onClick={handleDistribute}
          disabled={loading}
        >
          Mark Distributed
        </Button>
      ) : null}
    </div>
  );
}
