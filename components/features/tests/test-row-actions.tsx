"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateTestStatus } from "@/actions/tests";
import { DeleteTestButton } from "./delete-test-button";

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
      <button
        onClick={handleToggle}
        disabled={toggling}
        style={{
          fontSize: 12, fontWeight: 500, padding: "6px 14px", borderRadius: 5,
          border: `1.5px solid ${status === "active" ? "rgba(var(--gs-danger-alt-rgb), 0.28)" : "rgba(var(--gs-success-rgb), 0.28)"}`,
          background: "transparent", color: status === "active" ? "var(--gs-danger-alt)" : "var(--gs-success)",
          cursor: toggling ? "not-allowed" : "pointer",
        }}
      >
        {toggling ? "..." : status === "active" ? "Disable" : "Enable"}
      </button>
      <Link href={`/admin/tests/${testId}/edit`}>
        <button style={{ background: "transparent", color: "var(--gs-accent)", fontSize: 12, fontWeight: 500, padding: "6px 14px", borderRadius: 5, border: "1.5px solid rgba(var(--gs-accent-rgb), 0.28)", cursor: "pointer" }}>
          Edit
        </button>
      </Link>
      <DeleteTestButton testId={testId} />
    </div>
  );
}
