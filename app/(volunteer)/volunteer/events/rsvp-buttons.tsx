"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { rsvpEvent } from "@/actions/events";

const OPTIONS = [
  { status: "confirmed" as const, label: "Will attend", variant: "default" as const },
  { status: "maybe" as const, label: "Maybe", variant: "secondary" as const },
  { status: "absent" as const, label: "Will not attend", variant: "destructive" as const },
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
          <Button
            key={o.status}
            onClick={() => rsvp(o.status)}
            disabled={loading !== null}
            variant={active ? o.variant : "outline"}
            size="xs"
            className={loading !== null && loading !== o.status ? "opacity-60" : ""}
          >
            {loading === o.status ? "..." : o.label}
          </Button>
        );
      })}
    </div>
  );
}
