import { ReactNode } from "react";
import { ArrowRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumCardProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  /** Imagem decorativa (mantida para compatibilidade; renderizada sutilmente no canto). */
  headerOrnament?: string;
  /** Conteúdo principal renderizado no corpo. */
  children: ReactNode;
  /** Texto de nota no rodapé. */
  footerNote?: string;
  /** Emoji/ícone à esquerda da nota do rodapé. */
  footerNoteIcon?: ReactNode;
  /** CTA do rodapé (link discreto vinho com seta dourada). */
  footerCta?: { label: string; onClick: () => void };
  /** Slot opcional renderizado à direita do header. */
  headerRight?: ReactNode;
  /** Slot opcional renderizado à direita do corpo. */
  asideRight?: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/**
 * PremiumCard — linguagem minimalista Vinho Premium.
 * Sem header vinho carregado: fundo branco/creme, título serifa em vinho,
 * fio dourado fino abaixo do título e divisores hairline.
 */
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
        "relative overflow-hidden rounded-2xl bg-cda-branco border border-cda-vinho/10 shadow-[0_4px_24px_-12px_rgba(91,26,43,0.10)]",
        className
      )}
    >
      {/* Ornamento decorativo bem sutil — opacidade baixa, no canto */}
      {headerOrnament && (
        <img
          src={headerOrnament}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -top-6 h-28 w-auto select-none opacity-30"
        />
      )}

      {/* HEADER minimalista */}
      <div className="relative px-6 pt-6 pb-4 sm:px-7">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cda-vinho/15 bg-cda-creme">
              <Icon className="h-4 w-4 text-cda-vinho" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-xl leading-tight tracking-tight text-cda-vinho-escuro sm:text-2xl">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-0.5 font-body text-xs uppercase tracking-[0.18em] text-cda-vinho/50 sm:text-[11px]">
                {subtitle}
              </p>
            )}
          </div>
          {headerRight && (
            <div className="relative ml-auto shrink-0">{headerRight}</div>
          )}
        </div>
        {/* Fio dourado fino */}
        <div className="mt-3 h-px w-10 bg-cda-dourado/60" />
      </div>

      {/* BODY */}
      <div
        className={cn(
          "flex flex-col gap-4 px-6 pb-6 pt-2 sm:px-7 md:flex-row",
          bodyClassName
        )}
      >
        <div className="min-w-0 flex-1">{children}</div>
        {asideRight && <div className="md:w-56 md:shrink-0">{asideRight}</div>}
      </div>

      {/* FOOTER */}
      {(footerNote || footerCta) && (
        <div className="flex flex-col items-stretch gap-3 border-t border-cda-vinho/5 bg-cda-creme/40 px-6 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          {footerNote && (
            <div className="flex items-center gap-2 font-body text-xs italic text-cda-vinho/70">
              {footerNoteIcon}
              <span>{footerNote}</span>
            </div>
          )}
          {footerCta && (
            <button
              type="button"
              onClick={footerCta.onClick}
              className="group inline-flex items-center justify-center gap-2 self-end font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-cda-vinho transition hover:text-cda-dourado sm:self-auto"
            >
              {footerCta.label}
              <ArrowRight className="h-3.5 w-3.5 text-cda-dourado transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
