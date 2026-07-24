"use client";

import { Download } from "lucide-react";
import { downloadExpenseReceipt } from "./receipt";
import type { Expense } from "@/types";

export function ReceiptButton({ expense }: { expense: Expense & { group?: { name: string } | null; submitter?: { name: string } | null } }) {
  return (
    <button
      onClick={() => downloadExpenseReceipt(expense)}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#2A5E3A", background: "none", border: "none", padding: 0, cursor: "pointer" }}
    >
      <Download size={12} /> Download receipt
    </button>
  );
}
