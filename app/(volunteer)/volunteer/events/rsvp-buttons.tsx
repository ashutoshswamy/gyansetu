"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { rsvpEvent } from "@/actions/events";

const OPTIONS = [
  { status: "confirmed" as const, label: "Will attend", color: "#2A5E3A" },
  { status: "maybe" as const, label: "Maybe", color: "#F5A520" },
  { status: "absent" as const, label: "Will not attend", color: "#B8381E" },
];

export function RsvpButtons({ eventId, current }: { eventId: string; current?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function rsvp(status: "confirmed" | "maybe" | "absent") {
    setLoading(status);
    try {
      await rsvpEvent(eventId, status);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update RSVP");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {OPTIONS.map(o => {
        const active = current === o.status;
        return (
          <button
            key={o.status}
            onClick={() => rsvp(o.status)}
            disabled={loading !== null}
            style={{
              fontSize: 11, fontWeight: 600, minHeight: 34, padding: "0 12px", borderRadius: 4,
              background: active ? o.color : "transparent",
              color: active ? "white" : o.color,
              border: `1.5px solid ${active ? o.color : `${o.color}59`}`,
              cursor: loading !== null ? "not-allowed" : "pointer",
              opacity: loading !== null && loading !== o.status ? 0.6 : 1,
            }}
          >
            {loading === o.status ? "..." : o.label}
          </button>
        );
      })}
    </div>
  );
}
