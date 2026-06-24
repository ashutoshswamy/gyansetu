import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { deleteCategory } from "@/actions/gallery";

interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  gallery_images: { id: string }[];
}

export default async function AdminGalleryPage() {
  const db = createServerClient();

  const { data: categories } = await db
    .from("gallery_categories")
    .select("id, name, description, created_at, gallery_images(id)")
    .order("created_at", { ascending: false });

  const cats = (categories as CategoryRow[]) ?? [];

  return (
    <div className="min-h-screen p-8" style={{ background: "#FAFAF7" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <p style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: "#9B9188",
              marginBottom: 4,
            }}>
              Admin Console
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Gallery</h1>
            <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
              {cats.length} {cats.length === 1 ? "category" : "categories"} total
            </p>
          </div>
          <Link href="/admin/gallery/new">
            <button style={{
              background: "#4A55BE",
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 16px",
              borderRadius: 5,
              border: "none",
              cursor: "pointer",
            }}>
              + New Category
            </button>
          </Link>
        </div>

        {/* Category list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {cats.length === 0 && (
            <p style={{ color: "#9B9188", fontSize: 14, textAlign: "center", padding: "48px 0" }}>
              No categories yet. Create your first gallery category.
            </p>
          )}

          {cats.map((category) => {
            const imageCount = category.gallery_images?.length ?? 0;
            return (
              <div
                key={category.id}
                style={{
                  background: "white",
                  border: "1px solid #E4DFD1",
                  borderRadius: 10,
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "#19140F", margin: 0 }}>
                    {category.name}
                  </h3>
                  <div style={{ display: "flex", gap: 16, marginTop: 4, alignItems: "center" }}>
                    {category.description && (
                      <p style={{ fontSize: 12, color: "#5A5247", margin: 0 }}>
                        {category.description}
                      </p>
                    )}
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 4,
                      color: "#4A55BE",
                      background: "rgba(74,85,190,0.08)",
                      flexShrink: 0,
                    }}>
                      {imageCount} {imageCount === 1 ? "image" : "images"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <Link href={`/admin/gallery/${category.id}/images/new`}>
                    <button style={{
                      background: "transparent",
                      color: "#4A55BE",
                      fontSize: 13,
                      fontWeight: 500,
                      padding: "7px 14px",
                      borderRadius: 5,
                      border: "1.5px solid rgba(74,85,190,0.28)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}>
                      + Add Image
                    </button>
                  </Link>

                  <form
                    action={async () => {
                      "use server";
                      await deleteCategory(category.id);
                    }}
                  >
                    <button
                      type="submit"
                      style={{
                        background: "transparent",
                        color: "#C0392B",
                        fontSize: 13,
                        fontWeight: 500,
                        padding: "7px 14px",
                        borderRadius: 5,
                        border: "1.5px solid rgba(192,57,43,0.25)",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
