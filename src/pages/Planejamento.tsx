import { useState, useEffect } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, LineChart, Settings, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { usePlanejamento, type PrevisaoFaturamento } from "@/hooks/usePlanejamento";
import { gerarInsights, type Insight, type InsightType } from "@/utils/insightsGenerator";
import { PrevisaoFaturamentoCard } from "@/components/PrevisaoFaturamentoCard";
import { CMVGlobalCard } from "@/components/CMVGlobalCard";

const opcoes = [
  {
    title: "Ponto de Equilíbrio",
    description: "Em breve",
    icon: Target,
    color: "text-success bg-success/10",
    active: false,
    url: undefined,
  },
  {
    title: "Projeção de Vendas",
    description: "Em breve",
    icon: LineChart,
    color: "text-warning bg-warning/10",
    active: false,
    url: undefined,
  },
];

export default function Planejamento() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [previsaoData, setPrevisaoData] = useState<PrevisaoFaturamento | null>(null);

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
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Planejamento</h1>
          </div>
          <p className="text-base text-muted-foreground">
            Métricas e metas do seu negócio
          </p>
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-accent shadow-[0_4px_6px_rgba(216,155,140,0.3)] transition-all duration-200 hover:-translate-y-0.5">
              <Settings className="h-5 w-5 mr-2" />
              Configurar Metas
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Configurar Metas
              </DialogTitle>
              <DialogDescription>
                Em breve você poderá configurar suas metas financeiras mensais e anuais
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-center text-muted-foreground">
              <p>Funcionalidade em desenvolvimento</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Insights Section */}
      {insights.length > 0 && (
        <Card className="mb-6 border-l-4 border-l-primary bg-card shadow-soft">
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
                    className={`p-3 rounded-lg border-l-[3px] ${getInsightStyle(insight.type)}`}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card de Previsão de Faturamento */}
        {previsaoData && <PrevisaoFaturamentoCard dados={previsaoData} />}

        {/* Card de CMV Global */}
        <CMVGlobalCard />

        {/* Demais cards */}
        {opcoes.map((opcao) => {
          const Icon = opcao.icon;
          return (
            <Card
              key={opcao.title}
              className={`transition-all duration-200 ${
                opcao.active
                  ? "cursor-pointer hover:shadow-elevated hover:-translate-y-1"
                  : "opacity-60 cursor-not-allowed"
              }`}
              onClick={() => opcao.active && opcao.url && navigate(opcao.url)}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-12 h-12 rounded-lg ${opcao.color} flex items-center justify-center`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  {!opcao.active && (
                    <Badge className="bg-warning text-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                      Em breve
                    </Badge>
                  )}
                </div>
                <CardTitle>{opcao.title}</CardTitle>
                <CardDescription>{opcao.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Footer com legenda */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Clique nos cards ativos para acessar as ferramentas de análise</p>
      </div>
    </div>
  );
}
