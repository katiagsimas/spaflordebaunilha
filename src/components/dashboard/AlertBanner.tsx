import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { DashboardAlert } from '@/hooks/useDashboardData';

interface AlertBannerProps {
  alertas: DashboardAlert[];
}

export function AlertBanner({ alertas }: AlertBannerProps) {
  const [alertasFechados, setAlertasFechados] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  if (alertas.length === 0) {
    return null;
  }

  const alertasVisiveis = alertas.filter(
    (alerta) => !alertasFechados.has(alerta.tipo)
  );

  if (alertasVisiveis.length === 0) {
    return null;
  }

  const fecharAlerta = (tipo: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAlertasFechados((prev) => new Set(prev).add(tipo));
  };

  const getIcon = (severidade: string) => {
    switch (severidade) {
      case 'critico':
        return <AlertTriangle className="h-4 w-4" />;
      case 'alta':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-3">
      {alertasVisiveis.map((alerta) => (
        <Alert
          key={alerta.tipo}
          variant={alerta.severidade === 'critico' ? 'destructive' : 'default'}
          className="cursor-pointer hover:shadow-md transition-shadow relative"
          onClick={() => navigate(alerta.acao_url)}
        >
          <div className="flex items-center gap-3">
            {getIcon(alerta.severidade)}
            <AlertDescription className="flex items-center gap-2 flex-1">
              <span>{alerta.icone}</span>
              <span>{alerta.mensagem}</span>
            </AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => fecharAlerta(alerta.tipo, e)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
}
