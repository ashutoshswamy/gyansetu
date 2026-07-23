"use server";

import { requireAdminUser, requireVolunteerUser } from "@/lib/clerk/action-auth";
import { expenseAdvanceSchema, expenseSchema, rejectExpenseSchema, type ExpenseAdvanceInput, type ExpenseInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

// Advances

export async function createExpenseAdvance(input: ExpenseAdvanceInput) {
  const { db, user } = await requireAdminUser();
  const data = expenseAdvanceSchema.parse(input);
  const { data: advance, error } = await db
    .from("expense_advances")
    .insert({ ...data, given_by: user.id })
    .select()
    .single();
  if (error) { console.error("[createExpenseAdvance]", error); throw new Error("Failed to record advance"); }
  revalidatePath("/admin/finance");
  return advance;
}

export async function getAllExpenseAdvances() {
  const { db } = await requireAdminUser();
  const { data, error } = await db
    .from("expense_advances")
    .select("*, group:tour_groups(id, name)")
    .order("given_at", { ascending: false });
  if (error) { console.error("[getAllExpenseAdvances]", error); throw new Error("Failed to fetch advances"); }
  return data ?? [];
}

// Expenses / bills

export async function submitExpense(input: ExpenseInput) {
  const { db, user } = await requireVolunteerUser();
  const data = expenseSchema.parse(input);
  const { data: expense, error } = await db
    .from("expenses")
    .insert({ ...data, submitted_by: user.id })
    .select()
    .single();
  if (error) { console.error("[submitExpense]", error); throw new Error("Failed to submit expense"); }
  revalidatePath("/admin/finance");
  revalidatePath("/volunteer/expenses");
  return expense;
}

export async function approveExpense(id: string) {
  const { db, user } = await requireAdminUser();

  const { data: expense, error: fetchError } = await db
    .from("expenses")
    .select("id, status, submitted_by")
    .eq("id", id)
    .single();
  if (fetchError || !expense) throw new Error("Expense not found");
  if (expense.status !== "pending") throw new Error("Expense is not pending approval");
  if (expense.submitted_by === user.id) throw new Error("Cannot approve your own expense");

  const { data, error } = await db
    .from("expenses")
    .update({ status: "approved", approved_by: user.id, approved_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending")
    .select()
    .single();
  if (error) { console.error("[approveExpense]", error); throw new Error("Failed to approve expense"); }
  revalidatePath("/admin/finance");
  revalidatePath("/volunteer/expenses");
  return data;
}

export async function rejectExpense(id: string, reason: string) {
  const { db, user } = await requireAdminUser();
  const { reason: parsedReason } = rejectExpenseSchema.parse({ reason });

  const { data: expense, error: fetchError } = await db
    .from("expenses")
    .select("id, status, submitted_by")
    .eq("id", id)
    .single();
  if (fetchError || !expense) throw new Error("Expense not found");
  if (expense.status !== "pending") throw new Error("Expense is not pending approval");
  if (expense.submitted_by === user.id) throw new Error("Cannot reject your own expense");

  const { data, error } = await db
    .from("expenses")
    .update({ status: "rejected", approved_by: user.id, approved_at: new Date().toISOString(), rejection_reason: parsedReason })
    .eq("id", id)
    .eq("status", "pending")
    .select()
    .single();
  if (error) { console.error("[rejectExpense]", error); throw new Error("Failed to reject expense"); }
  revalidatePath("/admin/finance");
  revalidatePath("/volunteer/expenses");
  return data;
}

export async function getAllExpenses() {
  const { db } = await requireAdminUser();
  const { data, error } = await db
    .from("expenses")
    .select("*, group:tour_groups(id, name), submitter:users!expenses_submitted_by_fkey(id, name, email)")
    .order("created_at", { ascending: false });
  if (error) { console.error("[getAllExpenses]", error); throw new Error("Failed to fetch expenses"); }
  return data ?? [];
}

export async function getMyExpenses() {
  const { db, user } = await requireVolunteerUser();
  const { data, error } = await db
    .from("expenses")
    .select("*, group:tour_groups(id, name)")
    .eq("submitted_by", user.id)
    .order("created_at", { ascending: false });
  if (error) { console.error("[getMyExpenses]", error); throw new Error("Failed to fetch expenses"); }
  return data ?? [];
}
