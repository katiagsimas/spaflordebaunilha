import { ResumoMes, formatBRL } from "@/hooks/useMeuSalario";
import { CENARIOS } from "@/pages/meu-salario/copy";
import { Heart, CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  resumo: ResumoMes;
}

export function CenarioResultado({ resumo }: Props) {
  const cfg = CENARIOS[resumo.cenario];
  const Icon = resumo.cenario === "abaixo" ? Heart : resumo.cenario === "equilibrio" ? CheckCircle2 : AlertCircle;

  const tomBg = {
    positivo: "bg-[hsl(var(--rd-creme))] border-[hsl(var(--rd-dourado))]",
    neutro: "bg-[hsl(var(--rd-creme))] border-[hsl(var(--rd-vinho)/0.3)]",
    atencao: "bg-[hsl(var(--rd-rose-queimado)/0.12)] border-[hsl(var(--rd-rose-queimado))]",
  }[cfg.tom];

  return (
    <div className={`rounded-2xl border-2 p-6 ${tomBg}`}>
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-white/60 p-3">
          <Icon className="h-6 w-6 text-[hsl(var(--rd-vinho))]" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[hsl(var(--rd-vinho))]">{cfg.titulo}</h3>
          <p className="text-sm text-[hsl(var(--rd-vinho)/0.85)] mt-2 leading-relaxed">{cfg.mensagem}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-[hsl(var(--rd-vinho)/0.6)]">Retirado: </span>
              <span className="font-semibold text-[hsl(var(--rd-vinho))]">{formatBRL(resumo.retiradas)}</span>
            </div>
            <div>
              <span className="text-[hsl(var(--rd-vinho)/0.6)]">Saudável: </span>
              <span className="font-semibold text-[hsl(var(--rd-vinho))]">{formatBRL(resumo.proLaboreSaudavel)}</span>
            </div>
            <div>
              <span className="text-[hsl(var(--rd-vinho)/0.6)]">
                {resumo.saldoRestante >= 0 ? "Saldo restante saudável: " : "Excedente: "}
              </span>
              <span className="font-semibold text-[hsl(var(--rd-vinho))]">{formatBRL(Math.abs(resumo.saldoRestante))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
