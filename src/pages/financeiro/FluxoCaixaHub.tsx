import { useNavigate } from 'react-router-dom';
import { Calendar, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { TileCard } from '@/components/TileCard';
import { BackButton } from '@/components/BackButton';
import { FinanceiroNav } from '@/components/financeiro/FinanceiroNav';

export default function FluxoCaixaHub() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Fluxo de Caixa"
        description="Escolha o relatório que conta a história do seu dinheiro."
        backButton={
          <div className="flex flex-wrap items-center gap-2">
            <BackButton to="/financeiro" />
            <FinanceiroNav current="/financeiro/fluxo-caixa" />
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl">
        <TileCard
          icon={Calendar}
          title="Fluxo Diário"
          description="Movimentações do mês, dia a dia."
          tone="vinho"
          onClick={() => navigate('/financeiro/fluxo-caixa/diario')}
        />
        <TileCard
          icon={DollarSign}
          title="Fluxo Mensal"
          description="Visão comparativa mensal completa."
          tone="dourado"
          onClick={() => navigate('/financeiro/fluxo-caixa/mensal')}
        />
      </div>
    </div>
  );
}
