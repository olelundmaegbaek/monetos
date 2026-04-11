"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[monetos] dashboard error", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-xl font-semibold">Noget gik galt</h2>
        <p className="text-sm text-muted-foreground">
          {error.message || "Ukendt fejl"}
        </p>
        <Button onClick={() => reset()}>Prøv igen</Button>
      </div>
    </div>
  );
}
