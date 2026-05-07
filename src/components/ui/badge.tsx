import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium font-body transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-secondary text-secondary-foreground",
        secondary: "border-transparent bg-cda-pink/25 text-foreground",
        destructive: "border-transparent bg-destructive/20 text-destructive",
        outline: "text-foreground",
        pendente: "border-transparent bg-cda-dourado/25 text-foreground",
        confirmado: "border-transparent bg-info/15 text-info",
        producao: "border-transparent bg-cda-pink/20 text-foreground",
        pronto: "border-transparent bg-secondary text-secondary-foreground",
        entregue: "border-transparent bg-foreground/10 text-muted-foreground",
        cancelado: "border-transparent bg-destructive/15 text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
