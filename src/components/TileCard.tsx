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
  vinho: { bg: "bg-cda-vinho/10", icon: "text-cda-vinho" },
  dourado: { bg: "bg-cda-dourado/15", icon: "text-cda-vinho" },
  pink: { bg: "bg-cda-pink/30", icon: "text-cda-coral" },
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
        "group flex w-full items-start gap-4 rounded-2xl border border-cda-dourado/20 bg-cda-branco px-5 py-4 text-left",
        "shadow-[0_4px_18px_-10px_rgba(91,26,43,0.15)] transition",
        "hover:-translate-y-0.5 hover:border-cda-dourado/60 hover:shadow-[0_8px_24px_-12px_rgba(91,26,43,0.25)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full ring-1 ring-cda-dourado/40",
          tones.bg,
        )}
      >
        <Icon className={cn("h-5 w-5", tones.icon)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-base text-cda-vinho-escuro sm:text-lg">
          {title}
        </p>
        {description && (
          <p className="mt-1 text-xs font-body text-cda-vinho/60 sm:text-sm">
            {description}
          </p>
        )}
        {children}
      </div>
    </button>
  );
}
