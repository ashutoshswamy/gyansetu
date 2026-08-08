import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AddImageForm from "./add-image-form";

interface Props {
  params: Promise<{ categoryId: string }>;
}

export default async function AddImagePage({ params }: Props) {
  const { categoryId } = await params;

  const db = createServerClient();
  const { data: category } = await db
    .from("gallery_categories")
    .select("id, name")
    .eq("id", categoryId)
    .single();

  if (!category) notFound();

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", padding: "48px 24px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: "var(--gs-muted)",
            marginBottom: 4,
          }}>
            Admin Console / Gallery / {category.name}
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
            Add Image
          </h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", marginTop: 4 }}>
            Adding image to <strong style={{ color: "var(--foreground)" }}>{category.name}</strong>
          </p>
        </div>

        <AddImageForm categoryId={category.id} />
      </div>
    </div>
  );
}
