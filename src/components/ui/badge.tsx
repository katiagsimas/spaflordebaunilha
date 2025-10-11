import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        pendente: "bg-[#FEF3E2] text-[#B8860B] border-[#E5C89F]",
        confirmado: "bg-[#E3F2FD] text-[#1976D2] border-[#90CAF9]",
        producao: "bg-[#F3E5F5] text-[#7B1FA2] border-[#CE93D8]",
        pronto: "bg-[#E8F5E9] text-[#388E3C] border-[#8BA888]",
        entregue: "bg-[#F5F5F5] text-[#616161] border-[#E0E0E0]",
        cancelado: "bg-[#FFEBEE] text-[#C62828] border-[#D88B8B]",
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
