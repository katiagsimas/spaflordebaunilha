import { EDUCATIVO } from "./copy";
import { Sparkles } from "lucide-react";

export function Educativo() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[hsl(var(--rd-vinho))]">Conversa franca sobre dinheiro</h2>
        <p className="text-sm text-[hsl(var(--rd-vinho)/0.7)] mt-1">
          Pequenas verdades que mudam a forma como você enxerga sua confeitaria.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EDUCATIVO.map((item) => (
          <div
            key={item.titulo}
            className="rounded-2xl border border-[hsl(var(--rd-dourado)/0.3)] bg-[hsl(var(--rd-creme))] p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-[hsl(var(--rd-dourado))]" />
              <h3 className="font-semibold text-[hsl(var(--rd-vinho))]">{item.titulo}</h3>
            </div>
            <p className="text-sm text-[hsl(var(--rd-vinho)/0.8)] leading-relaxed">{item.texto}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
