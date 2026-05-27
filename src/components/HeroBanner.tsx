interface HeroBannerProps {
  /** Imported image asset (right-side decorative). */
  image: string;
  title: string;
  subtitle?: string;
  imageAlt?: string;
}

/**
 * Hero banner padronizado — mesmo layout do topo da página Encomendas.
 * Use em todas as páginas principais para harmonia visual.
 *
 * - Fundo rosado #FAEFEB, rounded-2xl, borda vinho/10, sombra suave
 * - Título Playfair Display em vinho escuro (#3D0F1C)
 * - Fio dourado + subtítulo itálico dourado (#C9A14A)
 * - Imagem decorativa à direita (h-20 sm:h-28 lg:h-[150px])
 */
export function HeroBanner({ image, title, subtitle, imageAlt = "" }: HeroBannerProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[#5B1A2B]/10 shadow-[0_4px_24px_-16px_rgba(91,26,43,0.18)]"
      style={{ background: "#FAEFEB" }}
    >
      <div className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-normal leading-tight text-[#3D0F1C] sm:text-3xl lg:text-[36px]">
            {title}
          </h1>
          {subtitle && (
            <div className="mt-2 flex items-center gap-3">
              <span className="h-px w-8 bg-[#C9A14A] sm:w-10" />
              <p className="text-xs italic text-[#C9A14A] sm:text-sm">{subtitle}</p>
            </div>
          )}
        </div>
        <img
          src={image}
          alt={imageAlt}
          aria-hidden={imageAlt ? undefined : "true"}
          className="pointer-events-none h-20 w-auto shrink-0 object-contain object-right sm:h-28 lg:h-[150px]"
        />
      </div>
    </div>
  );
}
