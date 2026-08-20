import { ReactNode } from "react";
import { ArrowRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumCardProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  /** Imagem decorativa exibida no canto superior direito do header (PNG transparente). */
  headerOrnament?: string;
  /** Conteúdo principal renderizado no corpo creme. */
  children: ReactNode;
  /** Texto de nota no rodapé (ex.: "Pequenos gestos criam grandes lembranças."). */
  footerNote?: string;
  /** Emoji/ícone à esquerda da nota do rodapé. */
  footerNoteIcon?: ReactNode;
  /** CTA do rodapé (botão vinho com seta dourada). */
  footerCta?: { label: string; onClick: () => void };
  /** Slot opcional renderizado à direita do header (ex.: filtros, tabs). */
  headerRight?: ReactNode;
  /** Slot opcional renderizado à direita do corpo (ex.: card lateral de destaque). */
  asideRight?: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function PremiumCard({
  icon: Icon,
  title,
  subtitle,
  headerOrnament,
  children,
  footerNote,
  footerNoteIcon,
  footerCta,
  headerRight,
  asideRight,
  className,
  bodyClassName,
}: PremiumCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-sfb-baunilha shadow-[0_4px_24px_-8px_rgba(61,47,40,0.18)] ring-1 ring-sfb-areia/20",
        className
      )}
    >
      {/* HEADER TERRACOTTA */}
      <div className="relative bg-sfb-terracota text-sfb-baunilha">
        {headerOrnament && (
          <img
            src={headerOrnament}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 h-full w-auto max-w-[45%] object-contain object-right opacity-95"
          />
        )}
        <div className="relative flex items-start gap-3 px-5 py-4 sm:px-6 sm:py-5">
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ring-sfb-baunilha/40">
              <Icon className="h-5 w-5 text-sfb-baunilha" />
            </div>
          )}
          <div className="min-w-0 flex-1 pr-[40%] sm:pr-0">
            <h3 className="font-display text-xl leading-tight text-sfb-baunilha sm:text-2xl">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1 text-xs font-body text-sfb-baunilha/80 sm:text-sm">
                {subtitle}
              </p>
            )}
          </div>
          {headerRight && (
            <div className="relative ml-auto shrink-0">{headerRight}</div>
          )}
        </div>
      </div>

      {/* BODY BAUNILHA */}
      <div className={cn("flex flex-col gap-4 px-5 py-5 sm:px-6 sm:py-6 md:flex-row", bodyClassName)}>
        <div className="min-w-0 flex-1">{children}</div>
        {asideRight && (
          <div className="md:w-56 md:shrink-0">{asideRight}</div>
        )}
      </div>

      {/* FOOTER */}
      {(footerNote || footerCta) && (
        <div className="flex flex-col items-stretch gap-3 border-t border-sfb-areia/20 bg-sfb-areia/10 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {footerNote && (
            <div className="flex items-center gap-2 text-sm font-body italic text-sfb-cacau">
              {footerNoteIcon}
              <span>{footerNote}</span>
            </div>
          )}
          {footerCta && (
            <button
              type="button"
              onClick={footerCta.onClick}
              className="group inline-flex items-center justify-center gap-2 self-end rounded-full bg-sfb-terracota px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sfb-baunilha shadow-sm transition hover:bg-sfb-terracota/90 sm:self-auto"
            >
              {footerCta.label}
              <ArrowRight className="h-4 w-4 text-sfb-baunilha transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
