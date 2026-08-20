import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TileCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  onClick?: () => void;
  /** vinho (padrão) | dourado | pink — define o anel/ícone */
  tone?: "vinho" | "dourado" | "pink";
  className?: string;
  children?: ReactNode;
}

const TONE_MAP = {
  vinho: { bg: "bg-sfb-vinho/10", icon: "text-sfb-vinho" },
  dourado: { bg: "bg-sfb-dourado/15", icon: "text-sfb-vinho" },
  pink: { bg: "bg-sfb-pink/30", icon: "text-sfb-coral" },
} as const;

/**
 * Card-tile padrão (linguagem do Dashboard):
 * rounded-2xl + borda dourada hairline + sombra vinho difusa +
 * ícone circular com ring dourado + hover com elevação suave.
 */
export function TileCard({
  icon: Icon,
  title,
  description,
  onClick,
  tone = "vinho",
  className,
  children,
}: TileCardProps) {
  const tones = TONE_MAP[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-start gap-4 rounded-2xl border-2 border-sfb-dourado/50 bg-sfb-branco px-5 py-4 text-left",
        "shadow-[0_4px_18px_-10px_rgba(91,26,43,0.15)] transition",
        "hover:-translate-y-0.5 hover:border-sfb-dourado hover:shadow-[0_8px_24px_-12px_rgba(91,26,43,0.25)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full ring-1 ring-sfb-dourado/40",
          tones.bg,
        )}
      >
        <Icon className={cn("h-5 w-5", tones.icon)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-base text-sfb-vinho-escuro sm:text-lg">
          {title}
        </p>
        {description && (
          <p className="mt-1 text-xs font-body text-sfb-vinho/60 sm:text-sm">
            {description}
          </p>
        )}
        {children}
      </div>
    </button>
  );
}
