import { useNavigate } from "react-router-dom";
import { FileSignature, ScrollText, LayoutList, CheckCircle2, Coins, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { usePropostas } from "@/hooks/usePropostas";
import { useContratos } from "@/hooks/useContratos";
import negociacoesHero from "@/assets/negociacoes-hero.png";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Negociacoes() {
  const navigate = useNavigate();
  const { stats: propostasStats } = usePropostas();
  const { stats: contratosStats } = useContratos();

  const sP = propostasStats.data;
  const sC = contratosStats.data;

  const totalPropostas = sP?.total ?? 0;
  const totalContratos = sC?.total ?? 0;
  const aceitas = sP?.aceita ?? 0;
  const conversao = totalPropostas > 0 ? Math.round((aceitas / totalPropostas) * 100) : 0;
  const valorNegociado = (sP?.valor_total_aceitas ?? 0) + (sC?.valor_total ?? 0);

  const kpis = [
    { label: "Propostas", value: totalPropostas, sub: "Em andamento", icon: FileSignature },
    { label: "Contratos", value: totalContratos, sub: "Ativos", icon: ScrollText },
    { label: "Conversões", value: `${conversao}%`, sub: "Taxa de fechamento", icon: TrendingUp },
    { label: "Valor Negociado", value: brl(valorNegociado), sub: "Acumulado", icon: Coins },
  ];

  const cards = [
    {
      title: "Propostas",
      description: "Crie e gerencie orçamentos para os seus clientes.",
      icon: FileSignature,
      to: "/comercial/propostas",
    },
    {
      title: "Contratos",
      description: "Gere contratos a partir de modelos prontos e acompanhe assinaturas.",
      icon: ScrollText,
      to: "/comercial/contratos",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFF9F5] pb-24">
      <div className="container mx-auto p-6 space-y-6">
        {/* ===== HEADER PREMIUM ===== */}
        <div
          className="relative overflow-hidden rounded-2xl border border-[#5B1A2B]/10 shadow-[0_4px_24px_-16px_rgba(91,26,43,0.18)]"
          style={{ background: "#FAEFEB" }}
        >
          <div className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl font-normal leading-tight text-[#3D0F1C] sm:text-3xl lg:text-[36px]">
                Negociações
              </h1>
              <div className="mt-2 flex items-center gap-3">
                <span className="h-px w-8 bg-[#C9A14A] sm:w-10" />
                <p className="text-xs italic text-[#C9A14A] sm:text-sm">
                  Acompanhe suas negociações do início ao fechamento.
                </p>
              </div>
            </div>
            <img
              src={negociacoesHero}
              alt=""
              aria-hidden="true"
              className="pointer-events-none h-20 w-auto shrink-0 object-contain object-right sm:h-28 lg:h-[150px]"
            />
          </div>
        </div>


        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card
                key={kpi.label}
                className="rounded-2xl border border-cda-dourado/20 bg-cda-branco shadow-[0_4px_18px_-10px_rgba(91,26,43,0.15)]"
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="h-11 w-11 shrink-0 rounded-full flex items-center justify-center ring-1 ring-cda-dourado/40 bg-cda-dourado/15 text-cda-vinho">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide font-body text-cda-vinho/60">
                      {kpi.label}
                    </p>
                    <p className="font-display text-xl text-cda-vinho-escuro mt-0.5 truncate">
                      {kpi.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{kpi.sub}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Cards de navegação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.to}
                onClick={() => navigate(c.to)}
                className="group text-left bg-white border border-[#5B1A2B]/10 rounded-xl p-5 transition-all duration-200 hover:border-[#C9A14A]/50 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="w-[52px] h-[52px] rounded-full bg-[#FDF6EE] flex items-center justify-center shrink-0">
                    <Icon className="h-6 w-6 text-[#5B1A2B]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[15px] font-semibold text-[#3D0F1C] leading-tight">
                      {c.title}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">{c.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
