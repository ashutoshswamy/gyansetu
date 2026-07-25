"use client";

import { useState } from "react";
import { ExpenseForm } from "./expense-form";
import type { Expense } from "@/types";

const categoryLabels: Record<string, string> = {
  travel: "Travel & Transportation",
  accommodation: "Accommodation",
  food: "Food & Refreshments",
  materials: "Program Materials & Printing",
  miscellaneous: "Miscellaneous",
};

const categoryColors: Record<string, { color: string; bg: string }> = {
  travel:        { color: "#4A55BE", bg: "rgba(74,85,190,0.08)" },
  accommodation: { color: "#6B21A8", bg: "rgba(107,33,168,0.08)" },
  food:          { color: "#F5A520", bg: "rgba(245,165,32,0.08)" },
  materials:     { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
  miscellaneous: { color: "#5A5247", bg: "rgba(90,82,71,0.08)" },
};

const statusColors: Record<string, { color: string; bg: string }> = {
  pending:    { color: "#F5A520", bg: "rgba(245,165,32,0.08)" },
  approved:   { color: "#2A5E3A", bg: "rgba(42,94,58,0.08)" },
  rejected:   { color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
  sent_back:  { color: "#B8381E", bg: "rgba(184,56,30,0.08)" },
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
    <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 12, padding: "16px 20px" }}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: cat.color, background: cat.bg }}>
              {categoryLabels[expense.category] ?? expense.category}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: st.color, background: st.bg, textTransform: "capitalize" }}>
              {statusLabels[expense.status] ?? expense.status}
            </span>
          </div>
          <p style={{ fontSize: 12, color: "#9B9188", margin: "0 0 4px" }}>
            {expense.group?.name ?? "No group"} · {new Date(expense.expense_date).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
            {expense.subcategory ? ` · ${expense.subcategory}` : ""}
            {expense.volunteer_count ? ` · ${expense.volunteer_count} volunteer${expense.volunteer_count !== 1 ? "s" : ""}` : ""}
            {expense.vendor_name ? ` · ${expense.vendor_name}` : ""}
          </p>
          {expense.description && <p style={{ fontSize: 13, color: "#5A5247", margin: "4px 0" }}>{expense.description}</p>}
          {expense.bill_url && (
            <a href={expense.bill_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#4A55BE", display: "inline-block", marginTop: 2 }}>
              View bill
            </a>
          )}
          {expense.status === "rejected" && expense.rejection_reason && (
            <p style={{ fontSize: 12, color: "#DC2626", margin: "6px 0 0" }}>Rejected: {expense.rejection_reason}</p>
          )}
          {expense.status === "sent_back" && (
            <div style={{ marginTop: 8 }}>
              {expense.rejection_reason && (
                <p style={{ fontSize: 12, color: "#B8381E", margin: "0 0 8px" }}>Needs revision: {expense.rejection_reason}</p>
              )}
              <button
                onClick={() => setEditing(true)}
                style={{ fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 6, background: "#B8381E", color: "white", border: "none", cursor: "pointer" }}
              >
                Fix & Resubmit
              </button>
            </div>
          )}
        </div>
        <p style={{ fontSize: 17, fontWeight: 700, color: "#19140F", margin: 0, flexShrink: 0 }}>₹{Number(expense.amount).toLocaleString("en-IN")}</p>
      </div>
    </div>
  );
}
