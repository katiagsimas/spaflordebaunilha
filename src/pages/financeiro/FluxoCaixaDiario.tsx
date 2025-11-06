import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { DashboardFluxoCaixa } from '@/components/financeiro/DashboardFluxoCaixa';
import { GraficoProjecao } from '@/components/financeiro/GraficoProjecao';
import { MovimentacoesFuturas } from '@/components/financeiro/MovimentacoesFuturas';
import { useFluxoCaixaIntegrado } from '@/hooks/useFluxoCaixaIntegrado';
import { RefreshCw } from 'lucide-react';

export default function FluxoCaixaDiario() {
  const { projecoes, isLoading, refetch } = useFluxoCaixaIntegrado();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Fluxo de Caixa"
        description="Projeções, alertas e movimentações futuras"
        actions={
          <Button onClick={refetch} variant="outline" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        }
      />

      {/* Seção 1: Dashboard */}
      <DashboardFluxoCaixa />

      {/* Seção 2: Gráfico */}
      <GraficoProjecao dados={projecoes} />

      {/* Seção 3: Movimentações Futuras */}
      <MovimentacoesFuturas />
    </div>
  );
}
