import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import ConfiguracaoJuros from '@/components/configuracoes/ConfiguracaoJuros';

export default function ConfiguracaoJurosPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/configuracoes')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Configuração de Juros e Multas</h1>
          <p className="text-muted-foreground">
            Defina como calcular juros para pagamentos em atraso
          </p>
        </div>
      </div>

      <ConfiguracaoJuros />
    </div>
  );
}
