import { useState, useEffect } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Settings, Lightbulb, DollarSign, TrendingUp, CalendarDays, ListChecks, HeartPulse, Sparkles, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePlanejamento, type PrevisaoFaturamento } from "@/hooks/usePlanejamento";
import { gerarInsights, type Insight, type InsightType } from "@/utils/insightsGenerator";
import { PrevisaoFaturamentoCard } from "@/components/PrevisaoFaturamentoCard";
import { ProjecaoVendasCard } from "@/components/ProjecaoVendasCard";
import { ConfigurarMetasModal } from "@/components/ConfigurarMetasModal";
import { BannerBoasVindas, EstadoVazioCard } from "@/components/EstadoVazio";
import { useUserProfile } from "@/hooks/useUserProfile";
import { PlanejamentoCalendario } from "@/pages/planejamento/PlanejamentoCalendario";
import { PlanejamentoTarefas } from "@/pages/planejamento/PlanejamentoTarefas";
import { PlanejamentoBemEstar } from "@/pages/planejamento/PlanejamentoBemEstar";
import { useOpenPlannerDoce } from "@/hooks/useOpenPlannerDoce";
import { usePlano } from "@/hooks/usePlano";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const opcoes: any[] = [];

export default function Planejamento() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "calendario";
  const [modalOpen, setModalOpen] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [previsaoData, setPrevisaoData] = useState<PrevisaoFaturamento | null>(null);
  const { profile } = useUserProfile();
  const { plano } = usePlano();
  const { isAdmin } = useIsAdmin();
  const { abrir: abrirPlannerDoce, loading: loadingSsoDoce } = useOpenPlannerDoce();
  const podeAcessarPlanejamentoDoce =
    plano?.id === "negocio" || plano?.id === "aluna_imersao" || isAdmin;

  const temConfiguracao = profile?.meta_faturamento_mensal && profile.meta_faturamento_mensal > 0;

  const {
    config,
    calcularPrevisaoFaturamento,
    calcularPrevisaoFaturamentoCompleta,
    calcularFaturamentoMesAnterior,
    calcularProjecaoVendas,
  } = usePlanejamento();

  useEffect(() => {
    const previsao = calcularPrevisaoFaturamento();
    const previsaoCompleta = calcularPrevisaoFaturamentoCompleta();
    const faturamentoAnterior = calcularFaturamentoMesAnterior();
    const projecao = calcularProjecaoVendas();
    setPrevisaoData(previsaoCompleta);
    const insightsGerados = gerarInsights({
      metaFaturamentoMensal: config.metaFaturamentoMensal,
      previsaoFaturamento: previsao,
      faturamentoMesAnterior: faturamentoAnterior,
      projecaoVendas: projecao.projecao,
    });
    setInsights(insightsGerados);
  }, [config]);

  const getInsightStyle = (type: InsightType) => {
    switch (type) {
      case "success": return "bg-success/10 border-l-success";
      case "warning": return "bg-warning/10 border-l-warning";
      case "critical": return "bg-error/10 border-l-error";
      case "info": return "bg-secondary border-l-primary";
      default: return "bg-muted border-l-muted-foreground";
    }
  };

  const getInsightIconColor = (type: InsightType) => {
    switch (type) {
      case "success": return "text-success";
      case "warning": return "text-warning";
      case "critical": return "text-error";
      case "info": return "text-primary";
      default: return "text-muted-foreground";
    }
  };

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-6 w-6 text-cda-dourado" />
            <h1 className="text-3xl font-bold text-foreground">Meu Planejamento</h1>
          </div>
          <p className="text-base text-muted-foreground">
            Organize sua confeitaria com estratégia e equilíbrio
          </p>
        </div>
      </div>

      {/* Planejamento DOCE (SSO) */}
      {podeAcessarPlanejamentoDoce && (
        <Card className="mb-6 border-2 border-cda-dourado/40 bg-gradient-to-br from-cda-vinho to-cda-vinho-escuro text-cda-creme shadow-soft overflow-hidden animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 md:p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-cda-dourado/20 p-3 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-cda-dourado" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg md:text-xl font-bold text-cda-creme">Planejamento DOCE</h2>
                  <Badge className="bg-cda-dourado text-cda-preto hover:bg-cda-dourado/90 border-0">Estratégia</Badge>
                </div>
                <p className="text-sm text-cda-creme/80 max-w-xl">
                  Acesse seu planejamento anual e campanhas estratégicas.
                </p>
              </div>
            </div>
            <Button
              onClick={abrirPlannerDoce}
              disabled={loadingSsoDoce}
              aria-label="Abrir Planejamento DOCE"
              aria-busy={loadingSsoDoce}
              className="bg-cda-dourado hover:bg-cda-dourado/90 text-cda-preto font-semibold shrink-0"
            >
              {loadingSsoDoce ? "Abrindo..." : (
                <>
                  Abrir Planejamento DOCE
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-12">
          <TabsTrigger value="calendario" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Calendário</span>
          </TabsTrigger>
          <TabsTrigger value="metas" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Metas</span>
          </TabsTrigger>
          <TabsTrigger value="tarefas" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <ListChecks className="h-4 w-4" />
            <span className="hidden sm:inline">Tarefas</span>
          </TabsTrigger>
          <TabsTrigger value="bem-estar" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <HeartPulse className="h-4 w-4" />
            <span className="hidden sm:inline">Bem-Estar</span>
          </TabsTrigger>
        </TabsList>

        {/* Calendário */}
        <TabsContent value="calendario">
          <PlanejamentoCalendario />
        </TabsContent>

        {/* Metas (conteúdo existente) */}
        <TabsContent value="metas">
          {/* Banner de Boas-Vindas */}
          {!temConfiguracao && (
            <BannerBoasVindas onConfigurar={() => setModalOpen(true)} />
          )}

          <div className="flex justify-end mb-4">
            <Button
              className="bg-cda-dourado hover:bg-cda-dourado/90 text-white"
              onClick={() => setModalOpen(true)}
            >
              <Settings className="h-5 w-5 mr-2" />
              Configurar Metas
            </Button>
          </div>

          <ConfigurarMetasModal open={modalOpen} onOpenChange={setModalOpen} />

          {/* Insights */}
          {temConfiguracao && insights.length > 0 && (
            <Card className="mb-6 border-l-4 border-l-cda-dourado bg-card shadow-soft animate-fade-in">
              <CardHeader>
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="h-5 w-5 text-cda-dourado" />
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

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {temConfiguracao ? (
              <>
                {previsaoData && (
                  <div className="animate-fade-in-up">
                    <PrevisaoFaturamentoCard dados={previsaoData} />
                  </div>
                )}
                <div className="animate-fade-in-up">
                  <ProjecaoVendasCard />
                </div>
              </>
            ) : (
              <>
                <EstadoVazioCard
                  titulo="💰 PREVISÃO DE FATURAMENTO"
                  icone={<DollarSign className="h-6 w-6 text-cda-dourado" />}
                  onConfigurar={() => setModalOpen(true)}
                />
                <EstadoVazioCard
                  titulo="📈 PROJEÇÃO DE VENDAS"
                  icone={<TrendingUp className="h-6 w-6 text-warning" />}
                  onConfigurar={() => setModalOpen(true)}
                />
              </>
            )}
          </div>
        </TabsContent>

        {/* Tarefas */}
        <TabsContent value="tarefas">
          <PlanejamentoTarefas />
        </TabsContent>

        {/* Bem-Estar */}
        <TabsContent value="bem-estar">
          <PlanejamentoBemEstar />
        </TabsContent>
      </Tabs>
    </div>
  );
}
