import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Download,
  Filter,
  Wallet
} from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { PageHeader } from '@/components/PageHeader';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function FluxoCaixa() {
  const { toast } = useToast();

  // Estados
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('diario');
  
  // Filtros
  const [dataInicio, setDataInicio] = useState(() => {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return inicioMes.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);
  const [bancoFiltro, setBancoFiltro] = useState('todos');

  // Dados
  const [bancos, setBancos] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [dadosGrafico, setDadosGrafico] = useState([]);
  
  // Resumo
  const [saldoInicial, setSaldoInicial] = useState(0);
  const [totalEntradas, setTotalEntradas] = useState(0);
  const [totalSaidas, setTotalSaidas] = useState(0);
  const [saldoFinal, setSaldoFinal] = useState(0);

  // Estados para visão mensal
  const [dadosMensais, setDadosMensais] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [previsaoSaldo, setPrevisaoSaldo] = useState(0);
  const [contasAVencer, setContasAVencer] = useState({ receber: 0, pagar: 0 });

  useEffect(() => {
    fetchBancos();
  }, []);

  useEffect(() => {
    if (bancos.length > 0) {
      fetchFluxoCaixa();
      fetchDadosMensais();
      fetchPrevisoes();
      fetchAnaliseCategoria();
    }
  }, [dataInicio, dataFim, bancoFiltro, bancos]);

  const fetchBancos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('bancos')
        .select('id, codigo, nome')
        .eq('usuario_id', user.id)
        .order('nome');

      setBancos(data || []);
    } catch (error) {
      console.error('Erro ao buscar bancos:', error);
    }
  };

  const fetchFluxoCaixa = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar saldo inicial do mês
      const dataInicioObj = new Date(dataInicio + 'T00:00:00');
      const mes = dataInicioObj.getMonth() + 1;
      const ano = dataInicioObj.getFullYear();

      let querySaldos = supabase
        .from('saldos_iniciais_bancos')
        .select('saldo_inicial, banco_id')
        .eq('user_id', user.id)
        .eq('mes_referencia', mes)
        .eq('ano_referencia', ano);

      if (bancoFiltro !== 'todos') {
        querySaldos = querySaldos.eq('banco_id', bancoFiltro);
      }

      const { data: saldos } = await querySaldos;
      const saldoIni = saldos?.reduce((acc, s) => acc + (s.saldo_inicial || 0), 0) || 0;
      setSaldoInicial(saldoIni);

      // Buscar entradas (contas a receber pagas)
      const { data: entradas } = await supabase
        .from('contas_receber_pagamentos')
        .select('*')
        .gte('data_pagamento', dataInicio)
        .lte('data_pagamento', dataFim)
        .eq('estornado', false);

      // Buscar saídas (contas a pagar pagas)
      const { data: saidas } = await supabase
        .from('contas_pagar_pagamentos')
        .select('*')
        .gte('data_pagamento', dataInicio)
        .lte('data_pagamento', dataFim)
        .eq('estornado', false);

      // Buscar detalhes das entradas
      const entradasComDetalhes = await Promise.all(
        (entradas || []).map(async (e) => {
          const { data: parcela } = await supabase
            .from('contas_receber_parcelas')
            .select('conta_receber_id')
            .eq('id', e.parcela_id)
            .single();

          if (parcela) {
            const { data: conta } = await supabase
              .from('contas_receber')
              .select('banco_id, descricao, cliente_id')
              .eq('id', parcela.conta_receber_id)
              .single();

            if (conta) {
              let clienteNome = 'N/A';
              if (conta.cliente_id) {
                const { data: cliente } = await supabase
                  .from('clientes')
                  .select('nome')
                  .eq('id', conta.cliente_id)
                  .single();
                clienteNome = cliente?.nome || 'N/A';
              }

              return {
                ...e,
                banco_id: conta.banco_id,
                descricao: conta.descricao,
                cliente_nome: clienteNome,
              };
            }
          }
          return null;
        })
      );

      // Buscar detalhes das saídas
      const saidasComDetalhes = await Promise.all(
        (saidas || []).map(async (s) => {
          const { data: parcela } = await supabase
            .from('contas_pagar_parcelas')
            .select('conta_pagar_id')
            .eq('id', s.parcela_id)
            .single();

          if (parcela) {
            const { data: conta } = await supabase
              .from('contas_pagar')
              .select('banco_id, descricao, fornecedor_id')
              .eq('id', parcela.conta_pagar_id)
              .single();

            if (conta) {
              let fornecedorNome = 'N/A';
              if (conta.fornecedor_id) {
                const { data: fornecedor } = await supabase
                  .from('fornecedores')
                  .select('nome')
                  .eq('id', conta.fornecedor_id)
                  .single();
                fornecedorNome = fornecedor?.nome || 'N/A';
              }

              return {
                ...s,
                banco_id: conta.banco_id,
                descricao: conta.descricao,
                fornecedor_nome: fornecedorNome,
              };
            }
          }
          return null;
        })
      );

      // Filtrar por banco se necessário
      const entradasFiltradas = (bancoFiltro === 'todos' 
        ? entradasComDetalhes 
        : entradasComDetalhes.filter(e => e && e.banco_id === bancoFiltro)
      ).filter(e => e !== null);

      const saidasFiltradas = (bancoFiltro === 'todos'
        ? saidasComDetalhes 
        : saidasComDetalhes.filter(s => s && s.banco_id === bancoFiltro)
      ).filter(s => s !== null);

      // Processar movimentações
      const movs = [];

      // Adicionar entradas
      entradasFiltradas.forEach((e: any) => {
        const valorLiquido = e.valor_pago + (e.juros || 0) - (e.desconto || 0);
        movs.push({
          id: `E-${e.id}`,
          data: e.data_pagamento,
          tipo: 'entrada',
          descricao: e.descricao || 'Recebimento',
          cliente_fornecedor: e.cliente_nome || 'N/A',
          entrada: valorLiquido,
          saida: 0,
        });
      });

      // Adicionar saídas
      saidasFiltradas.forEach((s: any) => {
        const valorLiquido = s.valor_pago + (s.juros || 0) - (s.desconto || 0);
        movs.push({
          id: `S-${s.id}`,
          data: s.data_pagamento,
          tipo: 'saida',
          descricao: s.descricao || 'Pagamento',
          cliente_fornecedor: s.fornecedor_nome || 'N/A',
          entrada: 0,
          saida: valorLiquido,
        });
      });

      // Ordenar por data
      movs.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

      // Calcular saldo progressivo
      let saldoAcumulado = saldoIni;
      const movsComSaldo = movs.map(m => {
        saldoAcumulado = saldoAcumulado + m.entrada - m.saida;
        return {
          ...m,
          saldo: saldoAcumulado,
        };
      });

      setMovimentacoes(movsComSaldo);

      // Calcular totais
      const totEntradas = movsComSaldo.reduce((acc, m) => acc + m.entrada, 0);
      const totSaidas = movsComSaldo.reduce((acc, m) => acc + m.saida, 0);
      const saldoFin = saldoIni + totEntradas - totSaidas;

      setTotalEntradas(totEntradas);
      setTotalSaidas(totSaidas);
      setSaldoFinal(saldoFin);

      // Preparar dados do gráfico (agrupados por dia)
      const movsPorDia = {};
      
      // Inicializar com saldo inicial na primeira data
      const primeiraData = dataInicio;
      movsPorDia[primeiraData] = {
        data: primeiraData,
        saldo: saldoIni,
      };

      movsComSaldo.forEach(m => {
        if (!movsPorDia[m.data]) {
          movsPorDia[m.data] = {
            data: m.data,
            saldo: m.saldo,
          };
        } else {
          // Se já existe, pegar o último saldo do dia
          movsPorDia[m.data].saldo = m.saldo;
        }
      });

      const dadosGraf = Object.values(movsPorDia).map((d: any) => ({
        data: new Date(d.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        saldo: d.saldo,
      }));

      setDadosGrafico(dadosGraf);
    } catch (error) {
      console.error('Erro ao buscar fluxo de caixa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o fluxo de caixa.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDadosMensais = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dataFimObj = new Date(dataFim + 'T00:00:00');
      const mesAtual = dataFimObj.getMonth();
      const anoAtual = dataFimObj.getFullYear();

      const mesesData = [];
      
      for (let i = 11; i >= 0; i--) {
        const data = new Date(anoAtual, mesAtual - i, 1);
        const mes = data.getMonth() + 1;
        const ano = data.getFullYear();
        const ultimoDia = new Date(ano, mes, 0).getDate();

        const { data: saldosMes } = await supabase
          .from('saldos_iniciais_bancos')
          .select('saldo_inicial')
          .eq('user_id', user.id)
          .eq('mes_referencia', mes)
          .eq('ano_referencia', ano);

        const saldoIni = saldosMes?.reduce((acc, s) => acc + (s.saldo_inicial || 0), 0) || 0;

        const { data: entradasMes } = await supabase
          .from('contas_receber_pagamentos')
          .select('valor_pago, juros, desconto')
          .gte('data_pagamento', `${ano}-${mes.toString().padStart(2, '0')}-01`)
          .lte('data_pagamento', `${ano}-${mes.toString().padStart(2, '0')}-${ultimoDia}`)
          .eq('estornado', false);

        const totalEntradasMes = (entradasMes || []).reduce(
          (acc, e) => acc + e.valor_pago + (e.juros || 0) - (e.desconto || 0),
          0
        );

        const { data: saidasMes } = await supabase
          .from('contas_pagar_pagamentos')
          .select('valor_pago, juros, desconto')
          .gte('data_pagamento', `${ano}-${mes.toString().padStart(2, '0')}-01`)
          .lte('data_pagamento', `${ano}-${mes.toString().padStart(2, '0')}-${ultimoDia}`)
          .eq('estornado', false);

        const totalSaidasMes = (saidasMes || []).reduce(
          (acc, s) => acc + s.valor_pago + (s.juros || 0) - (s.desconto || 0),
          0
        );

        const saldoFinal = saldoIni + totalEntradasMes - totalSaidasMes;

        mesesData.push({
          mes: data.toLocaleDateString('pt-BR', { month: 'short' }),
          mesCompleto: data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
          saldoInicial: saldoIni,
          entradas: totalEntradasMes,
          saidas: totalSaidasMes,
          saldoFinal: saldoFinal,
          resultado: totalEntradasMes - totalSaidasMes,
        });
      }

      setDadosMensais(mesesData);
    } catch (error) {
      console.error('Erro ao buscar dados mensais:', error);
    }
  };

  const fetchPrevisoes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const hoje = new Date();
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      const { data: contasReceber } = await supabase
        .from('contas_receber_parcelas')
        .select('valor_parcela, valor_pago')
        .lte('data_vencimento', fimMes.toISOString().split('T')[0])
        .in('status', ['aberto', 'atrasado', 'pagamento_parcial']);

      const totalAReceber = (contasReceber || []).reduce(
        (acc, c) => acc + (c.valor_parcela - (c.valor_pago || 0)),
        0
      );

      const { data: contasPagar } = await supabase
        .from('contas_pagar_parcelas')
        .select('valor_parcela, valor_pago')
        .lte('data_vencimento', fimMes.toISOString().split('T')[0])
        .in('status', ['aberto', 'atrasado', 'pagamento_parcial']);

      const totalAPagar = (contasPagar || []).reduce(
        (acc, c) => acc + (c.valor_parcela - (c.valor_pago || 0)),
        0
      );

      setContasAVencer({ receber: totalAReceber, pagar: totalAPagar });
      setPrevisaoSaldo(saldoFinal + totalAReceber - totalAPagar);
    } catch (error) {
      console.error('Erro ao buscar previsões:', error);
    }
  };

  const fetchAnaliseCategoria = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: entradas } = await supabase
        .from('contas_receber_pagamentos')
        .select('*')
        .gte('data_pagamento', dataInicio)
        .lte('data_pagamento', dataFim)
        .eq('estornado', false);

      const { data: saidas } = await supabase
        .from('contas_pagar_pagamentos')
        .select('*')
        .gte('data_pagamento', dataInicio)
        .lte('data_pagamento', dataFim)
        .eq('estornado', false);

      const categoriasMap: Record<string, { entradas: number; saidas: number }> = {};

      for (const e of entradas || []) {
        const { data: parcela } = await supabase
          .from('contas_receber_parcelas')
          .select('conta_receber_id')
          .eq('id', e.parcela_id)
          .single();

        if (parcela) {
          const { data: conta } = await supabase
            .from('contas_receber')
            .select('plano_conta_id')
            .eq('id', parcela.conta_receber_id)
            .single();

          if (conta?.plano_conta_id) {
            const { data: plano } = await supabase
              .from('plano_contas')
              .select('categoria_id')
              .eq('id', conta.plano_conta_id)
              .single();

            if (plano?.categoria_id) {
              const { data: categoria } = await supabase
                .from('categorias_plano_contas')
                .select('descricao')
                .eq('id', plano.categoria_id)
                .single();

              const catNome = categoria?.descricao || 'Outros';
              const valor = e.valor_pago + (e.juros || 0) - (e.desconto || 0);
              
              if (!categoriasMap[catNome]) {
                categoriasMap[catNome] = { entradas: 0, saidas: 0 };
              }
              categoriasMap[catNome].entradas += valor;
            }
          }
        }
      }

      for (const s of saidas || []) {
        const { data: parcela } = await supabase
          .from('contas_pagar_parcelas')
          .select('conta_pagar_id')
          .eq('id', s.parcela_id)
          .single();

        if (parcela) {
          const { data: conta } = await supabase
            .from('contas_pagar')
            .select('plano_contas_id')
            .eq('id', parcela.conta_pagar_id)
            .single();

          if (conta?.plano_contas_id) {
            const { data: plano } = await supabase
              .from('plano_contas')
              .select('categoria_id')
              .eq('id', conta.plano_contas_id)
              .single();

            if (plano?.categoria_id) {
              const { data: categoria } = await supabase
                .from('categorias_plano_contas')
                .select('descricao')
                .eq('id', plano.categoria_id)
                .single();

              const catNome = categoria?.descricao || 'Outros';
              const valor = s.valor_pago + (s.juros || 0) - (s.desconto || 0);
              
              if (!categoriasMap[catNome]) {
                categoriasMap[catNome] = { entradas: 0, saidas: 0 };
              }
              categoriasMap[catNome].saidas += valor;
            }
          }
        }
      }

      const categoriasArray = Object.keys(categoriasMap).map(cat => ({
        categoria: cat,
        entradas: categoriasMap[cat].entradas,
        saidas: categoriasMap[cat].saidas,
        saldo: categoriasMap[cat].entradas - categoriasMap[cat].saidas,
      }));

      setCategorias(categoriasArray);
    } catch (error) {
      console.error('Erro ao buscar análise por categoria:', error);
    }
  };

  const handleExportar = () => {
    try {
      // Preparar dados para CSV
      const csvData = [
        // Cabeçalho do resumo
        ['FLUXO DE CAIXA'],
        [`Período: ${formatarData(dataInicio)} a ${formatarData(dataFim)}`],
        [''],
        ['RESUMO'],
        ['Saldo Inicial', formatarValor(saldoInicial)],
        ['Total Entradas', formatarValor(totalEntradas)],
        ['Total Saídas', formatarValor(totalSaidas)],
        ['Saldo Final', formatarValor(saldoFinal)],
        [''],
        // Cabeçalho da tabela
        ['Data', 'Descrição', 'Cliente/Fornecedor', 'Entrada', 'Saída', 'Saldo'],
        // Dados
        ...movimentacoes.map(m => [
          formatarData(m.data),
          m.descricao,
          m.cliente_fornecedor,
          m.entrada > 0 ? formatarValor(m.entrada) : '',
          m.saida > 0 ? formatarValor(m.saida) : '',
          formatarValor(m.saldo),
        ]),
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `fluxo_caixa_${dataInicio}_${dataFim}.csv`;
      link.click();

      toast({
        title: '✅ Exportado',
        description: 'Fluxo de caixa exportado com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível exportar o relatório.',
        variant: 'destructive',
      });
    }
  };

  const formatarData = (dataISO) => {
    if (!dataISO) return '-';
    const data = new Date(dataISO + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');
  };

  const formatarValor = (valor) => {
    if (valor === undefined || valor === null) return 'R$ 0,00';
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  if (loading) return <div className="flex justify-center p-8">Carregando...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Fluxo de Caixa"
        description="Análise detalhada das movimentações financeiras"
        backButton={<BackButton to="/financeiro" />}
        actions={
          <Button onClick={handleExportar}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
        }
      />

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Banco</Label>
              <Select value={bancoFiltro} onValueChange={setBancoFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Bancos</SelectItem>
                  {bancos.map(banco => (
                    <SelectItem key={banco.id} value={banco.id}>
                      {banco.codigo} - {banco.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={fetchFluxoCaixa} className="w-full">
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Inicial</p>
                <p className="text-2xl font-bold">
                  {formatarValor(saldoInicial)}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entradas</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatarValor(totalEntradas)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saídas</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatarValor(totalSaidas)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Final</p>
                <p className={`text-2xl font-bold ${saldoFinal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatarValor(saldoFinal)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas */}
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="diario">Relatório Diário</TabsTrigger>
          <TabsTrigger value="mensal">Visão Mensal</TabsTrigger>
          <TabsTrigger value="grafico">Evolução (Gráfico)</TabsTrigger>
        </TabsList>

        {/* Aba: Relatório Diário */}
        <TabsContent value="diario" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Movimentações Detalhadas</CardTitle>
              <CardDescription>
                Todas as entradas e saídas do período com saldo progressivo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {movimentacoes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma movimentação encontrada no período.
                </div>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Cliente/Fornecedor</TableHead>
                        <TableHead className="text-right">Entrada</TableHead>
                        <TableHead className="text-right">Saída</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Linha de Saldo Inicial */}
                      <TableRow className="bg-muted/50">
                        <TableCell className="font-medium">
                          {formatarData(dataInicio)}
                        </TableCell>
                        <TableCell colSpan={2} className="font-medium">
                          SALDO INICIAL
                        </TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right font-bold">
                          {formatarValor(saldoInicial)}
                        </TableCell>
                      </TableRow>

                      {/* Movimentações */}
                      {movimentacoes.map((mov) => (
                        <TableRow key={mov.id}>
                          <TableCell>{formatarData(mov.data)}</TableCell>
                          <TableCell>{mov.descricao}</TableCell>
                          <TableCell>{mov.cliente_fornecedor}</TableCell>
                          <TableCell className="text-right">
                            {mov.entrada > 0 ? (
                              <span className="text-green-600 font-medium">
                                {formatarValor(mov.entrada)}
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {mov.saida > 0 ? (
                              <span className="text-red-600 font-medium">
                                {formatarValor(mov.saida)}
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatarValor(mov.saldo)}
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Linha de Totais */}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={3}>TOTAIS</TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatarValor(totalEntradas)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatarValor(totalSaidas)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatarValor(saldoFinal)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Visão Mensal */}
        <TabsContent value="mensal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparativo dos Últimos 12 Meses</CardTitle>
              <CardDescription>
                Evolução mês a mês das entradas, saídas e saldo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dadosMensais.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando dados mensais...
                </div>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mês</TableHead>
                        <TableHead className="text-right">Saldo Inicial</TableHead>
                        <TableHead className="text-right">Entradas</TableHead>
                        <TableHead className="text-right">Saídas</TableHead>
                        <TableHead className="text-right">Resultado</TableHead>
                        <TableHead className="text-right">Saldo Final</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dadosMensais.map((mes, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{mes.mesCompleto}</TableCell>
                          <TableCell className="text-right">
                            {formatarValor(mes.saldoInicial)}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            {formatarValor(mes.entradas)}
                          </TableCell>
                          <TableCell className="text-right text-red-600 font-medium">
                            {formatarValor(mes.saidas)}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${
                            mes.resultado >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatarValor(mes.resultado)}
                          </TableCell>
                          <TableCell className={`text-right font-bold ${
                            mes.saldoFinal >= 0 ? 'text-blue-600' : 'text-red-600'
                          }`}>
                            {formatarValor(mes.saldoFinal)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {dadosMensais.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Entradas x Saídas (Mensal)</CardTitle>
                <CardDescription>
                  Comparação visual das movimentações mensais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dadosMensais}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="mes" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => 
                          value.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            minimumFractionDigits: 0,
                          })
                        }
                      />
                      <Tooltip 
                        formatter={(value) => formatarValor(value as number)}
                        labelStyle={{ color: '#000' }}
                      />
                      <Legend />
                      <Bar dataKey="entradas" fill="#10b981" name="Entradas" />
                      <Bar dataKey="saidas" fill="#ef4444" name="Saídas" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {categorias.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Análise por Categoria</CardTitle>
                <CardDescription>
                  Distribuição das movimentações por categoria do plano de contas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Entradas</TableHead>
                        <TableHead className="text-right">Saídas</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categorias.map((cat, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{cat.categoria}</TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatarValor(cat.entradas)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatarValor(cat.saidas)}
                          </TableCell>
                          <TableCell className={`text-right font-bold ${
                            cat.saldo >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatarValor(cat.saldo)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-2 border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Previsão até o Fim do Mês
              </CardTitle>
              <CardDescription>
                Baseado nas contas a receber e pagar ainda em aberto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Saldo Atual</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatarValor(saldoFinal)}
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">A Receber</p>
                  <p className="text-2xl font-bold text-green-600">
                    + {formatarValor(contasAVencer.receber)}
                  </p>
                </div>

                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">A Pagar</p>
                  <p className="text-2xl font-bold text-red-600">
                    - {formatarValor(contasAVencer.pagar)}
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-500">
                  <p className="text-sm text-muted-foreground mb-1">Saldo Previsto</p>
                  <p className={`text-2xl font-bold ${
                    previsaoSaldo >= 0 ? 'text-purple-600' : 'text-red-600'
                  }`}>
                    {formatarValor(previsaoSaldo)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Gráfico */}
        <TabsContent value="grafico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução do Saldo</CardTitle>
              <CardDescription>
                Visualização gráfica da evolução do saldo ao longo do período
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dadosGrafico.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Sem dados para exibir o gráfico.
                </div>
              ) : (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dadosGrafico}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="data" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => 
                          value.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            minimumFractionDigits: 0,
                          })
                        }
                      />
                      <Tooltip 
                        formatter={(value) => formatarValor(value)}
                        labelStyle={{ color: '#000' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="saldo" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        name="Saldo"
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de Análise */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Variação do Período</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${
                  (saldoFinal - saldoInicial) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatarValor(saldoFinal - saldoInicial)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {((saldoFinal - saldoInicial) >= 0 ? 'Aumento' : 'Redução')} no saldo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resultado do Período</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${
                  (totalEntradas - totalSaidas) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatarValor(totalEntradas - totalSaidas)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Entradas - Saídas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Maior Saldo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600">
                  {formatarValor(Math.max(...movimentacoes.map(m => m.saldo), saldoInicial))}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Pico do período
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
