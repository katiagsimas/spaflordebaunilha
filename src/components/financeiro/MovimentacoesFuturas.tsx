import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useMovimentacoesFuturas } from '@/hooks/useMovimentacoesFuturas';
import { LoadingState } from '@/components/LoadingState';
import { ArrowUpCircle, ArrowDownCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function MovimentacoesFuturas() {
  const {
    entradas,
    saidas,
    totalEntradas,
    totalSaidas,
    isLoading,
  } = useMovimentacoesFuturas();

  if (isLoading) {
    return <LoadingState />;
  }

  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Movimentações Futuras (30 dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="entradas" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="entradas" className="flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4" />
              Entradas
              <Badge variant="secondary">{formatarValor(totalEntradas)}</Badge>
            </TabsTrigger>
            <TabsTrigger value="saidas" className="flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4" />
              Saídas
              <Badge variant="secondary">{formatarValor(totalSaidas)}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Tab Entradas */}
          <TabsContent value="entradas">
            <div className="space-y-3">
              {entradas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma entrada prevista nos próximos 30 dias
                </p>
              ) : (
                entradas.map((mov) => (
                  <Card
                    key={mov.origem_id}
                    className="border transition-colors hover:bg-muted/50"
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{mov.descricao}</p>
                          <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                            <span>
                              {format(
                                new Date(mov.data_movimento),
                                "dd/MM/yyyy",
                                { locale: ptBR }
                              )}
                            </span>
                            {mov.cliente_fornecedor && (
                              <>
                                <span>•</span>
                                <span>{mov.cliente_fornecedor}</span>
                              </>
                            )}
                            {mov.banco && (
                              <>
                                <span>•</span>
                                <span>{mov.banco}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            {formatarValor(mov.valor)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Tab Saídas */}
          <TabsContent value="saidas">
            <div className="space-y-3">
              {saidas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma saída prevista nos próximos 30 dias
                </p>
              ) : (
                saidas.map((mov) => (
                  <Card
                    key={mov.origem_id}
                    className="border transition-colors hover:bg-muted/50"
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{mov.descricao}</p>
                          <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                            <span>
                              {format(
                                new Date(mov.data_movimento),
                                "dd/MM/yyyy",
                                { locale: ptBR }
                              )}
                            </span>
                            {mov.cliente_fornecedor && (
                              <>
                                <span>•</span>
                                <span>{mov.cliente_fornecedor}</span>
                              </>
                            )}
                            {mov.banco && (
                              <>
                                <span>•</span>
                                <span>{mov.banco}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600">
                            {formatarValor(mov.valor)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
