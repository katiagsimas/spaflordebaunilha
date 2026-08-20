import { EDUCATIVO } from "./copy";
import { Sparkles } from "lucide-react";

export function Educativo() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-sfb-cacau">Conversa franca sobre dinheiro</h2>
        <p className="text-sm text-sfb-cacau/70 mt-1">
          Pequenas verdades que mudam a forma como você enxerga seu negócio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EDUCATIVO.map((item) => (
          <div
            key={item.titulo}
            className="rounded-2xl border border-sfb-areia/30 bg-white p-5 shadow-[0_2px_12px_-6px_rgba(91,26,43,0.1)]"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-sfb-terracota" />
              <h3 className="font-semibold text-sfb-cacau">{item.titulo}</h3>
            </div>
            <p className="text-sm text-sfb-cacau/80 leading-relaxed">{item.texto}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
