import { useState, useEffect } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Settings, Lightbulb, DollarSign, TrendingUp, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePlanejamento, type PrevisaoFaturamento } from "@/hooks/usePlanejamento";
import { gerarInsights, type Insight, type InsightType } from "@/utils/insightsGenerator";
import { PrevisaoFaturamentoCard } from "@/components/PrevisaoFaturamentoCard";
import { CMVGlobalCard } from "@/components/CMVGlobalCard";
import { ProjecaoVendasCard } from "@/components/ProjecaoVendasCard";
import { ConfigurarMetasModal } from "@/components/ConfigurarMetasModal";
import { BannerBoasVindas, EstadoVazioCard } from "@/components/EstadoVazio";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const opcoes = [
  {
    title: "Ponto de Equilíbrio",
    description: "Em breve",
    icon: Target,
    color: "text-success bg-success/10",
    active: false,
    url: undefined,
  },
];

export default function Planejamento() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [previsaoData, setPrevisaoData] = useState<PrevisaoFaturamento | null>(null);

  const [hasConfig] = useLocalStorage("configuracaoPlanejamento", null);
  const temConfiguracao = hasConfig !== null && (hasConfig as any).metaFaturamentoMensal > 0;

  const {
    config,
    calcularPrevisaoFaturamento,
    calcularPrevisaoFaturamentoCompleta,
    calcularCMVGlobal,
    calcularPontoEquilibrio,
    calcularFaturamentoMesAnterior,
    calcularProjecaoVendas,
  } = usePlanejamento();

  useEffect(() => {
    const previsao = calcularPrevisaoFaturamento();
    const previsaoCompleta = calcularPrevisaoFaturamentoCompleta();
    const cmvData = calcularCMVGlobal();
    const pontoEquilibrio = calcularPontoEquilibrio();
    const faturamentoAnterior = calcularFaturamentoMesAnterior();
    const projecao = calcularProjecaoVendas();

    setPrevisaoData(previsaoCompleta);

    const insightsGerados = gerarInsights({
      metaFaturamentoMensal: config.metaFaturamentoMensal,
      previsaoFaturamento: previsao,
      cmvPercentual: cmvData.cmv,
      alertaCMV: config.alertaCMV,
      pontoEquilibrio: pontoEquilibrio.valor,
      faturamentoMesAnterior: faturamentoAnterior,
      projecaoVendas: projecao.projecao,
    });

    setInsights(insightsGerados);
  }, [config]);

  const getInsightStyle = (type: InsightType) => {
    switch (type) {
      case "success":
        return "bg-success/10 border-l-success";
      case "warning":
        return "bg-warning/10 border-l-warning";
      case "critical":
        return "bg-error/10 border-l-error";
      case "info":
        return "bg-secondary border-l-primary";
      default:
        return "bg-muted border-l-muted-foreground";
    }
  };

  const getInsightIconColor = (type: InsightType) => {
    switch (type) {
      case "success":
        return "text-success";
      case "warning":
        return "text-warning";
      case "critical":
        return "text-error";
      case "info":
        return "text-primary";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Banner de Boas-Vindas */}
      {!temConfiguracao && (
        <BannerBoasVindas onConfigurar={() => setModalOpen(true)} />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Planejamento</h1>
          </div>
          <p className="text-base text-muted-foreground">
          Métricas e metas do seu negócio
        </p>
      </div>

      <Button 
        className="bg-primary text-primary-foreground hover:bg-accent shadow-[0_4px_6px_rgba(216,155,140,0.3)] transition-all duration-200 hover:-translate-y-0.5"
        onClick={() => setModalOpen(true)}
      >
        <Settings className="h-5 w-5 mr-2" />
        Configurar Metas
      </Button>
    </div>

      <ConfigurarMetasModal open={modalOpen} onOpenChange={setModalOpen} />

      {/* Insights Section */}
      {temConfiguracao && insights.length > 0 && (
        <Card className="mb-6 border-l-4 border-l-primary bg-card shadow-soft animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                💡 INSIGHTS DO MÊS
              </h2>
            </div>
            <div className="space-y-2">
              {insights.map((insight, index) => {
                const Icon = insight.icon;
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-l-[3px] ${getInsightStyle(insight.type)} animate-slide-in-left stagger-${Math.min(index + 1, 4)}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${getInsightIconColor(insight.type)}`} />
                      <p className="text-sm text-foreground">{insight.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {temConfiguracao ? (
          <>
            {/* Cards com dados */}
            {previsaoData && (
              <div className="animate-fade-in-up">
                <PrevisaoFaturamentoCard dados={previsaoData} />
              </div>
            )}

            <div className="animate-fade-in-up stagger-1">
              <CMVGlobalCard />
            </div>

            <div className="animate-fade-in-up stagger-2">
              <ProjecaoVendasCard />
            </div>

            {opcoes.map((opcao, index) => {
              const Icon = opcao.icon;
              return (
                <Card
                  key={opcao.title}
                  className={`transition-all duration-200 animate-fade-in-up stagger-${index + 3} ${
                    opcao.active
                      ? "cursor-pointer hover:shadow-elevated hover:-translate-y-1"
                      : "opacity-60 cursor-not-allowed"
                  }`}
                  onClick={() => opcao.active && opcao.url && navigate(opcao.url)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-lg ${opcao.color} flex items-center justify-center`}
                      >
                        <Icon className="h-5 w-5 md:h-6 md:w-6" />
                      </div>
                      {!opcao.active && (
                        <Badge className="bg-warning text-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                          Em breve
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg md:text-2xl">{opcao.title}</CardTitle>
                    <CardDescription>{opcao.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </>
        ) : (
          <>
            {/* Estado vazio - Cards com CTA para configurar */}
            <EstadoVazioCard
              titulo="💰 PREVISÃO DE FATURAMENTO"
              icone={<DollarSign className="h-6 w-6 text-primary" />}
              onConfigurar={() => setModalOpen(true)}
            />

            <EstadoVazioCard
              titulo="🧮 CMV GLOBAL"
              icone={<BarChart3 className="h-6 w-6 text-accent" />}
              onConfigurar={() => setModalOpen(true)}
            />

            <EstadoVazioCard
              titulo="📈 PROJEÇÃO DE VENDAS"
              icone={<TrendingUp className="h-6 w-6 text-warning" />}
              onConfigurar={() => setModalOpen(true)}
            />

            <EstadoVazioCard
              titulo="⚖️ PONTO DE EQUILÍBRIO"
              icone={<Target className="h-6 w-6 text-success" />}
              onConfigurar={() => setModalOpen(true)}
            />
          </>
        )}
      </div>

      {/* Footer com legenda */}
      {temConfiguracao && (
        <div className="mt-8 text-center text-sm text-muted-foreground animate-fade-in">
          <p>Clique nos cards ativos para acessar as ferramentas de análise</p>
        </div>
      )}
    </div>
  );
}
