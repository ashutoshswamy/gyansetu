"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitTravelTicket } from "@/actions/travel";
import { uploadFileToStorage } from "@/actions/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TicketUploadForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("ticket") as File | null;
    if (!file || file.size === 0) {
      toast.error("Select a ticket file");
      return;
    }

    setLoading(true);
    try {
      const upload = new FormData();
      upload.append("file", file);
      const ticketFileUrl = await uploadFileToStorage(upload, "documents", `travel-tickets/${groupId}`);
      await submitTravelTicket({
        group_id: groupId,
        ticket_file_url: ticketFileUrl,
        note: (form.get("note") as string) || undefined,
      });
      formRef.current?.reset();
      toast.success("Travel ticket uploaded");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload travel ticket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3 mb-6">
      <div>
        <Label className="mb-1.5">Upload ticket</Label>
        <Input name="ticket" type="file" accept="application/pdf,image/*" required disabled={loading} />
      </div>
      <div>
        <Label className="mb-1.5">Note (optional)</Label>
        <Input name="note" placeholder="e.g. Return journey" maxLength={1000} disabled={loading} />
      </div>
      <Button type="submit" disabled={loading}>{loading ? "Uploading..." : "Upload Ticket"}</Button>
    </form>
  );
}
