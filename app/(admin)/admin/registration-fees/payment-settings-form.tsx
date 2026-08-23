"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { upsertPaymentSettings } from "@/actions/payment-settings";
import { FileUploadField } from "@/components/features/file-upload-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import type { PaymentSettings } from "@/types";
import { Settings2 } from "lucide-react";

export function PaymentSettingsForm({ settings }: { settings: PaymentSettings | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [upiId, setUpiId] = useState(settings?.upi_id ?? "");
  const [accountHolderName, setAccountHolderName] = useState(settings?.account_holder_name ?? "");
  const [bankName, setBankName] = useState(settings?.bank_name ?? "");
  const [accountNumber, setAccountNumber] = useState(settings?.account_number ?? "");
  const [ifscCode, setIfscCode] = useState(settings?.ifsc_code ?? "");
  const [qrCodeUrl, setQrCodeUrl] = useState(settings?.qr_code_url ?? "");

  async function handleSave() {
    setSaving(true);
    try {
      await upsertPaymentSettings({
        upi_id: upiId.trim() || undefined,
        account_holder_name: accountHolderName.trim() || undefined,
        bank_name: bankName.trim() || undefined,
        account_number: accountNumber.trim() || undefined,
        ifsc_code: ifscCode.trim() || undefined,
        qr_code_url: qrCodeUrl.trim() || undefined,
      });
      toast.success("Payment details saved");
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save payment details");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="secondary" size="sm" />}>
        <Settings2 className="w-3.5 h-3.5" />
        Payment Details
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registration Fee Payment Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">UPI ID</label>
            <Input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="name@bank" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Account Holder Name</label>
            <Input value={accountHolderName} onChange={e => setAccountHolderName(e.target.value)} placeholder="Enter account holder name" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Bank Name</label>
            <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Enter bank name" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Account Number</label>
            <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Enter account number" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">IFSC Code</label>
            <Input value={ifscCode} onChange={e => setIfscCode(e.target.value)} placeholder="Enter IFSC code" />
          </div>
          <FileUploadField label="QR Code" value={qrCodeUrl} onChange={setQrCodeUrl} bucket="payment-qr" folder="qr" accept="image/*" showImagePreview />
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
