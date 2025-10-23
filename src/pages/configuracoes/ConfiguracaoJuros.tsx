import ConfiguracaoJuros from '@/components/configuracoes/ConfiguracaoJuros';
import { PageHeader } from '@/components/PageHeader';
import { BackButton } from '@/components/BackButton';

export default function ConfiguracaoJurosPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <PageHeader
        title="Configuração de Juros e Multas"
        description="Defina como calcular juros para pagamentos em atraso"
        backButton={<BackButton to="/configuracoes" />}
      />

      <ConfiguracaoJuros />
    </div>
  );
}
