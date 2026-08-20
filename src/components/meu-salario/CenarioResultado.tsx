import { ResumoMes } from "@/hooks/useMeuSalario";
import { formatBRL } from "@/lib/formatUtils";
import { CENARIOS } from "@/pages/meu-salario/copy";
import { Heart, CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  resumo: ResumoMes;
}

export function CenarioResultado({ resumo }: Props) {
  const cfg = CENARIOS[resumo.cenario];
  const Icon = resumo.cenario === "abaixo" ? Heart : resumo.cenario === "equilibrio" ? CheckCircle2 : AlertCircle;

  const tomBg = {
    positivo: "bg-sfb-baunilha border-sfb-terracota",
    neutro: "bg-sfb-baunilha border-sfb-cacau/30",
    atencao: "bg-sfb-terracota/10 border-sfb-terracota",
  }[cfg.tom];

  return (
    <div className={`rounded-2xl border-2 p-6 ${tomBg}`}>
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-white/60 p-3">
          <Icon className="h-6 w-6 text-sfb-cacau" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-sfb-cacau">{cfg.titulo}</h3>
          <p className="text-sm text-sfb-cacau/85 mt-2 leading-relaxed">{cfg.mensagem}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-sfb-cacau/60">Retirado: </span>
              <span className="font-semibold text-sfb-cacau">{formatBRL(resumo.retiradas)}</span>
            </div>
            <div>
              <span className="text-sfb-cacau/60">Saudável: </span>
              <span className="font-semibold text-sfb-cacau">{formatBRL(resumo.proLaboreSaudavel)}</span>
            </div>
            <div>
              <span className="text-sfb-cacau/60">
                {resumo.saldoRestante >= 0 ? "Saldo restante saudável: " : "Excedente: "}
              </span>
              <span className="font-semibold text-sfb-cacau">{formatBRL(Math.abs(resumo.saldoRestante))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
