import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useFluxoCaixaIntegrado } from '@/hooks/useFluxoCaixaIntegrado';
import { LoadingState } from '@/components/LoadingState';
import {
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function DashboardFluxoCaixa() {
  const {
    saldoHoje,
    saldo7Dias,
    saldo30Dias,
    alertas,
    alertasCriticos,
    temProblemas,
    isLoading,
  } = useFluxoCaixaIntegrado();

  if (isLoading) {
    return <LoadingState />;
  }

  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const diferencaHoje7Dias = saldo7Dias - saldoHoje;
  const diferencaHoje30Dias = saldo30Dias - saldoHoje;

  const alertasCriticosExibir = alertas
    .filter((a) => a.severidade === 'CRITICO')
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Cards Principais */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Card 1 - Saldo Hoje */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Hoje</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${
                saldoHoje >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatarValor(saldoHoje)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Saldo atual + movimentações de hoje
            </p>
          </CardContent>
        </Card>

        {/* Card 2 - Em 7 Dias */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em 7 Dias</CardTitle>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${
                saldo7Dias >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatarValor(saldo7Dias)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {diferencaHoje7Dias >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <p className="text-xs text-muted-foreground">
                {diferencaHoje7Dias >= 0 ? 'Aumento' : 'Redução'} de{' '}
                {formatarValor(Math.abs(diferencaHoje7Dias))}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3 - Em 30 Dias */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em 30 Dias</CardTitle>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${
                saldo30Dias >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatarValor(saldo30Dias)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {diferencaHoje30Dias >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <p className="text-xs text-muted-foreground">
                {diferencaHoje30Dias >= 0 ? 'Aumento' : 'Redução'} de{' '}
                {formatarValor(Math.abs(diferencaHoje30Dias))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Críticos */}
      {temProblemas && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {alertasCriticos} alerta(s) crítico(s)
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-2">
              {alertasCriticosExibir.map((alerta, idx) => (
                <li key={idx} className="text-sm">
                  <strong>{alerta.descricao}</strong> -{' '}
                  {alerta.dias_restantes < 0
                    ? `atrasado há ${Math.abs(alerta.dias_restantes)} dias`
                    : alerta.dias_restantes === 0
                    ? 'hoje'
                    : `em ${alerta.dias_restantes} dias`}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Card de Alertas Detalhados */}
      {alertas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alertas Financeiros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertas.map((alerta, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between border-b pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={
                          alerta.severidade === 'CRITICO'
                            ? 'destructive'
                            : alerta.severidade === 'ALTO'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {alerta.severidade}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(
                          new Date(alerta.data_evento),
                          "dd/MM/yyyy",
                          { locale: ptBR }
                        )}
                      </span>
                    </div>
                    <p className="text-sm">{alerta.descricao}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alerta.dias_restantes < 0
                        ? `Atrasado há ${Math.abs(alerta.dias_restantes)} dias`
                        : alerta.dias_restantes === 0
                        ? 'Vence hoje'
                        : `${alerta.dias_restantes} dias restantes`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatarValor(alerta.valor)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
