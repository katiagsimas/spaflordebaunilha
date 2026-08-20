import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/PageHeader';
import { BackButton } from '@/components/BackButton';
import { useEstoque } from '@/hooks/useEstoque';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { ArrowDownUp, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const TIPO_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  entrada: { label: 'Entrada', variant: 'default' },
  saida_producao: { label: 'Saída (Produção)', variant: 'destructive' },
  saida_manual: { label: 'Saída Manual', variant: 'secondary' },
  ajuste: { label: 'Ajuste', variant: 'outline' },
};

interface EncomendaRef {
  id: string;
  cliente_nome?: string;
  data_entrega?: string;
}

export default function EstoqueMovimentacoes() {
  const { movimentacoes, itens, loadingMov, fetchMovimentacoes } = useEstoque();

  const encomendaIds = useMemo(
    () => [
      ...new Set(
        movimentacoes
          .filter(m => m.referencia_tipo === 'encomenda' && m.referencia_id)
          .map(m => m.referencia_id!)
      ),
    ],
    [movimentacoes]
  );

  const encomendasQuery = useQuery({
    queryKey: ['encomendas-ref-estoque', encomendaIds],
    enabled: encomendaIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('encomendas')
        .select('id, cliente_nome:cliente, data_entrega')
        .in('id', encomendaIds);
      const map: Record<string, EncomendaRef> = {};
      if (data) {
        data.forEach((e: any) => { map[e.id] = e; });
      }
      return map;
    },
  });

  const encomendasMap = encomendasQuery.data || {};

  const getItemNome = (estoqueId: string) => {
    const item = itens.find(i => i.id === estoqueId);
    return item?.nome_insumo || 'Item removido';
  };

  if (loadingMov) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimentações de Estoque"
        description="Histórico completo de entradas, saídas e ajustes"
        backButton={<BackButton to="/estoque" />}
      />

      {movimentacoes.length === 0 ? (
        <EmptyState
          icon={ArrowDownUp}
          title="Nenhuma movimentação registrada"
          description="As movimentações aparecerão aqui conforme você registrar entradas e ajustes."
        />
      ) : (<>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Insumo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Custo Unit.</TableHead>
                  <TableHead className="text-right">Custo Total</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentacoes.map((mov) => {
                  const tipoInfo = TIPO_LABELS[mov.tipo_movimentacao] || { label: mov.tipo_movimentacao, variant: 'outline' as const };
                  const data = new Date(mov.created_at);
                  const encomendaRef = mov.referencia_tipo === 'encomenda' && mov.referencia_id
                    ? encomendasMap[mov.referencia_id]
                    : null;
                  return (
                    <TableRow key={mov.id}>
                      <TableCell className="font-body text-sm">
                        {data.toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-body font-medium">
                        {getItemNome(mov.estoque_id)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tipoInfo.variant} className="font-body text-xs">
                          {tipoInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-body">
                        {mov.tipo_movimentacao === 'entrada' ? '+' : '-'}
                        {Number(mov.quantidade).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right font-body">
                        {mov.custo_unitario != null
                          ? Number(mov.custo_unitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right font-body">
                        {mov.custo_total != null
                          ? Number(mov.custo_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : '—'}
                      </TableCell>
                      <TableCell className="font-body text-sm">
                        {encomendaRef ? (
                          <div className="flex items-center gap-1.5 text-sfb-dourado">
                            <Package className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate max-w-32" title={encomendaRef.cliente_nome || ''}>
                              {encomendaRef.cliente_nome || 'Encomenda'}
                            </span>
                            {encomendaRef.data_entrega && (
                              <span className="text-muted-foreground text-xs">
                                ({new Date(encomendaRef.data_entrega + 'T12:00:00').toLocaleDateString('pt-BR')})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground max-w-48 truncate">
                        {mov.observacao || '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        {movimentacoes.length === 500 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Exibindo as 500 movimentações mais recentes. Registros anteriores não estão visíveis.
          </p>
        )}
      </>)}
    </div>
  );
}
