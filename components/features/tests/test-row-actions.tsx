"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateTestStatus } from "@/actions/tests";
import { DeleteTestButton } from "./delete-test-button";
import { Button } from "@/components/ui/button";

export function TestRowActions({ testId, status }: { testId: string; status: "draft" | "active" | "closed" }) {
  const router = useRouter();
  const [toggling, setToggling] = useState(false);

  async function handleToggle() {
    const next = status === "active" ? "closed" : "active";
    setToggling(true);
    try {
      await updateTestStatus(testId, next);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        disabled={toggling}
        style={{
          borderColor: status === "active" ? "rgba(var(--gs-danger-alt-rgb), 0.28)" : "rgba(var(--gs-success-rgb), 0.28)",
          color: status === "active" ? "var(--gs-danger-alt)" : "var(--gs-success)",
        }}
      >
        {toggling ? "..." : status === "active" ? "Disable" : "Enable"}
      </Button>
      <Link href={`/admin/tests/${testId}/edit`}>
        <Button variant="outline" size="sm" style={{ borderColor: "rgba(var(--gs-accent-rgb), 0.28)", color: "var(--gs-accent)" }}>
          Edit
        </Button>
      </Link>
      <DeleteTestButton testId={testId} />
    </div>
  );
}
