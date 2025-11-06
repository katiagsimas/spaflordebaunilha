import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, TrendingUp, DollarSign, Package, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useReceitas } from '@/hooks/useReceitas';
import { useEncomendas } from '@/hooks/useEncomendas';
import { useToast } from '@/hooks/use-toast';

interface MetasMensais {
  meta_faturamento: number;
  meta_lucro: number;
  meta_pedidos: number;
  meta_ticket_medio: number;
}

interface PlanoMensal {
  resumo: {
    mes_referencia: string;
    meta_faturamento: number;
    meta_lucro: number;
    meta_pedidos: number;
    meta_ticket_medio: number;
    ticket_medio_calculado: number;
    ponto_de_equilibrio_mensal: number;
    risco_quebra: boolean;
    ajustes_aplicados: string[];
  };
  mix_planejado: Array<{
    product_id: string;
    nome: string;
    preco_venda: number;
    cmv_unitario: number;
    margem_unitaria_liquida: number;
    faturamento_alocado: number;
    qtd_planejada: number;
    receita_prevista: number;
    lucro_previsto: number;
    peso_utilizado: {
      historico: number;
      margem: number;
      final: number;
    };
    observacoes: string;
  }>;
  consolidado: {
    receita_total_prevista: number;
    lucro_total_previsto: number;
    qtd_total_prevista: number;
    ticket_medio_previsto: number;
    margem_media_pct: number;
  };
  acoes_recomendadas: string[];
  alertas: string[];
}

