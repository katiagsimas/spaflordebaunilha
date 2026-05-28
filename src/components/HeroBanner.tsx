interface HeroBannerProps {
  /** Imported image asset (top decorative). Pass undefined to hide image. */
  image?: string;
  title: string;
  subtitle?: string;
  imageAlt?: string;
  /** Custom card background color. Defaults to #FAEFEB. */
  bgColor?: string;
}


/**
 * Hero banner padronizado — layout vertical com imagem no topo.
 * Use em todas as páginas principais para harmonia visual.
 *
 * - Fundo rosado #FAEFEB (customizável via bgColor), rounded-2xl, borda vinho/10, sombra suave
 * - Imagem decorativa no topo (h-24 sm:h-32 lg:h-40)
 * - Título Playfair Display em vinho escuro (#3D0F1C)
 * - Fio dourado + subtítulo itálico dourado (#C9A14A)
 */
export function HeroBanner({ image, title, subtitle, imageAlt = "", bgColor = "#FAEFEB" }: HeroBannerProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[#5B1A2B]/10 shadow-[0_4px_24px_-16px_rgba(91,26,43,0.18)]"
      style={{ background: bgColor }}
    >
      <div className="flex flex-col items-start px-4 pt-3 pb-0 sm:px-6 sm:pt-4 lg:px-8 lg:pt-5">

        <div className="text-left">
          <h1 className="font-display text-2xl font-normal leading-tight text-[#3D0F1C] sm:text-3xl lg:text-[36px]">
            {title}
          </h1>
          {subtitle && (
            <div className="mt-1 flex items-center gap-3">
              <span className="h-px w-8 bg-[#C9A14A] sm:w-10" />
              <p className="text-xs italic text-[#C9A14A] sm:text-sm">{subtitle}</p>
            </div>
          )}
        </div>
        {image && (
          <img
            src={image}
            alt={imageAlt}
            className="pointer-events-none mt-0 h-28 w-auto self-center object-contain object-bottom sm:h-36 lg:h-44"
            aria-hidden={imageAlt ? undefined : "true"}
          />
        )}

      </div>

    </div>
  );
}
  );
}

