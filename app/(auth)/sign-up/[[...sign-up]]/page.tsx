import { SignUp } from "@clerk/nextjs";
import Image from "next/image";

export default function SignUpPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{ background: "#FAFAF7" }}
    >
      {/* Subtle grid pattern */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(#E4DFD1 1px, transparent 1px), linear-gradient(to right, #E4DFD1 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.45,
          pointerEvents: "none",
        }}
      />

      <div
        className="relative flex flex-col items-center gap-6"
        style={{ zIndex: 1 }}
      >
        {/* Logo + wordmark */}
        <div className="flex flex-col items-center gap-3">
          <Image src="/logo_wide.png" alt="Gyan Setu" width={160} height={48} style={{ height: 48, width: "auto", objectFit: "contain" }} />
          <p
            className="text-sm mt-1"
            style={{
              color: "#5A5247",
              fontFamily: "var(--font-poppins), sans-serif",
            }}
          >
            Create your account
          </p>
        </div>

        <SignUp />
      </div>
    </div>
  );
}
