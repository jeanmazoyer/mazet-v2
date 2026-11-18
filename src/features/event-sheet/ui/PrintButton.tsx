"use client";
import { Button } from "@/components/ui/Button";

export function PrintButton({ label }: { label: string }): React.ReactNode {
  return (
    <Button size="sm" variant="outline" onClick={() => window.print()}>
      {label}
    </Button>
  );
}
