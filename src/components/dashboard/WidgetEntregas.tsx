import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { EntregaProxima } from '@/hooks/useDashboardData';

interface WidgetEntregasProps {
  entregas: EntregaProxima[];
}

export function WidgetEntregas({ entregas }: WidgetEntregasProps) {
  const navigate = useNavigate();

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const getBadgeVariant = (urgencia: string) => {
    switch (urgencia) {
      case 'hoje':
        return 'destructive';
      case 'amanha':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getBadgeText = (urgencia: string) => {
    switch (urgencia) {
      case 'hoje':
        return 'HOJE';
      case 'amanha':
        return 'Amanhã';
      default:
        return 'Próximos dias';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 Entregas Próximas</CardTitle>
      </CardHeader>
      <CardContent>
        {entregas.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma entrega programada
          </p>
        ) : (
          <div className="space-y-3">
            {entregas.map((entrega) => (
              <div
                key={entrega.encomenda_id}
                className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                onClick={() => navigate(`/encomendas`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getBadgeVariant(entrega.urgencia)}>
                        {getBadgeText(entrega.urgencia)}
                      </Badge>
                      <span className="font-medium">
                        #{entrega.numero_pedido}
                      </span>
                    </div>
                    <p className="text-sm">{entrega.cliente_nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(entrega.data_entrega), "dd 'de' MMMM", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatarMoeda(entrega.valor_total)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
