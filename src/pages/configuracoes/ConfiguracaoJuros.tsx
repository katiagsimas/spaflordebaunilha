import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import ConfiguracaoJuros from '@/components/configuracoes/ConfiguracaoJuros';
import { PageHeader } from '@/components/PageHeader';
import { BackButton } from '@/components/BackButton';

export default function ConfiguracaoJurosPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <PageHeader
        title="Configuração de Juros e Multas"
        description="Defina como calcular juros para pagamentos em atraso"
        backButton={<BackButton to="/financeiro/cadastros" />}
        actions={
          <Button
            variant="ghost"
            onClick={() => navigate('/financeiro/cadastros/plano-contas')}
            className="gap-2 text-muted-foreground hover:text-foreground font-body"
          >
            <ArrowRight className="h-4 w-4" />
            Plano de Contas
          </Button>
        }
      />

      <ConfiguracaoJuros />
    </div>
  );
}
