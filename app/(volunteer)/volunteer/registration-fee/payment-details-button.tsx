"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { PaymentSettings } from "@/types";
import { Wallet } from "lucide-react";

export function PaymentDetailsButton({ settings }: { settings: PaymentSettings | null }) {
  const hasDetails = settings && (settings.amount || settings.upi_id || settings.account_number || settings.qr_code_url);
  if (!hasDetails) return null;

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="secondary" size="sm" />}>
        <Wallet className="w-3.5 h-3.5" />
        Payment Details
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Where to Send the Registration Fee</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          {settings.amount != null && <p><span className="font-medium">Amount to Pay:</span> ₹{settings.amount}</p>}
          {settings.upi_id && <p><span className="font-medium">UPI ID:</span> {settings.upi_id}</p>}
          {settings.account_holder_name && <p><span className="font-medium">Account Holder:</span> {settings.account_holder_name}</p>}
          {settings.bank_name && <p><span className="font-medium">Bank:</span> {settings.bank_name}</p>}
          {settings.account_number && <p><span className="font-medium">Account Number:</span> {settings.account_number}</p>}
          {settings.ifsc_code && <p><span className="font-medium">IFSC Code:</span> {settings.ifsc_code}</p>}
          {settings.qr_code_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.qr_code_url} alt="Payment QR Code" className="mt-2 w-full max-w-[240px] rounded-md border" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
