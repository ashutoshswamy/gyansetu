import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { DynamicForm } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

export default async function StudentFormsPage() {
  const { userId } = await auth();
  const db = createServerClient();

  const { data: user } = await db.from("users").select("id").eq("clerk_id", userId!).single();

  const { data: applications } = await db
    .from("tour_applications")
    .select("tour_id, status")
    .eq("student_id", user?.id ?? "")
    .in("status", ["pending", "shortlisted"]);
  const tourIds = (applications ?? []).map((a) => a.tour_id).filter((id): id is string => !!id);

  let formsQuery = db
    .from("dynamic_forms")
    .select("*")
    .in("target_role", ["enrollee", "all"])
    .eq("status", "active")
    .eq("is_template", false);
  formsQuery = tourIds.length > 0
    ? formsQuery.or(`tour_id.is.null,tour_id.in.(${tourIds.join(",")})`)
    : formsQuery.is("tour_id", null);
  const { data: forms } = await formsQuery.order("created_at", { ascending: false });

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-muted)", marginBottom: 4 }}>Student Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Forms</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>Forms you need to fill</p>
        </div>

        <div className="space-y-3">
          {(forms ?? []).length === 0 && (
            <p style={{ fontSize: 14, color: "var(--gs-muted)", textAlign: "center", padding: "48px 0" }}>No active forms right now.</p>
          )}
          {(forms ?? []).map((form: DynamicForm) => (
            <Card key={form.id}>
<CardContent>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", margin: "0 0 4px" }}>{form.title}</h3>
                {form.description && <p style={{ fontSize: 12, color: "var(--gs-text-secondary)", margin: "0 0 4px" }}>{form.description}</p>}
                <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: 0 }}>{form.fields?.length ?? 0} fields</p>
              </div>
              <Link href={`/enrollee/forms/${form.id}`}>
                <Button size="sm">
                  Fill Form
                </Button>
              </Link>
            </CardContent>
</Card>
          ))}
        </div>
      </div>
    </div>
  );
}
