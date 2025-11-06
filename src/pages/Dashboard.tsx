import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { DollarSign, ShoppingBag, Factory, Calendar, Loader2 } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { KPICard } from '@/components/dashboard/KPICard';
import { AlertBanner } from '@/components/dashboard/AlertBanner';
import { GraficoFinanceiro } from '@/components/dashboard/GraficoFinanceiro';
import { WidgetEntregas } from '@/components/dashboard/WidgetEntregas';
import { WidgetAniversariantes } from '@/components/dashboard/WidgetAniversariantes';

export default function Dashboard() {
  const navigate = useNavigate();
  const { kpis, alerts, entregas, aniversariantes, graficoData, isLoading } = useDashboardData();

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const dataAtual = format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });

  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground capitalize">{dataAtual}</p>
      </div>

      {/* Alertas */}
      {alerts && alerts.total > 0 && (
        <AlertBanner alertas={alerts.alertas} />
      )}

      {/* Grid de KPIs */}
      {kpis && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            titulo="Saldo Atual"
            valor={formatarMoeda(kpis.financeiro.saldo_atual)}
            icone={<DollarSign className="h-6 w-6" />}
            variacao={kpis.financeiro.variacao_percentual}
            corVariacao={kpis.financeiro.variacao_percentual >= 0 ? 'positiva' : 'negativa'}
            onClick={() => navigate('/financeiro/fluxo-caixa')}
          />

          <KPICard
            titulo="Encomendas Ativas"
            valor={kpis.encomendas.total_ativas}
            icone={<ShoppingBag className="h-6 w-6" />}
            subtitulo={`${kpis.encomendas.urgentes} urgente(s)`}
            onClick={() => navigate('/encomendas')}
          />

          <KPICard
            titulo="Produção Hoje"
            valor={kpis.producao.tarefas_hoje}
            icone={<Factory className="h-6 w-6" />}
            subtitulo={`${kpis.producao.urgentes} pendente(s)`}
            onClick={() => navigate('/producao')}
          />

          <KPICard
            titulo="Data Atual"
            valor={format(new Date(), 'dd', { locale: ptBR })}
            icone={<Calendar className="h-6 w-6" />}
            subtitulo={format(new Date(), 'MMMM yyyy', { locale: ptBR })}
          />
        </div>
      )}

      {/* Gráfico Financeiro */}
      {graficoData.length > 0 && (
        <GraficoFinanceiro dados={graficoData} />
      )}

      {/* Widgets Inferiores */}
      <div className="grid gap-4 md:grid-cols-2">
        <WidgetEntregas entregas={entregas} />
        <WidgetAniversariantes aniversariantes={aniversariantes} />
      </div>
    </div>
  );
}
