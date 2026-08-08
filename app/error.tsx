"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <TriangleAlertIcon className="size-10 text-destructive" />
      <h1 className="text-3xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-muted-foreground">
        An unexpected error occurred. Try again, or head back home if the problem persists.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => unstable_retry()}>
          Try again
        </Button>
        <Button render={<Link href="/" />}>Return home</Button>
      </div>
    </div>
  );
}
