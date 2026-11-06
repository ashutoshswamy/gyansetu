"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createShareLink, getMyShareLink, getMyShareTours, revokeShareLink } from "@/actions/journey";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ShareJourneyPage() {
  const [link, setLink] = useState<{ token: string; tour_id: string | null } | null>(null);
  const [tours, setTours] = useState<{ id: string; title: string }[]>([]);
  const [tourId, setTourId] = useState("");
  const token = link?.token ?? null;
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([getMyShareLink(), getMyShareTours()])
      .then(([l, t]) => { setLink(l); setTours(t); setTourId(l?.tour_id ?? ""); })
      .finally(() => setLoading(false));
  }, []);

  const url = token ? `${window.location.origin}/journey/${token}` : "";

  async function run(fn: () => Promise<{ token: string; tour_id: string | null } | void>, ok: string) {
    setBusy(true);
    try {
      const r = await fn();
      setLink(r ?? null);
      toast.success(ok);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-2xl mx-auto">
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Parent Link</h1>
        <p style={{ fontSize: 14, color: "var(--gs-text-secondary)", margin: "4px 0 24px" }}>
          Anyone with this link can see your route, schools visited, daily highlights and photos. Route is recorded while{" "}
          <strong>Location sharing</strong> is on. Revoke anytime.
        </p>
        <Card>
          <CardContent>
            {!loading && (
              <label style={{ display: "block", fontSize: 13, marginBottom: 12 }}>
                What parents can see
                <select
                  value={tourId}
                  onChange={(e) => setTourId(e.target.value)}
                  style={{ display: "block", width: "100%", marginTop: 4, padding: 8, border: "1px solid rgba(90,82,71,0.2)", borderRadius: 8 }}
                >
                  <option value="">Everything so far</option>
                  {tours.map((t) => <option key={t.id} value={t.id}>Only: {t.title}</option>)}
                </select>
                {token && tourId !== (link?.tour_id ?? "") && (
                  <span style={{ color: "var(--gs-muted)" }}>Click Regenerate to apply (this changes the link).</span>
                )}
              </label>
            )}
            {loading ? null : token ? (
              <div className="flex flex-col gap-3">
                <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} style={{ width: "100%", padding: 8, fontSize: 13, border: "1px solid rgba(90,82,71,0.2)", borderRadius: 8 }} />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => navigator.clipboard.writeText(url).then(() => toast.success("Link copied"))}>Copy link</Button>
                  <Button variant="outline" disabled={busy} onClick={() => run(() => createShareLink(tourId), "New link created; old one stopped working")}>Regenerate</Button>
                  <Button variant="outline" disabled={busy} onClick={() => run(revokeShareLink, "Link revoked")}>Revoke</Button>
                </div>
              </div>
            ) : (
              <Button disabled={busy} onClick={() => run(() => createShareLink(tourId), "Link created")}>Create parent link</Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
