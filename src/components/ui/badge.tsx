import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium font-body transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-sfb-terracota text-sfb-baunilha",
        secondary: "border-transparent bg-sfb-areia text-sfb-cacau",
        destructive: "border-transparent bg-red-100 text-red-800",
        outline: "text-sfb-cacau border-sfb-areia",
        pendente: "border-transparent bg-amber-100 text-amber-800",
        confirmado: "border-transparent bg-sfb-salvia/20 text-sfb-cacau font-semibold",
        producao: "border-transparent bg-sfb-terracota/20 text-sfb-terracota",
        pronto: "border-transparent bg-sfb-salvia text-sfb-baunilha",
        entregue: "border-transparent bg-sfb-areia/50 text-sfb-cacau",
        cancelado: "border-transparent bg-gray-200 text-gray-500",
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
