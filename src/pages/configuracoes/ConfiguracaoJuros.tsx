import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ConfiguracaoJuros from '@/components/configuracoes/ConfiguracaoJuros';
import { PageHeader } from '@/components/PageHeader';
import { BackButton } from '@/components/BackButton';

export default function ConfiguracaoJurosPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background px-4 md:px-6 pt-1 pb-4 md:pb-6 space-y-6">
      {/* Navegação superior */}
      <div className="flex items-center justify-between">
        <BackButton to="/financeiro/cadastros" />
        <Button
          variant="ghost"
          onClick={() => navigate('/financeiro/cadastros/plano-contas')}
          className="gap-2 text-muted-foreground hover:text-foreground font-body"
        >
          <ArrowLeft className="h-4 w-4" />
          Plano de Contas
        </Button>
      </div>

      <PageHeader
        title="Configuração de Juros e Multas"
        description="Defina como calcular juros para pagamentos em atraso"
      />

      <ConfiguracaoJuros />
    </div>
  );
}