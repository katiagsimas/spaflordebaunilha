import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold font-body ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sfb-terracota focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-sfb-terracota text-sfb-baunilha shadow-soft hover:bg-sfb-terracota/90 hover:-translate-y-0.5 hover:shadow-elevated active:bg-sfb-terracota",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-2 border-sfb-terracota bg-transparent text-sfb-cacau hover:bg-sfb-terracota hover:text-sfb-baunilha",
        secondary: "bg-sfb-areia text-sfb-cacau hover:bg-sfb-areia/80",
        ghost: "bg-transparent text-sfb-cacau hover:bg-sfb-terracota/10 hover:text-sfb-terracota",
        link: "text-sfb-terracota underline-offset-4 hover:underline",
        warning: "bg-warning text-foreground hover:bg-warning/90",
        premium: "bg-sfb-terracota text-sfb-baunilha hover:bg-sfb-terracota/90 shadow-md",
        vinho: "bg-sfb-terracota text-sfb-baunilha hover:bg-sfb-terracota/90", // Legacy alias for transition
      },
      size: {
        default: "h-10 px-6 py-3",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-lg px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
