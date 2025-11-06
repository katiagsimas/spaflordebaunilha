import { useState, useEffect, useMemo } from 'react';
import { 
  Target, TrendingUp, DollarSign, Package, Edit2, Save, X, ShoppingCart
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { BackButton } from '@/components/BackButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ModalAplicarMeses } from '@/components/relatorios/ModalAplicarMeses';

interface DadosPE {
  ano: number;
  mes: number;
  mes_nome: string;
  tipo_dado: 'real' | 'estimado' | 'meta';
  editavel: boolean;
  custos_fixos: number;
  cmv: number;
  cmv_percentual: number;
  faturamento: number;
  margem_contribuicao_percentual: number;
  ponto_equilibrio_reais: number;
  ticket_medio: number;
  ponto_equilibrio_unidades: number;
  quantidade_vendas_real: number;
  resultado_mes: number;
  percentual_acima_pe: number;
  status: 'acima' | 'abaixo' | 'planejado' | 'pendente';
}

export default function PontoEquilibrio() {
  const anoAtual = new Date().getFullYear();
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);
  const [dadosAnuais, setDadosAnuais] = useState<DadosPE[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesEditando, setMesEditando] = useState<number | null>(null);
  const [dadosEditados, setDadosEditados] = useState<Record<number, any>>({});
  const [modalAplicarAberto, setModalAplicarAberto] = useState(false);

  useEffect(() => {
    carregarDados();
  }, [anoSelecionado]);

  useEffect(() => {
    setDadosEditados({});
    setMesEditando(null);
  }, [anoSelecionado]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Carregando dados do PE para ano:', anoSelecionado);

      // Carregar dados de todos os 12 meses
      const promises = Array.from({ length: 12 }, (_, i) => {
        return supabase.rpc('get_ponto_equilibrio_mes', {
          p_usuario_id: user.id,
          p_ano: anoSelecionado,
          p_mes: i + 1
        });
      });

      const results = await Promise.all(promises);
      console.log('Resultados recebidos:', results);
      
      const todosOsDados: DadosPE[] = [];
      results.forEach((result, index) => {
        const mesNumero = index + 1;
        console.log(`Mês ${mesNumero}:`, result);
        
        if (result.data && result.data.length > 0) {
          todosOsDados.push(result.data[0] as DadosPE);
        } else {
          // Se não retornou dados, criar entrada vazia para o mês
          const nomeMes = new Date(anoSelecionado, index, 1).toLocaleDateString('pt-BR', { month: 'long' });
          todosOsDados.push({
            ano: anoSelecionado,
            mes: mesNumero,
            mes_nome: nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1),
            tipo_dado: 'estimado',
            editavel: true,
            custos_fixos: 0,
            cmv: 0,
            cmv_percentual: 0,
            faturamento: 0,
            margem_contribuicao_percentual: 0,
            ponto_equilibrio_reais: 0,
            ticket_medio: 0,
            ponto_equilibrio_unidades: 0,
            quantidade_vendas_real: 0,
            resultado_mes: 0,
            percentual_acima_pe: 0,
            status: 'pendente'
          });
        }
      });

      console.log('Total de meses carregados:', todosOsDados.length);
      setDadosAnuais(todosOsDados);
    } catch (error) {
      console.error('Erro ao carregar PE:', error);
      toast.error('Erro ao carregar dados do Ponto de Equilíbrio');
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (mes: number, campo: string, valor: string) => {
    setDadosEditados((prev) => ({
      ...prev,
      [mes]: {
        ...prev[mes],
        [campo]: parseFloat(valor) || 0,
      },
    }));
  };

  const handleSalvarMes = async (mes: number) => {
    try {
      const valores = dadosEditados[mes] || {};
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('cmv_mensal')
        .upsert({
          usuario_id: user.id,
          ano: anoSelecionado,
          mes,
          tipo_dado: 'estimado',
          custos_fixos_estimado: valores.custos_fixos,
          cmv_percentual_estimado: valores.cmv_percentual,
          ticket_medio_estimado: valores.ticket_medio,
          usa_dados_sistema: false
        }, {
          onConflict: 'usuario_id,ano,mes'
        });

      if (error) throw error;

      toast.success('Estimativas salvas com sucesso!');

      setMesEditando(null);
      setDadosEditados((prev) => {
        const newData = { ...prev };
        delete newData[mes];
        return newData;
      });
      
      await carregarDados();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar estimativas');
    }
  };

  const handleCancelarMes = (mes: number) => {
    setMesEditando(null);
    setDadosEditados((prev) => {
      const newData = { ...prev };
      delete newData[mes];
      return newData;
    });
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'acima') return 'text-green-600 bg-green-50 border-green-200';
    if (status === 'abaixo') return 'text-red-600 bg-red-50 border-red-200';
    if (status === 'planejado') return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getStatusTexto = (status: string) => {
    if (status === 'acima') return '✅ Acima do PE';
    if (status === 'abaixo') return '🚨 Abaixo do PE';
    if (status === 'planejado') return '📈 Planejado';
    return '⚪ Pendente';
  };

  // Calcular totais
  const totais = useMemo(() => {
    return dadosAnuais.reduce(
      (acc, mes) => ({
        custos_fixos: acc.custos_fixos + (mes.custos_fixos || 0),
        pe_reais: acc.pe_reais + (mes.ponto_equilibrio_reais || 0),
        faturamento: acc.faturamento + (mes.faturamento || 0),
        resultado: acc.resultado + (mes.resultado_mes || 0),
      }),
      { custos_fixos: 0, pe_reais: 0, faturamento: 0, resultado: 0 }
    );
  }, [dadosAnuais]);

  // Gerar lista de anos (2020 até ano atual + 1)
  const anos = Array.from({ length: anoAtual - 2020 + 2 }, (_, i) => 2020 + i);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Ponto de Equilíbrio"
          description="Análise e Planejamento - Quanto você precisa vender"
          backButton={<BackButton to="/relatorios/inteligencia-negocios" />}
        />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Ponto de Equilíbrio"
        description="Análise e Planejamento - Quanto você precisa vender"
        backButton={<BackButton to="/relatorios/inteligencia-negocios" />}
      />

      {/* Seletor de Ano */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Ano:</label>
        <Select value={anoSelecionado.toString()} onValueChange={(v) => setAnoSelecionado(parseInt(v))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {anos.map((ano) => (
              <SelectItem key={ano} value={ano.toString()}>
                {ano}
                {ano === anoAtual && " (atual)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos Fixos Totais</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarMoeda(totais.custos_fixos)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PE Total (R$)</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarMoeda(totais.pe_reais)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarMoeda(totais.faturamento)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resultado Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", totais.resultado >= 0 ? 'text-green-600' : 'text-red-600')}>
              {formatarMoeda(totais.resultado)}
            </div>
            <Badge variant="outline" className={cn("mt-1", totais.resultado >= 0 ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200')}>
              {totais.resultado >= 0 ? '✅ Lucro' : '🚨 Prejuízo'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Ponto de Equilíbrio */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Mensal - {anoSelecionado}</CardTitle>
          <CardDescription>Detalhamento do Ponto de Equilíbrio por mês</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Mês</TableHead>
                  <TableHead className="text-right">Custos Fixos</TableHead>
                  <TableHead className="text-right">% CMV</TableHead>
                  <TableHead className="text-right">Ticket Médio</TableHead>
                  <TableHead className="text-right">PE (R$)</TableHead>
                  <TableHead className="text-right">PE (Vendas)</TableHead>
                  <TableHead className="text-right">Faturamento</TableHead>
                  <TableHead className="text-right">Resultado</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center w-32">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosAnuais.map((mes) => {
                  const editandoEsteMes = mesEditando === mes.mes;
                  const dadosEditadosMes = dadosEditados[mes.mes] || {};
                  
                  const custosFixos = editandoEsteMes ? 
                    dadosEditadosMes.custos_fixos ?? mes.custos_fixos : 
                    mes.custos_fixos;
                  const cmvPercentual = editandoEsteMes ? 
                    dadosEditadosMes.cmv_percentual ?? mes.cmv_percentual : 
                    mes.cmv_percentual;
                  const ticketMedio = editandoEsteMes ? 
                    dadosEditadosMes.ticket_medio ?? mes.ticket_medio : 
                    mes.ticket_medio;

                  // Calcular valores dinamicamente
                  const margemContribuicao = 100 - cmvPercentual;
                  const peReais = margemContribuicao > 0 ? custosFixos / (margemContribuicao / 100) : 0;
                  const peUnidades = ticketMedio > 0 ? Math.round(peReais / ticketMedio) : 0;

                  return (
                    <TableRow key={mes.mes}>
                      <TableCell className="font-medium">{mes.mes_nome}</TableCell>

                      {/* Custos Fixos */}
                      <TableCell className="text-right">
                        {editandoEsteMes ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={dadosEditadosMes.custos_fixos ?? mes.custos_fixos}
                            onChange={(e) => handleEditar(mes.mes, "custos_fixos", e.target.value)}
                            className="text-right h-9"
                          />
                        ) : (
                          formatarMoeda(custosFixos)
                        )}
                      </TableCell>

                      {/* % CMV */}
                      <TableCell className="text-right">
                        {editandoEsteMes ? (
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={dadosEditadosMes.cmv_percentual ?? mes.cmv_percentual}
                            onChange={(e) => handleEditar(mes.mes, "cmv_percentual", e.target.value)}
                            className="text-right h-9"
                          />
                        ) : (
                          `${cmvPercentual.toFixed(1)}%`
                        )}
                      </TableCell>

                      {/* Ticket Médio */}
                      <TableCell className="text-right">
                        {editandoEsteMes ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={dadosEditadosMes.ticket_medio ?? mes.ticket_medio}
                            onChange={(e) => handleEditar(mes.mes, "ticket_medio", e.target.value)}
                            className="text-right h-9"
                          />
                        ) : (
                          formatarMoeda(ticketMedio)
                        )}
                      </TableCell>

                      {/* PE em Reais (Calculado) */}
                      <TableCell className="text-right font-semibold">
                        {formatarMoeda(editandoEsteMes ? peReais : mes.ponto_equilibrio_reais)}
                      </TableCell>

                      {/* PE em Vendas (Calculado) */}
                      <TableCell className="text-right">
                        {editandoEsteMes ? peUnidades : Math.round(mes.ponto_equilibrio_unidades)}
                      </TableCell>

                      {/* Faturamento (apenas visualização) */}
                      <TableCell className="text-right">
                        {formatarMoeda(mes.faturamento)}
                      </TableCell>

                      {/* Resultado (apenas visualização) */}
                      <TableCell className="text-right">
                        <span className={cn(
                          "font-semibold",
                          mes.resultado_mes >= 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {formatarMoeda(mes.resultado_mes)}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn("font-semibold", getStatusBadge(mes.status))}>
                          {getStatusTexto(mes.status)}
                        </Badge>
                      </TableCell>

                      {/* Ações */}
                      <TableCell className="text-center">
                        {editandoEsteMes ? (
                          <div className="flex gap-1 justify-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancelarMes(mes.mes)}
                              className="h-8 px-2"
                              title="Cancelar"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSalvarMes(mes.mes)}
                              className="h-8 px-2"
                              title="Salvar"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setMesEditando(mes.mes)}
                              disabled={mesEditando !== null}
                              className="h-8 px-2"
                              title="Editar"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            {mes.tipo_dado === 'estimado' && (mes.custos_fixos > 0 || mes.cmv_percentual > 0 || mes.ticket_medio > 0) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={async () => {
                                  const { data: { user } } = await supabase.auth.getUser();
                                  if (!user) return;
                                  
                                  await supabase
                                    .from('cmv_mensal')
                                    .delete()
                                    .eq('usuario_id', user.id)
                                    .eq('ano', anoSelecionado)
                                    .eq('mes', mes.mes);
                                  
                                  toast.success('Estimativas removidas');
                                  carregarDados();
                                }}
                                disabled={mesEditando !== null}
                                className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Limpar"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* LINHA DE TOTAIS */}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>TOTAL {anoSelecionado}</TableCell>
                  <TableCell className="text-right">{formatarMoeda(totais.custos_fixos)}</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">{formatarMoeda(totais.pe_reais)}</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">{formatarMoeda(totais.faturamento)}</TableCell>
                  <TableCell className="text-right">
                    <span className={cn(totais.resultado >= 0 ? 'text-green-600' : 'text-red-600')}>
                      {formatarMoeda(totais.resultado)}
                    </span>
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Legenda */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
            <h4 className="font-semibold mb-2">📚 Como Interpretar:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• <strong>Ponto de Equilíbrio (PE):</strong> O valor mínimo que você precisa faturar para não ter prejuízo</li>
              <li>• <strong>Custos Fixos:</strong> Despesas que você tem todo mês (aluguel, luz, água, salários...)</li>
              <li>• <strong>% CMV:</strong> Percentual do custo dos ingredientes sobre as vendas</li>
              <li>• <strong>Ticket Médio:</strong> Valor médio de cada venda</li>
              <li>• ✅ <strong>Acima do PE:</strong> Você está tendo lucro!</li>
              <li>• 🚨 <strong>Abaixo do PE:</strong> Atenção! Você está no prejuízo</li>
              <li>• 📈 <strong>Planejado:</strong> Metas futuras (estimativas que você digitou)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Modal Aplicar para Outros Meses */}
      <ModalAplicarMeses
        aberto={modalAplicarAberto}
        onFechar={() => setModalAplicarAberto(false)}
        valoresBase={{
          custos_fixos: 0,
          cmv_percentual: 0,
          ticket_medio: 0
        }}
        mesOrigem={{ ano: anoSelecionado, mes: 1 }}
        onSucesso={() => {
          toast.success('Estimativas aplicadas com sucesso!');
          carregarDados();
        }}
      />
    </div>
  );
}
