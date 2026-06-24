"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

interface Props {
  tables: string[];
}

// Subscribes to Supabase Realtime for the given tables and calls router.refresh()
// on any INSERT/UPDATE/DELETE so server components re-render with fresh data.
// Requires Realtime to be enabled on each table in the Supabase dashboard.
export function RealtimeRefresher({ tables }: Props) {
  const router = useRouter();

  useEffect(() => {
    const channel = supabase.channel(`rt:${tables.join(",")}`);

    tables.forEach((table) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => router.refresh()
      );
    });

    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
    // tables is a static literal in each layout — safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
