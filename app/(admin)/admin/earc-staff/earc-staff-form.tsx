"use client";

import { useRef, useState, useTransition } from "react";
import { createEarcStaff } from "@/actions/earc";
import { UserPlus, Loader2, Eye, EyeOff } from "lucide-react";

export function EarcStaffForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await createEarcStaff(fd);
        setSuccess(true);
        formRef.current?.reset();
        setTimeout(() => {
          setSuccess(false);
          window.location.reload();
        }, 1500);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to create staff member");
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-xl p-5 mb-6"
      style={{ background: "white", border: "1px solid #E4DFD1" }}
    >
      <h2 style={{ fontSize: 14, fontWeight: 600, color: "#19140F", marginBottom: 16 }}>Create EARC Staff Account</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>
            Full Name <span style={{ color: "#B8381E" }}>*</span>
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder="Jane Smith"
            className="w-full px-3 py-2 rounded text-sm outline-none"
            style={{ border: "1px solid #E4DFD1", color: "#19140F", background: "#FAFAF7" }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>
            Email <span style={{ color: "#B8381E" }}>*</span>
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder="staff@example.com"
            className="w-full px-3 py-2 rounded text-sm outline-none"
            style={{ border: "1px solid #E4DFD1", color: "#19140F", background: "#FAFAF7" }}
          />
        </div>
      </div>

      <div className="mb-4">
        <label style={{ fontSize: 12, fontWeight: 600, color: "#5A5247", display: "block", marginBottom: 6 }}>
          Password <span style={{ color: "#B8381E" }}>*</span>
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            required
            minLength={8}
            placeholder="Min 8 characters"
            className="w-full px-3 py-2 pr-10 rounded text-sm outline-none"
            style={{ border: "1px solid #E4DFD1", color: "#19140F", background: "#FAFAF7" }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "#9B9188" }}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p style={{ fontSize: 11, color: "#9B9188", marginTop: 4 }}>
          If email already exists, password is ignored — existing user gets EARC staff role automatically.
        </p>
      </div>

      {error && (
        <p style={{ fontSize: 12, color: "#B8381E", padding: "8px 12px", background: "rgba(184,56,30,0.06)", borderRadius: 6, marginBottom: 12 }}>
          {error}
        </p>
      )}
      {success && (
        <p style={{ fontSize: 12, color: "#2A5E3A", padding: "8px 12px", background: "rgba(42,94,58,0.06)", borderRadius: 6, marginBottom: 12 }}>
          EARC staff account created.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-opacity"
        style={{ background: "#B8381E", color: "white", opacity: isPending ? 0.7 : 1 }}
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        {isPending ? "Creating..." : "Create Staff Account"}
      </button>
    </form>
  );
}
