"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ManageSubscriptionButtonProps = {
  className?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  children?: ReactNode;
};

export function ManageSubscriptionButton({
  className,
  variant = "outline",
  size = "default",
  children = "Manage subscription",
}: ManageSubscriptionButtonProps) {
  const [busy, setBusy] = useState(false);

  async function openPortal() {
    setBusy(true);
    try {
      const res = await fetch("/api/stripe/billing-portal", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          typeof data.error === "string"
            ? data.error
            : "Could not open billing portal."
        );
        return;
      }
      if (data.url) {
        window.location.href = data.url as string;
        return;
      }
      toast.error("No portal URL returned.");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={busy}
      onClick={openPortal}
      className={cn(className)}
    >
      {children}
    </Button>
  );
}
