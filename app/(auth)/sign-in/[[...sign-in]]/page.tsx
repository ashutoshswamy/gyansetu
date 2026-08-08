import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function SignInPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{ background: "var(--background)" }}
    >
      {/* Subtle grid pattern */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(to right, var(--border) 1px, transparent 1px)",
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
              color: "var(--gs-text-secondary)",
              fontFamily: "var(--font-plex-sans), sans-serif",
            }}
          >
            Sign in to your account
          </p>
        </div>

        <SignIn />
      </div>
    </div>
  );
}
