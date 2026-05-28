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
      <div className="flex flex-col items-start px-4 pt-4 pb-0 sm:px-6 sm:pt-5 lg:px-8 lg:pt-6">
        <div className="text-left">
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
        {image && (
          <img
            src={image}
            alt={imageAlt}
            aria-hidden={imageAlt ? undefined : "true"}
            className="pointer-events-none mt-1 h-16 w-auto self-center object-contain object-bottom sm:mt-1.5 sm:h-20 lg:h-24"
          />
        )}

      </div>

    </div>
  );
}

