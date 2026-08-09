"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadExpenseReceipt } from "./receipt";
import type { Expense } from "@/types";

export function ReceiptButton({ expense }: { expense: Expense & { group?: { name: string } | null; submitter?: { name: string } | null } }) {
  return (
    <Button
      variant="link"
      size="xs"
      onClick={() => downloadExpenseReceipt(expense)}
      className="gap-1 p-0 h-auto text-[var(--gs-success)]"
    >
      <Download size={12} /> Download receipt
    </Button>
  );
}
