interface HeroBannerProps {
  /** Imported image asset (top decorative). */
  image: string;
  title: string;
  subtitle?: string;
  imageAlt?: string;
}

/**
 * Hero banner padronizado — layout vertical com imagem no topo.
 * Use em todas as páginas principais para harmonia visual.
 *
 * - Fundo rosado #FAEFEB, rounded-2xl, borda vinho/10, sombra suave
 * - Imagem decorativa no topo (h-24 sm:h-32 lg:h-40)
 * - Título Playfair Display em vinho escuro (#3D0F1C)
 * - Fio dourado + subtítulo itálico dourado (#C9A14A)
 */
export function HeroBanner({ image, title, subtitle, imageAlt = "" }: HeroBannerProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[#5B1A2B]/10 shadow-[0_4px_24px_-16px_rgba(91,26,43,0.18)]"
      style={{ background: "#FAEFEB" }}
    >
      <div className="flex flex-col items-center px-4 pt-4 pb-4 sm:px-6 sm:pt-6 sm:pb-6 lg:px-8 lg:pt-7 lg:pb-7">
        <img
          src={image}
          alt={imageAlt}
          aria-hidden={imageAlt ? undefined : "true"}
          className="pointer-events-none h-24 w-auto object-contain sm:h-32 lg:h-40"
        />
        <div className="mt-3 text-center sm:mt-4">
          <h1 className="font-display text-2xl font-normal leading-tight text-[#3D0F1C] sm:text-3xl lg:text-[36px]">
            {title}
          </h1>
          {subtitle && (
            <div className="mt-2 flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-[#C9A14A] sm:w-10" />
              <p className="text-xs italic text-[#C9A14A] sm:text-sm">{subtitle}</p>
              <span className="h-px w-8 bg-[#C9A14A] sm:w-10" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

