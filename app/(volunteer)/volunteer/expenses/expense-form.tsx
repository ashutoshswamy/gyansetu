"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitExpense, resubmitExpense } from "@/actions/finance";
import { getGroupsForSelect } from "@/actions/groups";
import { uploadFileToStorage } from "@/actions/upload";
import type { ExpenseInput } from "@/lib/validations";
import type { Expense } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES: { value: ExpenseInput["category"]; label: string; hint: string }[] = [
  { value: "travel", label: "Travel & Transportation", hint: "Train, Bus, Flight, Taxi, Auto, Local Transport, Fuel" },
  { value: "accommodation", label: "Accommodation", hint: "Hotel, Hostel, Guest House, Homestay" },
  { value: "food", label: "Food & Refreshments", hint: "Breakfast, Lunch, Dinner, Snacks" },
  { value: "materials", label: "Program Materials & Printing", hint: "Stationery, science materials, printing, teaching aids, banners, etc." },
  { value: "miscellaneous", label: "Miscellaneous", hint: "Any expense not covered under the above categories" },
];

const SUBCATEGORY_OPTIONS: Partial<Record<ExpenseInput["category"], readonly string[]>> = {
  travel: ["Train", "Bus", "Flight", "Taxi", "Auto", "Local Transport", "Fuel"],
  accommodation: ["Hotel", "Hostel", "Guest House", "Homestay"],
  food: ["Breakfast", "Lunch", "Dinner", "Snacks"],
};

function ReceiptUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const url = await uploadFileToStorage(fd, "expense-bills", "receipts");
      onChange(url);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setUploading(false);
    }
  }

  const fileName = value ? value.split("/").pop() ?? "Receipt" : "";

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground">Receipt / Bill Image (optional)</Label>
      {value ? (
        <div className="flex items-center gap-2.5 p-2.5 border border-border rounded-md bg-background">
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-accent flex-1 min-w-0 truncate">
            {fileName}
          </a>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")} className="h-auto p-0 text-xs text-destructive hover:text-destructive">
            Remove
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="w-full justify-start text-xs border-dashed text-muted-foreground font-normal"
        >
          {uploading ? "Uploading…" : "+ Upload receipt (image or PDF)"}
        </Button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      {uploadError && <p className="text-xs text-destructive mt-1">{uploadError}</p>}
    </div>
  );
}

export function ExpenseForm({ groupId, editExpense, onDone }: { groupId: string | null; editExpense?: Expense; onDone?: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [category, setCategory] = useState<ExpenseInput["category"]>(editExpense?.category ?? "travel");
  const [subcategory, setSubcategory] = useState<string>(editExpense?.subcategory ?? "");
  const [selectedGroupId, setSelectedGroupId] = useState<string>(editExpense?.group_id ?? "");
  const [billUrl, setBillUrl] = useState(editExpense?.bill_url ?? "");

  const subOptions = SUBCATEGORY_OPTIONS[category];
  const currentCategory = CATEGORIES.find(c => c.value === category)!;
  const needsVolunteerCount = category === "food";

  useEffect(() => {
    if (!groupId) {
      getGroupsForSelect().then(data => setGroups(data as unknown as typeof groups));
    }
  }, [groupId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const targetGroupId = groupId ?? selectedGroupId;
    if (!targetGroupId) {
      setError("Please select a group");
      setSaving(false);
      return;
    }

    const inputSubcategory = subOptions ? subcategory : (fd.get("subcategory") as string);
    if (!inputSubcategory) {
      setError("Please select or enter a type/subcategory");
      setSaving(false);
      return;
    }

    const payload: ExpenseInput = {
      group_id: targetGroupId,
      category,
      subcategory: inputSubcategory,
      amount: Number(fd.get("amount")),
      expense_date: fd.get("expense_date") as string,
      vendor_name: (fd.get("vendor_name") as string) || undefined,
      bill_url: billUrl || undefined,
      description: (fd.get("description") as string) || undefined,
      volunteer_count: needsVolunteerCount ? Number(fd.get("volunteer_count")) : undefined,
    };

    try {
      if (editExpense) {
        await resubmitExpense(editExpense.id, payload);
        toast.success("Expense resubmitted for approval");
        onDone?.();
      } else {
        await submitExpense(payload);
        toast.success("Expense submitted for approval");
        (e.target as HTMLFormElement).reset();
        setBillUrl("");
      }
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit expense";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            {!groupId && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Group <span className="text-destructive">*</span></Label>
                <Select value={selectedGroupId} onValueChange={(val) => setSelectedGroupId(val ?? "")} items={groups.map(g => ({ value: g.id, label: g.name }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select group..." />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Category <span className="text-destructive">*</span></Label>
              <Select value={category} onValueChange={(val) => {
                const cat = (val ?? "travel") as ExpenseInput["category"];
                setCategory(cat);
                setSubcategory("");
              }} items={CATEGORIES.map(c => ({ value: c.value, label: c.label }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">{currentCategory.hint}</p>
            </div>

            {subOptions ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Type <span className="text-destructive">*</span></Label>
                <Select value={subcategory} onValueChange={(val) => setSubcategory(val ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  {category === "materials" ? "Items Purchased" : "Purpose of Expense"} <span className="text-destructive">*</span>
                </Label>
                <Input
                  name="subcategory"
                  type="text"
                  required
                  defaultValue={editExpense?.subcategory ?? ""}
                  placeholder={category === "materials" ? "e.g. stationery, science materials, printing, teaching aids, banners..." : "Describe the purpose of this expense..."}
                />
              </div>
            )}

            {needsVolunteerCount && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Number of Volunteers <span className="text-destructive">*</span></Label>
                <Input name="volunteer_count" type="number" min="1" step="1" required defaultValue={editExpense?.volunteer_count ?? ""} placeholder="How many volunteers?" />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Amount (₹) <span className="text-destructive">*</span></Label>
                <Input name="amount" type="number" min="0" step="0.01" required defaultValue={editExpense?.amount ?? ""} placeholder="Enter amount" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Date <span className="text-destructive">*</span></Label>
                <Input name="expense_date" type="date" required defaultValue={editExpense?.expense_date ?? new Date().toISOString().split("T")[0]} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Name of Person / Vendor</Label>
              <Input name="vendor_name" type="text" defaultValue={editExpense?.vendor_name ?? ""} placeholder="Who was paid?" />
            </div>

            <ReceiptUpload value={billUrl} onChange={setBillUrl} />

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Additional Notes</Label>
              <Textarea name="description" rows={2} defaultValue={editExpense?.description ?? ""} placeholder="Anything else to add..." />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              {saving ? "Saving..." : editExpense ? "Resubmit Expense" : "Submit Expense"}
            </Button>
            {editExpense && (
              <Button type="button" variant="outline" onClick={onDone}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
