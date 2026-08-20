import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border border-sfb-areia bg-sfb-baunilha/50 px-4 py-2.5 text-sm font-body text-sfb-cacau ring-offset-background placeholder:text-sfb-cacau/50 focus-visible:outline-none focus-visible:border-sfb-terracota focus-visible:ring-2 focus-visible:ring-sfb-terracota/10 disabled:cursor-not-allowed disabled:bg-sfb-areia/20 disabled:text-sfb-cacau/40 disabled:opacity-60 transition-all duration-200",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
