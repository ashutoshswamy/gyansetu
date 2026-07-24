import { jsPDF } from "jspdf";
import type { Expense } from "@/types";

type RGB = [number, number, number];

const CATEGORY_META: Record<Expense["category"], { title: string; accent: RGB; subLabel: string; icon: (doc: jsPDF, cx: number, cy: number) => void }> = {
  travel: {
    title: "Travel & Transportation",
    accent: [74, 85, 190],
    subLabel: "Mode of Transport",
    icon: (doc, cx, cy) => {
      // simplified train: body + two wheels
      doc.roundedRect(cx - 12, cy - 9, 24, 16, 3, 3, "S");
      doc.line(cx - 12, cy - 1, cx + 12, cy - 1);
      doc.circle(cx - 6, cy + 10, 3, "S");
      doc.circle(cx + 6, cy + 10, 3, "S");
    },
  },
  accommodation: {
    title: "Accommodation",
    accent: [107, 33, 168],
    subLabel: "Stay Type",
    icon: (doc, cx, cy) => {
      // simplified bed: frame + pillow
      doc.line(cx - 14, cy + 10, cx - 14, cy - 6);
      doc.line(cx - 14, cy - 6, cx + 14, cy - 6);
      doc.line(cx + 14, cy - 6, cx + 14, cy + 10);
      doc.roundedRect(cx - 11, cy - 4, 10, 6, 1, 1, "S");
      doc.line(cx - 14, cy + 10, cx + 14, cy + 10);
    },
  },
  food: {
    title: "Food & Refreshments",
    accent: [245, 165, 32],
    subLabel: "Meal",
    icon: (doc, cx, cy) => {
      // fork (left, 3 tines) + knife (right)
      doc.line(cx - 8, cy - 12, cx - 8, cy + 12);
      doc.line(cx - 11, cy - 12, cx - 11, cy - 4);
      doc.line(cx - 5, cy - 12, cx - 5, cy - 4);
      doc.line(cx - 11, cy - 4, cx - 5, cy - 4);
      doc.line(cx + 8, cy - 12, cx + 8, cy + 12);
      doc.line(cx + 5, cy - 12, cx + 8, cy - 4);
    },
  },
  materials: {
    title: "Program Materials & Printing",
    accent: [42, 94, 58],
    subLabel: "Items Purchased",
    icon: (doc, cx, cy) => {
      // simplified book: cover + spine line
      doc.roundedRect(cx - 13, cy - 11, 26, 22, 2, 2, "S");
      doc.line(cx, cy - 11, cx, cy + 11);
    },
  },
  miscellaneous: {
    title: "Miscellaneous",
    accent: [90, 82, 71],
    subLabel: "Purpose",
    icon: (doc, cx, cy) => {
      // asterisk: three crossing lines
      doc.line(cx, cy - 13, cx, cy + 13);
      doc.line(cx - 11, cy - 6, cx + 11, cy + 6);
      doc.line(cx - 11, cy + 6, cx + 11, cy - 6);
    },
  },
};

type ReceiptExpense = Expense & { group?: { name: string } | null; submitter?: { name: string } | null };

export function downloadExpenseReceipt(ex: ReceiptExpense) {
  const meta = CATEGORY_META[ex.category];
  const doc = new jsPDF({ unit: "pt", format: "a5" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = 46;

  // category-color top band — first thing the eye hits
  doc.setFillColor(...meta.accent);
  doc.rect(0, 0, pageWidth, 54, "F");

  // category icon, top-right, inside a white circle
  const iconCx = pageWidth - margin - 6;
  const iconCy = 27;
  doc.setFillColor(255, 255, 255);
  doc.circle(iconCx, iconCy, 20, "F");
  doc.setDrawColor(...meta.accent);
  doc.setLineWidth(1.4);
  meta.icon(doc, iconCx, iconCy);
  doc.setLineWidth(1);

  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text("Jnana Prabodhini - EARC", margin, 24);
  doc.setFontSize(10);
  doc.text("Gyan-Setu", margin, 40);

  y = 80;
  doc.setFontSize(13);
  doc.setTextColor(...meta.accent);
  doc.text(`${meta.title} Receipt`, margin, y);
  y += 22;

  doc.setDrawColor(228, 223, 209);
  doc.line(margin, y, pageWidth - margin, y);
  y += 22;

  const row = (label: string, value: string) => {
    doc.setFontSize(9);
    doc.setTextColor(155, 145, 136);
    doc.text(label.toUpperCase(), margin, y);
    doc.setFontSize(12);
    doc.setTextColor(25, 20, 15);
    doc.text(value || "-", margin, y + 15);
    y += 32;
  };

  row("Receipt No.", ex.id.slice(0, 8).toUpperCase());
  row("Date", new Date(ex.expense_date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }));
  row("Group", ex.group?.name ?? "-");
  row("Submitted By", ex.submitter?.name ?? "-");
  row(meta.subLabel, ex.subcategory ?? "-");
  if (ex.volunteer_count) row("Number of Volunteers", String(ex.volunteer_count));
  if (ex.vendor_name) row("Name of Person / Vendor", ex.vendor_name);
  if (ex.description) row("Notes", ex.description);
  row("Status", ex.status.charAt(0).toUpperCase() + ex.status.slice(1));

  doc.line(margin, y, pageWidth - margin, y);
  y += 26;

  // Total, banded in the category color for a final visual anchor
  doc.setFillColor(...meta.accent);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 40, 4, 4, "F");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL", margin + 14, y + 25);
  doc.setFontSize(17);
  doc.text(`Rs. ${Number(ex.amount).toLocaleString("en-IN")}`, pageWidth - margin - 14, y + 26, { align: "right" });
  y += 40 + 46;

  // Signatures — volunteer left, project head right
  const sigWidth = (pageWidth - margin * 2 - 30) / 2;
  const sigY = Math.min(y, pageHeight - 70);
  doc.setDrawColor(90, 82, 71);
  doc.line(margin, sigY, margin + sigWidth, sigY);
  doc.line(pageWidth - margin - sigWidth, sigY, pageWidth - margin, sigY);
  doc.setFontSize(10);
  doc.setTextColor(90, 82, 71);
  doc.text("Volunteer", margin, sigY + 14);
  doc.text("Project Head", pageWidth - margin - sigWidth, sigY + 14);

  doc.setFontSize(8);
  doc.setTextColor(155, 145, 136);
  doc.text("Generated by Gyan-Setu — for reimbursement record purposes.", margin, pageHeight - 20);

  doc.save(`receipt-${ex.category}-${ex.id.slice(0, 8)}.pdf`);
}
