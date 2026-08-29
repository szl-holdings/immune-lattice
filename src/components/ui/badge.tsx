import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
  {
    variants: {
      tone: {
        live: "bg-primary/15 text-primary",
        modeled: "bg-fg/10 text-muted",
        range: "bg-warn/15 text-warn",
        danger: "bg-danger/15 text-danger",
        ok: "bg-ok/15 text-ok",
        mute: "bg-bg-subtle text-muted",
      },
    },
    defaultVariants: { tone: "mute" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone, className }))} {...props} />;
}
