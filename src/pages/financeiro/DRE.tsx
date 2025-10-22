import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

export default function DRE() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [mesInicio, setMesInicio] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${(hoje.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  const [mesFim, setMesFim] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${(hoje.getMonth() + 1).toString().padStart(2, '0')}`;
  });

  // Dados DRE
  const [receitas, setReceitas] = useState([]);
  const [custos, setCustos] = useState([]);
  const [despesas, setDespesas] = useState([]);
  
  // Totalizadores
  const [totalReceitas, setTotalReceitas] = useState(0);
  const [totalCustos, setTotalCustos] = useState(0);
  const [totalDespesas, setTotalDespesas] = useState(0);
  const [lucroOperacional, setLucroOperacional] = useState(0);
  const [lucroLiquido, setLucroLiquido] = useState(0);
  const [margemLiquida, setMargemLiquida] = useState(0);

  // Dados comparativos
  const [dadosComparativos, setDadosComparativos] = useState([]);

  useEffect(() => {
    fetchDRE();
  }, [mesInicio, mesFim]);

  const fetchDRE = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calcular datas do período
      const [anoIni, mesIni] = mesInicio.split('-').map(Number);
      const [anoFimCalc, mesFimCalc] = mesFim.split('-').map(Number);
      
      const dataInicio = `${anoIni}-${mesIni.toString().padStart(2, '0')}-01`;
      const ultimoDia = new Date(anoFimCalc, mesFimCalc, 0).getDate();
      const dataFimCalc2 = `${anoFimCalc}-${mesFimCalc.toString().padStart(2, '0')}-${ultimoDia}`;

      // Buscar RECEITAS (Contas a Receber pagas)
      const { data: receitasPagamentosData } = await supabase
        .from('contas_receber_pagamentos')
        .select('id, valor_pago, juros, desconto, parcela_id')
        .gte('data_pagamento', dataInicio)
        .lte('data_pagamento', dataFimCalc2)
        .eq('estornado', false);

      // Buscar parcelas relacionadas
      const parcelasRecIds = receitasPagamentosData?.map(p => p.parcela_id) || [];
      const { data: parcelasRecData } = parcelasRecIds.length > 0 
        ? await supabase
            .from('contas_receber_parcelas')
            .select('id, conta_receber_id')
            .in('id', parcelasRecIds)
        : { data: [] };

      // Buscar contas relacionadas
      const contasRecIds = parcelasRecData?.map((p: any) => p.conta_receber_id) || [];
      const { data: contasRecData } = contasRecIds.length > 0
        ? await supabase
            .from('contas_receber')
            .select('id, plano_conta_id')
            .in('id', contasRecIds)
        : { data: [] };

      // Buscar planos de contas
      const planosRecIds = contasRecData?.map((c: any) => c.plano_conta_id).filter(Boolean) || [];
      const { data: planosRecData } = planosRecIds.length > 0
        ? await supabase
            .from('plano_contas')
            .select(`
              id,
              codigo_estruturado,
              descricao,
              categoria_id
            `)
            .in('id', planosRecIds)
        : { data: [] };

      // Buscar categorias
      const catRecIds = planosRecData?.map((p: any) => p.categoria_id).filter(Boolean) || [];
      const { data: catRecData } = catRecIds.length > 0
        ? await supabase
            .from('categorias_plano_contas')
            .select('id, descricao')
            .in('id', catRecIds)
        : { data: [] };

      // Mapear dados
      const parcelasRecMap = new Map((parcelasRecData || []).map((p: any) => [p.id, p] as [string, any]));
      const contasRecMap = new Map((contasRecData || []).map((c: any) => [c.id, c] as [string, any]));
      const planosRecMap = new Map((planosRecData || []).map((p: any) => [p.id, p] as [string, any]));
      const catRecMap = new Map((catRecData || []).map((c: any) => [c.id, c] as [string, any]));

      // Processar RECEITAS por conta contábil
      const receitasMap: any = {};
      (receitasPagamentosData || []).forEach((r: any) => {
        const parcela: any = parcelasRecMap.get(r.parcela_id);
        if (!parcela) return;
        
        const conta: any = contasRecMap.get(parcela.conta_receber_id);
        if (!conta || !conta.plano_conta_id) return;
        
        const plano: any = planosRecMap.get(conta.plano_conta_id);
        if (!plano) return;

        const valor = r.valor_pago + (r.juros || 0) - (r.desconto || 0);
        const chave = plano.id;

        const categoria: any = catRecMap.get(plano.categoria_id);

        if (!receitasMap[chave]) {
          receitasMap[chave] = {
            codigo: plano.codigo_estruturado,
            descricao: plano.descricao,
            categoria: categoria?.descricao || 'Outras',
            valor: 0,
          };
        }
        receitasMap[chave].valor += valor;
      });

      const receitasArray = Object.values(receitasMap).sort(
        (a: any, b: any) => a.codigo.localeCompare(b.codigo)
      ) as any[];
      setReceitas(receitasArray);

      // Buscar CUSTOS E DESPESAS (Contas a Pagar pagas)
      const { data: custosPagamentosData } = await supabase
        .from('contas_pagar_pagamentos')
        .select('id, valor_pago, juros, desconto, parcela_id')
        .gte('data_pagamento', dataInicio)
        .lte('data_pagamento', dataFimCalc2)
        .eq('estornado', false);

      // Buscar parcelas relacionadas
      const parcelasPagIds = custosPagamentosData?.map(p => p.parcela_id) || [];
      const { data: parcelasPagData } = parcelasPagIds.length > 0
        ? await supabase
            .from('contas_pagar_parcelas')
            .select('id, conta_pagar_id')
            .in('id', parcelasPagIds)
        : { data: [] };

      // Buscar contas relacionadas
      const contasPagIds = parcelasPagData?.map((p: any) => p.conta_pagar_id) || [];
      const { data: contasPagData } = contasPagIds.length > 0
        ? await supabase
            .from('contas_pagar')
            .select('id, plano_contas_id')
            .in('id', contasPagIds)
        : { data: [] };

      // Buscar planos de contas
      const planosPagIds = contasPagData?.map((c: any) => c.plano_contas_id).filter(Boolean) || [];
      const { data: planosPagData } = planosPagIds.length > 0
        ? await supabase
            .from('plano_contas')
            .select(`
              id,
              codigo_estruturado,
              descricao,
              categoria_id
            `)
            .in('id', planosPagIds)
        : { data: [] };

      // Buscar categorias
      const catPagIds = planosPagData?.map((p: any) => p.categoria_id).filter(Boolean) || [];
      const { data: catPagData } = catPagIds.length > 0
        ? await supabase
            .from('categorias_plano_contas')
            .select('id, descricao')
            .in('id', catPagIds)
        : { data: [] };

      // Mapear dados
      const parcelasPagMap = new Map((parcelasPagData || []).map((p: any) => [p.id, p] as [string, any]));
      const contasPagMap = new Map((contasPagData || []).map((c: any) => [c.id, c] as [string, any]));
      const planosPagMap = new Map((planosPagData || []).map((p: any) => [p.id, p] as [string, any]));
      const catPagMap = new Map((catPagData || []).map((c: any) => [c.id, c] as [string, any]));

      // Processar CUSTOS E DESPESAS por conta contábil
      const custosMap: any = {};
      const despesasMap: any = {};

      (custosPagamentosData || []).forEach((c: any) => {
        const parcela: any = parcelasPagMap.get(c.parcela_id);
        if (!parcela) return;
        
        const conta: any = contasPagMap.get(parcela.conta_pagar_id);
        if (!conta || !conta.plano_contas_id) return;
        
        const plano: any = planosPagMap.get(conta.plano_contas_id);
        if (!plano) return;

        const valor = c.valor_pago + (c.juros || 0) - (c.desconto || 0);
        const chave = plano.id;
        const categoria: any = catPagMap.get(plano.categoria_id);
        const categoriaDescricao = categoria?.descricao || 'Outras';

        // Separar entre custos e despesas baseado na categoria ou código
        const ehCusto = categoriaDescricao.toLowerCase().includes('custo') || 
                        plano.descricao.toLowerCase().includes('custo') ||
                        plano.codigo_estruturado.startsWith('3.1');

        const map = ehCusto ? custosMap : despesasMap;

        if (!map[chave]) {
          map[chave] = {
            codigo: plano.codigo_estruturado,
            descricao: plano.descricao,
            categoria: categoriaDescricao,
            valor: 0,
          };
        }
        map[chave].valor += valor;
      });

      const custosArray = Object.values(custosMap).sort(
        (a: any, b: any) => a.codigo.localeCompare(b.codigo)
      ) as any[];
      const despesasArray = Object.values(despesasMap).sort(
        (a: any, b: any) => a.codigo.localeCompare(b.codigo)
      ) as any[];

      setCustos(custosArray);
      setDespesas(despesasArray);

      // Calcular totalizadores
      const totReceitas: number = receitasArray.reduce((acc: number, r: any) => acc + r.valor, 0);
      const totCustos: number = custosArray.reduce((acc: number, c: any) => acc + c.valor, 0);
      const totDespesas: number = despesasArray.reduce((acc: number, d: any) => acc + d.valor, 0);
      const lucroOp: number = totReceitas - totCustos;
      const lucroLiq: number = totReceitas - totCustos - totDespesas;
      const margem: number = totReceitas > 0 ? (lucroLiq / totReceitas) * 100 : 0;

      setTotalReceitas(totReceitas);
      setTotalCustos(totCustos);
      setTotalDespesas(totDespesas);
      setLucroOperacional(lucroOp);
      setLucroLiquido(lucroLiq);
      setMargemLiquida(margem);

      // Buscar dados comparativos (últimos 6 meses)
      await fetchComparativo(user.id);
    } catch (error) {
      console.error('Erro ao buscar DRE:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o DRE.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComparativo = async (userId: string) => {
    try {
      const dataRef = new Date(mesFim + '-01');
      const comparativos = [];

      for (let i = 5; i >= 0; i--) {
        const mes = new Date(dataRef.getFullYear(), dataRef.getMonth() - i, 1);
        const ano = mes.getFullYear();
        const mesNum = mes.getMonth() + 1;
        const dataIni = `${ano}-${mesNum.toString().padStart(2, '0')}-01`;
        const ultimoDia = new Date(ano, mesNum, 0).getDate();
        const dataFim = `${ano}-${mesNum.toString().padStart(2, '0')}-${ultimoDia}`;

        // Receitas do mês
        const { data: recMes } = await supabase
          .from('contas_receber_pagamentos')
          .select('valor_pago, juros, desconto')
          .gte('data_pagamento', dataIni)
          .lte('data_pagamento', dataFim)
          .eq('estornado', false);

        const receitasMes = (recMes || []).reduce(
          (acc, r) => acc + r.valor_pago + (r.juros || 0) - (r.desconto || 0),
          0
        );

        // Custos/Despesas do mês
        const { data: custMes } = await supabase
          .from('contas_pagar_pagamentos')
          .select('valor_pago, juros, desconto')
          .gte('data_pagamento', dataIni)
          .lte('data_pagamento', dataFim)
          .eq('estornado', false);

        const custosMes = (custMes || []).reduce(
          (acc, c) => acc + c.valor_pago + (c.juros || 0) - (c.desconto || 0),
          0
        );

        comparativos.push({
          mes: mes.toLocaleDateString('pt-BR', { month: 'short' }),
          mesCompleto: mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
          receitas: receitasMes,
          custos: custosMes,
          resultado: receitasMes - custosMes,
        });
      }

      setDadosComparativos(comparativos);
    } catch (error) {
      console.error('Erro ao buscar comparativos:', error);
    }
  };

  const handleExportar = () => {
    try {
      const csvData = [
        ['DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO (DRE)'],
        [`Período: ${mesInicio} a ${mesFim}`],
        [''],
        ['RECEITAS'],
        ['Código', 'Descrição', 'Categoria', 'Valor'],
        ...receitas.map((r: any) => [r.codigo, r.descricao, r.categoria, formatarValor(r.valor)]),
        ['', '', 'TOTAL RECEITAS', formatarValor(totalReceitas)],
        [''],
        ['CUSTOS'],
        ['Código', 'Descrição', 'Categoria', 'Valor'],
        ...custos.map((c: any) => [c.codigo, c.descricao, c.categoria, formatarValor(c.valor)]),
        ['', '', 'TOTAL CUSTOS', formatarValor(totalCustos)],
        [''],
        ['', '', 'LUCRO BRUTO', formatarValor(lucroOperacional)],
        [''],
        ['DESPESAS OPERACIONAIS'],
        ['Código', 'Descrição', 'Categoria', 'Valor'],
        ...despesas.map((d: any) => [d.codigo, d.descricao, d.categoria, formatarValor(d.valor)]),
        ['', '', 'TOTAL DESPESAS', formatarValor(totalDespesas)],
        [''],
        ['', '', 'LUCRO LÍQUIDO', formatarValor(lucroLiquido)],
        ['', '', 'MARGEM LÍQUIDA', `${margemLiquida.toFixed(2)}%`],
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `DRE_${mesInicio}_${mesFim}.csv`;
      link.click();

      toast({
        title: '✅ Exportado',
        description: 'DRE exportado com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível exportar o DRE.',
        variant: 'destructive',
      });
    }
  };

  const formatarValor = (valor: number) => {
    if (valor === undefined || valor === null) return 'R$ 0,00';
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Preparar dados para gráficos
  const dadosPizza = [
    { name: 'Receitas', value: totalReceitas, color: '#10b981' },
    { name: 'Custos', value: totalCustos, color: '#ef4444' },
    { name: 'Despesas', value: totalDespesas, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  if (loading) return <div className="flex justify-center p-8">Carregando...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/financeiro')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">DRE - Demonstração do Resultado</h1>
            <p className="text-muted-foreground">
              Análise completa de receitas, custos e resultado
            </p>
          </div>
        </div>
        <Button onClick={handleExportar}>
          <Download className="mr-2 h-4 w-4" />
          Exportar DRE
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Mês Início</Label>
              <Input
                type="month"
                value={mesInicio}
                onChange={(e) => setMesInicio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Mês Fim</Label>
              <Input
                type="month"
                value={mesFim}
                onChange={(e) => setMesFim(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={fetchDRE} className="w-full">
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receitas</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatarValor(totalReceitas)}
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
                <p className="text-sm text-muted-foreground">Custos</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatarValor(totalCustos)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Despesas</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatarValor(totalDespesas)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lucro Líquido</p>
                <p className={`text-2xl font-bold ${lucroLiquido >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatarValor(lucroLiquido)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Margem Líquida</p>
                <p className={`text-2xl font-bold ${margemLiquida >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {margemLiquida.toFixed(1)}%
                </p>
              </div>
              <Percent className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas */}
      <Tabs defaultValue="dre" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dre">DRE Detalhado</TabsTrigger>
          <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
        </TabsList>

        {/* Aba: DRE Detalhado */}
        <TabsContent value="dre" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Demonstração do Resultado do Exercício</CardTitle>
              <CardDescription>
                Estrutura completa do DRE com todas as contas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* RECEITAS */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold">RECEITAS OPERACIONAIS</h3>
                </div>
                {receitas.length === 0 ? (
                  <p className="text-sm text-muted-foreground pl-4">Nenhuma receita no período</p>
                ) : (
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {receitas.map((r: any, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono">{r.codigo}</TableCell>
                            <TableCell>{r.descricao}</TableCell>
                            <TableCell>{r.categoria}</TableCell>
                            <TableCell className="text-right font-medium text-green-600">
                              {formatarValor(r.valor)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={3} className="font-bold">
                            TOTAL RECEITAS
                          </TableCell>
                          <TableCell className="text-right font-bold text-green-600">
                            {formatarValor(totalReceitas)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <Separator />

              {/* CUSTOS */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold">(-) CUSTOS OPERACIONAIS</h3>
                </div>
                {custos.length === 0 ? (
                  <p className="text-sm text-muted-foreground pl-4">Nenhum custo no período</p>
                ) : (
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {custos.map((c: any, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono">{c.codigo}</TableCell>
                            <TableCell>{c.descricao}</TableCell>
                            <TableCell>{c.categoria}</TableCell>
                            <TableCell className="text-right font-medium text-red-600">
                              {formatarValor(c.valor)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={3} className="font-bold">
                            TOTAL CUSTOS
                          </TableCell>
                          <TableCell className="text-right font-bold text-red-600">
                            {formatarValor(totalCustos)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <Separator className="border-2" />

              {/* LUCRO BRUTO */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">LUCRO BRUTO</h3>
                  <p className={`text-2xl font-bold ${lucroOperacional >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatarValor(lucroOperacional)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* DESPESAS */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold">(-) DESPESAS OPERACIONAIS</h3>
                </div>
                {despesas.length === 0 ? (
                  <p className="text-sm text-muted-foreground pl-4">Nenhuma despesa no período</p>
                ) : (
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {despesas.map((d: any, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono">{d.codigo}</TableCell>
                            <TableCell>{d.descricao}</TableCell>
                            <TableCell>{d.categoria}</TableCell>
                            <TableCell className="text-right font-medium text-orange-600">
                              {formatarValor(d.valor)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={3} className="font-bold">
                            TOTAL DESPESAS
                          </TableCell>
                          <TableCell className="text-right font-bold text-orange-600">
                            {formatarValor(totalDespesas)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <Separator className="border-2" />

              {/* RESULTADO FINAL */}
              <div className="bg-purple-50 border-2 border-purple-500 p-6 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold">LUCRO LÍQUIDO</h3>
                    <p className={`text-3xl font-bold ${lucroLiquido >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                      {formatarValor(lucroLiquido)}
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Margem Líquida</span>
                    <span className={`font-bold ${margemLiquida >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                      {margemLiquida.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico Pizza */}
          {dadosPizza.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Valores</CardTitle>
                <CardDescription>
                  Composição percentual das movimentações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={dadosPizza}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${formatarValor(entry.value)}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dadosPizza.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatarValor(Number(value))} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba: Comparativo */}
        <TabsContent value="comparativo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparativo dos Últimos 6 Meses</CardTitle>
              <CardDescription>
                Evolução das receitas, custos e resultado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dadosComparativos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando dados comparativos...
                </div>
              ) : (
                <>
                  <div className="border rounded-lg overflow-x-auto mb-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mês</TableHead>
                          <TableHead className="text-right">Receitas</TableHead>
                          <TableHead className="text-right">Custos/Despesas</TableHead>
                          <TableHead className="text-right">Resultado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dadosComparativos.map((mes: any, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{mes.mesCompleto}</TableCell>
                            <TableCell className="text-right text-green-600 font-medium">
                              {formatarValor(mes.receitas)}
                            </TableCell>
                            <TableCell className="text-right text-red-600 font-medium">
                              {formatarValor(mes.custos)}
                            </TableCell>
                            <TableCell className={`text-right font-bold ${
                              mes.resultado >= 0 ? 'text-blue-600' : 'text-red-600'
                            }`}>
                              {formatarValor(mes.resultado)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dadosComparativos}
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
                          formatter={(value) => formatarValor(Number(value))}
                          labelStyle={{ color: '#000' }}
                        />
                        <Legend />
                        <Bar dataKey="receitas" fill="#10b981" name="Receitas" />
                        <Bar dataKey="custos" fill="#ef4444" name="Custos/Despesas" />
                        <Bar dataKey="resultado" fill="#3b82f6" name="Resultado" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
