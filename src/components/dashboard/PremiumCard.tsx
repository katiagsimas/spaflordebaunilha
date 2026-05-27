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
        "relative overflow-hidden rounded-2xl bg-cda-creme shadow-[0_4px_24px_-8px_rgba(91,26,43,0.18)] ring-1 ring-cda-dourado/20",
        className
      )}
    >
      {/* HEADER VINHO */}
      <div className="relative bg-cda-vinho text-cda-creme">
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ring-cda-dourado/60">
              <Icon className="h-5 w-5 text-cda-dourado" />
            </div>
          )}
          <div className="min-w-0 flex-1 pr-[40%] sm:pr-0">
            <h3 className="font-display text-xl leading-tight text-cda-creme sm:text-2xl">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1 text-xs font-body text-cda-dourado/90 sm:text-sm">
                {subtitle}
              </p>
            )}
          </div>
          {headerRight && (
            <div className="relative ml-auto shrink-0">{headerRight}</div>
          )}
        </div>
      </div>

      {/* BODY CREME */}
      <div className={cn("flex flex-col gap-4 px-5 py-5 sm:px-6 sm:py-6 md:flex-row", bodyClassName)}>
        <div className="min-w-0 flex-1">{children}</div>
        {asideRight && (
          <div className="md:w-56 md:shrink-0">{asideRight}</div>
        )}
      </div>

      {/* FOOTER */}
      {(footerNote || footerCta) && (
        <div className="flex flex-col items-stretch gap-3 border-t border-cda-dourado/20 bg-cda-pink/10 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {footerNote && (
            <div className="flex items-center gap-2 text-sm font-body italic text-cda-vinho">
              {footerNoteIcon}
              <span>{footerNote}</span>
            </div>
          )}
          {footerCta && (
            <button
              type="button"
              onClick={footerCta.onClick}
              className="group inline-flex items-center justify-center gap-2 self-end rounded-full bg-cda-vinho px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cda-creme shadow-sm transition hover:bg-cda-vinho-escuro sm:self-auto"
            >
              {footerCta.label}
              <ArrowRight className="h-4 w-4 text-cda-dourado transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
