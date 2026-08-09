"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "0 1.5rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "1.875rem", fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ maxWidth: "28rem", color: "#71717a" }}>
          A critical error occurred. Please try again.
        </p>
        <Button
          variant="outline"
          onClick={() => unstable_retry()}
          className="rounded-full"
        >
          Try again
        </Button>
      </body>
    </html>
  );
}
