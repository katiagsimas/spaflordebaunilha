import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import ConfiguracaoTagsEncomendas from '@/components/configuracoes/ConfiguracaoTagsEncomendas';

export default function TagsEncomendasPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/configuracoes/cadastros-base')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Tags de Encomendas</h1>
        </div>
      </div>

      <ConfiguracaoTagsEncomendas />
    </div>
  );
}
