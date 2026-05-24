import { ResumoMes } from "@/hooks/useMeuSalario";
import { formatBRL } from "@/lib/formatUtils";
import { TrendingUp, Wallet, Shield, Sparkles } from "lucide-react";

interface Props {
  resumo: ResumoMes;
}

export function CardResumoMes({ resumo }: Props) {
  const items = [
    { label: "Faturamento", valor: resumo.faturamento, icon: TrendingUp, hint: "Entrou no mês" },
    { label: "Custos", valor: resumo.custos, icon: Wallet, hint: "Saiu para sustentar a operação" },
    { label: "Margem de segurança (20%)", valor: resumo.margemSeguranca, icon: Shield, hint: "Sua reserva e respiro" },
    { label: "Pró-labore saudável", valor: resumo.proLaboreSaudavel, icon: Sparkles, hint: "Quanto você pode retirar com tranquilidade", destaque: true },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <div
            key={it.label}
            className={`rounded-2xl p-5 border bg-[hsl(var(--rd-creme))] ${
              it.destaque
                ? "border-[hsl(var(--rd-dourado))] shadow-[0_4px_20px_-8px_hsl(var(--rd-dourado)/0.5)]"
                : "border-[hsl(var(--rd-dourado)/0.3)]"
            }`}
          >
            <div className="flex items-center gap-2 text-[hsl(var(--rd-vinho))] mb-2">
              <Icon className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider font-medium">{it.label}</span>
            </div>
            <div
              className={`font-semibold text-[hsl(var(--rd-vinho))] ${
                it.destaque ? "text-3xl" : "text-2xl"
              }`}
            >
              {formatBRL(it.valor)}
            </div>
            <p className="text-xs text-[hsl(var(--rd-vinho)/0.65)] mt-2 italic">{it.hint}</p>
          </div>
        );
      })}
    </div>
  );
}