export default function PlanejamentoVendas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { receitas } = useReceitas();
  const { encomendas } = useEncomendas();

  const [metas, setMetas] = useState<MetasMensais>({
    meta_faturamento: 15000,
    meta_lucro: 4500,
    meta_pedidos: 120,
    meta_ticket_medio: 125,
  });

  const [loading, setLoading] = useState(false);
  const [plano, setPlano] = useState<PlanoMensal | null>(null);
  const [mesReferencia, setMesReferencia] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const gerarPlano = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Buscar itens de encomendas (últimos 90 dias)
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 90);

      const { data: itensData } = await supabase
        .from('encomenda_itens')
        .select('receita_id, produto, quantidade, valor_unitario')
        .gte('created_at', dataLimite.toISOString());

      // Montar histórico de vendas por produto
      const vendasPorProduto = (itensData || []).reduce((acc, item) => {
        const key = item.receita_id || 'unknown';
        if (!acc[key]) {
          acc[key] = {
            product_id: key,
            nome: item.produto || 'Item',
            qtd_vendida: 0,
            receita_total: 0,
          };
        }
        acc[key].qtd_vendida += item.quantidade || 0;
        acc[key].receita_total += item.valor_unitario * (item.quantidade || 0);
        return acc;
      }, {} as Record<string, any>);

      // Montar cardápio ativo (apenas receitas com cardapio = 'ativo')
      const cardapioAtivo = receitas
        .filter(r => r.cardapio === 'ativo')
        .map(r => ({
          product_id: r.id,
          nome: r.nome,
          preco_venda: r.valorVenda || 0,
          cmv_unitario: r.custoTotal || 0,
          rendimento_unidade: r.unidadeRendimento || 'unidade',
          categoria: r.categoria || 'Sem categoria',
          ativo: true,
        }));

      // Montar input para a IA
      const input = {
        contexto: {
          moeda: 'BRL',
          loja_nome: 'Donna\'s Box',
          mes_referencia: mesReferencia,
        },
        metas: {
          anual: {
            faturamento_anual: metas.meta_faturamento * 12,
            lucro_anual: metas.meta_lucro * 12,
          },
          mensal: {
            meta_faturamento: metas.meta_faturamento,
            meta_lucro: metas.meta_lucro,
            meta_pedidos: metas.meta_pedidos,
            meta_ticket_medio: metas.meta_ticket_medio,
          },
        },
        custos: {
          ponto_de_equilibrio_mensal: 9000, // TODO: buscar do sistema
          custo_indireto_mensal: 4500,
          taxa_media_pagamento_pct: 3.2,
        },
        historico: {
          janela_dias: 90,
          vendas_por_produto: Object.values(vendasPorProduto),
        },
        cardapio_ativo: cardapioAtivo,
      };

      const { data, error } = await supabase.functions.invoke('planejamento-vendas', {
        body: { input },
      });

      if (error) throw error;

      if (data.error) {
        if (data.error.includes('Rate limits')) {
          toast({
            title: 'Limite atingido',
            description: 'Muitas requisições. Aguarde um momento e tente novamente.',
            variant: 'destructive',
          });
        } else if (data.error.includes('Payment required')) {
          toast({
            title: 'Créditos insuficientes',
            description: 'Adicione créditos em Settings → Workspace → Usage.',
            variant: 'destructive',
          });
        } else {
          throw new Error(data.error);
        }
        return;
      }

      setPlano(data.result);
      toast({
        title: 'Plano gerado!',
        description: 'Seu planejamento de vendas está pronto.',
      });

    } catch (error) {
      console.error('Erro ao gerar plano:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o planejamento. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/relatorios/inteligencia')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">📈 Planejamento de Vendas</h1>
          <p className="text-muted-foreground">
            Defina metas e receba um plano de vendas inteligente com IA
          </p>
        </div>
      </div>

      {/* Formulário de Metas */}
      <Card>
        <CardHeader>
          <CardTitle>Defina suas Metas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mes">Mês de Referência</Label>
              <Input
                id="mes"
                type="month"
                value={mesReferencia}
                onChange={(e) => setMesReferencia(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="faturamento">Meta de Faturamento (R$)</Label>
              <Input
                id="faturamento"
                type="number"
                step="100"
                value={metas.meta_faturamento}
                onChange={(e) => setMetas({ ...metas, meta_faturamento: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="lucro">Meta de Lucro (R$)</Label>
              <Input
                id="lucro"
                type="number"
                step="100"
                value={metas.meta_lucro}
                onChange={(e) => setMetas({ ...metas, meta_lucro: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="pedidos">Meta de Pedidos</Label>
              <Input
                id="pedidos"
                type="number"
                value={metas.meta_pedidos}
                onChange={(e) => setMetas({ ...metas, meta_pedidos: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="ticket">Ticket Médio (R$)</Label>
              <Input
                id="ticket"
                type="number"
                step="10"
                value={metas.meta_ticket_medio}
                onChange={(e) => setMetas({ ...metas, meta_ticket_medio: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <Button
            onClick={gerarPlano}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando plano com IA...
              </>
            ) : (
              'Gerar Plano de Vendas'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {plano && (
        <>
          {/* Alertas */}
          {plano.resumo?.risco_quebra && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ⚠️ RISCO: Meta de faturamento abaixo do ponto de equilíbrio!
                Você precisa de pelo menos {formatCurrency(plano.resumo.ponto_de_equilibrio_mensal)} para não ter prejuízo.
              </AlertDescription>
            </Alert>
          )}

          {plano.alertas?.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {plano.alertas.map((alerta, i) => (
                    <div key={i}>• {alerta}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Receita Prevista</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(plano.consolidado?.receita_total_prevista || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Meta: {formatCurrency(plano.resumo?.meta_faturamento || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Lucro Previsto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(plano.consolidado?.lucro_total_previsto || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Margem: {plano.consolidado?.margem_media_pct?.toFixed(1) || 0}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pedidos Previstos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {plano.consolidado?.qtd_total_prevista || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Meta: {plano.resumo?.meta_pedidos || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(plano.consolidado?.ticket_medio_previsto || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Meta: {formatCurrency(plano.resumo?.meta_ticket_medio || 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Mix de Produtos */}
          <Card>
            <CardHeader>
              <CardTitle>Mix de Produtos Planejado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plano.mix_planejado?.map((produto, index) => (
                  <div
                    key={produto.product_id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <h3 className="font-semibold">{produto.nome}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {produto.observacoes}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Preço: {formatCurrency(produto.preco_venda)}</span>
                        <span>CMV: {formatCurrency(produto.cmv_unitario)}</span>
                        <span>Margem: {formatCurrency(produto.margem_unitaria_liquida)}</span>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-lg font-bold">
                        {produto.qtd_planejada} un
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(produto.receita_prevista)}
                      </div>
                      <div className="text-xs text-green-600">
                        Lucro: {formatCurrency(produto.lucro_previsto)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ações Recomendadas */}
          <Card>
            <CardHeader>
              <CardTitle>💡 Ações Recomendadas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plano.acoes_recomendadas?.map((acao, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>{acao}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
