"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createGroupShareLink, getGroupShareLink, revokeGroupShareLink } from "@/actions/journey";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function GroupShareCard({ groupId }: { groupId: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getGroupShareLink(groupId).then(setToken).catch(() => {}).finally(() => setLoading(false));
  }, [groupId]);

  const url = token ? `${window.location.origin}/journey/${token}` : "";

  async function run(fn: () => Promise<string | void>, ok: string) {
    setBusy(true);
    try {
      setToken((await fn()) ?? null);
      toast.success(ok);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mb-4">
      <CardContent>
        <h2 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>Parent Link</h2>
        <p style={{ fontSize: 12, color: "var(--gs-muted)", margin: "0 0 12px" }}>
          One link for this whole group. Parents see the group&apos;s route, schools, travel and photos (no individual logs).
        </p>
        {loading ? null : token ? (
          <div className="flex flex-col gap-2">
            <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} style={{ width: "100%", padding: 8, fontSize: 13, border: "1px solid rgba(90,82,71,0.2)", borderRadius: 8 }} />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => navigator.clipboard.writeText(url).then(() => toast.success("Link copied"))}>Copy link</Button>
              <Button variant="outline" disabled={busy} onClick={() => run(() => createGroupShareLink(groupId), "New link created; old one stopped working")}>Regenerate</Button>
              <Button variant="outline" disabled={busy} onClick={() => run(() => revokeGroupShareLink(groupId).then(() => undefined), "Link revoked")}>Revoke</Button>
            </div>
          </div>
        ) : (
          <Button disabled={busy} onClick={() => run(() => createGroupShareLink(groupId), "Link created")}>Create group link</Button>
        )}
      </CardContent>
    </Card>
  );
}
