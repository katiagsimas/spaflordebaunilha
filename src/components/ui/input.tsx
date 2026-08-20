import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-sfb-areia bg-sfb-baunilha/50 px-4 py-2.5 text-sm font-body text-sfb-cacau ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-sfb-cacau placeholder:text-sfb-cacau/50 focus-visible:outline-none focus-visible:border-sfb-terracota focus-visible:ring-2 focus-visible:ring-sfb-terracota/10 disabled:cursor-not-allowed disabled:bg-sfb-areia/20 disabled:text-sfb-cacau/40 disabled:opacity-60 transition-all duration-200",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
