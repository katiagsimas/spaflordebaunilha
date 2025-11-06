import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Target, DollarSign, Calculator, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { BackButton } from '@/components/BackButton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface InsightCruzado {
  origem: string;
  evento: string;
  total_vendas: number;
  valor_total: number;
  ticket_medio: number;
  percentual: number;
}

export default function InteligenciaNegocios() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [insights, setInsights] = useState<InsightCruzado[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('30');

  useEffect(() => {
    if (user) {
      carregarInsights();
    }
  }, [periodo, user]);

  const carregarInsights = async () => {
    if (!user) return;
    
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('get_insights_cruzados', {
        dias: parseInt(periodo),
        user_id_param: user.id,
      });

      if (error) throw error;
      setInsights(data || []);
    } catch (error) {
      console.error('Erro ao carregar insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const top3Combinacoes = insights
    .sort((a, b) => b.valor_total - a.valor_total)
    .slice(0, 3);

  const totais = insights.reduce(
    (acc, item) => ({
      vendas: acc.vendas + item.total_vendas,
      valor: acc.valor + item.valor_total,
    }),
    { vendas: 0, valor: 0 }
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <BackButton to="/encomendas" />
          <div>
            <h1 className="text-3xl font-bold">🎯 Centro de Comando Financeiro</h1>
            <p className="text-muted-foreground">
              Decisões baseadas em dados reais
            </p>
          </div>
        </div>

        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Módulos do Centro de Comando */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary"
          onClick={() => navigate('/relatorios/cmv-global')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5 text-primary" />
              CMV Global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Análise anual do Custo de Mercadoria Vendida com histórico e projeções
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary"
          onClick={() => navigate('/relatorios/ponto-equilibrio')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Ponto de Equilíbrio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Calcule quanto precisa faturar para cobrir seus custos
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary"
          onClick={() => navigate('/relatorios/planejamento-vendas')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Planejamento de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Defina metas e receba um plano de vendas inteligente com IA
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Vendas
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totais.vendas}</div>
            <p className="text-xs text-muted-foreground">
              encomendas no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Faturamento Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totais.valor)}
            </div>
            <p className="text-xs text-muted-foreground">
              valor total gerado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ticket Médio
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totais.valor / totais.vendas || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              por encomenda
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top 3 Combinações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            🔥 Top 3: Onde Está o Dinheiro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando insights...
            </div>
          ) : top3Combinacoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum dado disponível para o período selecionado.
              <br />
              <span className="text-sm">
                Adicione tags às suas encomendas para gerar insights!
              </span>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {top3Combinacoes.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">
                          {item.origem} → {item.evento}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.total_vendas} vendas • Ticket médio:{' '}
                          {formatCurrency(item.ticket_medio)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        {formatCurrency(item.valor_total)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.percentual.toFixed(1)}% do total
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Insights Acionáveis */}
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="font-semibold mb-3">💡 Ações Recomendadas:</p>
                <ul className="space-y-2 text-sm">
                  {top3Combinacoes[0] && (
                    <li>
                      ✅ Foco no {top3Combinacoes[0].origem}: Crie conteúdo específico para {top3Combinacoes[0].evento.toLowerCase()}
                    </li>
                  )}
                  {top3Combinacoes[1] && (
                    <li>
                      ✅ Oportunidade de crescimento: Desenvolva combo para {top3Combinacoes[1].evento.toLowerCase()}
                    </li>
                  )}
                  <li>
                    ✅ Teste A/B: Compare performance entre canais para o mesmo tipo de evento
                  </li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tabela Completa */}
      {!loading && insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Análise Detalhada: Origem × Evento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Origem</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">Ticket Médio</TableHead>
                    <TableHead className="text-right">% do Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insights.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.origem}</TableCell>
                      <TableCell>{item.evento}</TableCell>
                      <TableCell className="text-right">{item.total_vendas}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.valor_total)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.ticket_medio)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.percentual.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
