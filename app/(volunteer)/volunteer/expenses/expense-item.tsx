"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExpenseForm } from "./expense-form";
import type { Expense } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format-date";

const categoryLabels: Record<string, string> = {
  travel: "Travel & Transportation",
  accommodation: "Accommodation",
  food: "Food & Refreshments",
  materials: "Program Materials & Printing",
  miscellaneous: "Miscellaneous",
};

const categoryColors: Record<string, { color: string; bg: string }> = {
  travel:        { color: "var(--gs-accent)", bg: "rgba(var(--gs-accent-rgb), 0.08)" },
  accommodation: { color: "#6B21A8", bg: "rgba(107,33,168,0.08)" },
  food:          { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.08)" },
  materials:     { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)" },
  miscellaneous: { color: "var(--gs-text-secondary)", bg: "rgba(90,82,71,0.08)" },
};

const statusColors: Record<string, { color: string; bg: string }> = {
  pending:    { color: "var(--gs-warning)", bg: "rgba(var(--gs-warning-rgb), 0.08)" },
  approved:   { color: "var(--gs-success)", bg: "rgba(var(--gs-success-rgb), 0.08)" },
  rejected:   { color: "var(--gs-danger)", bg: "rgba(var(--gs-danger-rgb), 0.08)" },
  sent_back:  { color: "var(--gs-danger-alt)", bg: "rgba(var(--gs-danger-alt-rgb), 0.08)" },
};

const statusLabels: Record<string, string> = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
  sent_back: "sent back",
};

export function ExpenseItem({ expense }: { expense: Expense & { group?: { id: string; name: string } | null } }) {
  const [editing, setEditing] = useState(false);
  const cat = categoryColors[expense.category] ?? categoryColors.miscellaneous;
  const st = statusColors[expense.status] ?? statusColors.pending;

  if (editing) {
    return <ExpenseForm groupId={expense.group_id} editExpense={expense} onDone={() => setEditing(false)} />;
  }

  return (
    <Card>
<CardContent>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge style={{color: cat.color, background: cat.bg}}>
              {categoryLabels[expense.category] ?? expense.category}
            </Badge>
            <Badge style={{color: st.color, background: st.bg, textTransform: "capitalize"}}>
              {statusLabels[expense.status] ?? expense.status}
            </Badge>
          </div>
          <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: "0 0 4px" }}>
            {expense.group?.name ?? "No group"} · {formatDate(expense.expense_date)}
            {expense.subcategory ? ` · ${expense.subcategory}` : ""}
            {expense.volunteer_count ? ` · ${expense.volunteer_count} volunteer${expense.volunteer_count !== 1 ? "s" : ""}` : ""}
            {expense.vendor_name ? ` · ${expense.vendor_name}` : ""}
          </p>
          {expense.description && <p style={{ fontSize: 13, color: "var(--gs-text-secondary)", margin: "4px 0" }}>{expense.description}</p>}
          {expense.bill_url && (
            <a href={expense.bill_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--gs-accent)", display: "inline-block", marginTop: 2 }}>
              View bill
            </a>
          )}
          {expense.status === "rejected" && expense.rejection_reason && (
            <p style={{ fontSize: 12, color: "var(--gs-danger)", margin: "6px 0 0" }}>Rejected: {expense.rejection_reason}</p>
          )}
          {expense.status === "sent_back" && (
            <div style={{ marginTop: 8 }}>
              {expense.rejection_reason && (
                <p style={{ fontSize: 12, color: "var(--gs-danger-alt)", margin: "0 0 8px" }}>Needs revision: {expense.rejection_reason}</p>
              )}
              <Button
                onClick={() => setEditing(true)}
                variant="destructive"
                size="sm"
              >
                Fix & Resubmit
              </Button>
            </div>
          )}
        </div>
        <p style={{ fontSize: 17, fontWeight: 700, color: "var(--foreground)", margin: 0, flexShrink: 0 }}>₹{Number(expense.amount).toLocaleString("en-IN")}</p>
      </div>
    </CardContent>
</Card>
  );
}
