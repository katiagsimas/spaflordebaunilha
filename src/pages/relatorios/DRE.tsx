import { useState, useMemo } from "react";
import { 
  TrendingUp, Download, FileSpreadsheet, ArrowLeft, ChevronDown, ChevronRight,
  AlertCircle, TrendingDown, DollarSign, Percent, Loader2
} from "lucide-react";
import { useContasReceber } from "@/hooks/useContasReceber";
import { useContasPagar } from "@/hooks/useContasPagar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from "recharts";
import { cn } from "@/lib/utils";

interface ContaReceber {
  id: string;
  descricao: string;
  categoriaId: string;
  valor: number;
  dataRecebimento?: string;
  status: string;
}

interface ContaPagar {
  id: string;
  descricao: string;
  categoriaId: string;
  valor: number;
  dataPagamento?: string;
  status: string;
}

interface ItemDRE {
  label: string;
  valor: number;
  tipo: 'receita' | 'despesa' | 'totalizador';
  nivel: number;
  expansivel?: boolean;
  expandido?: boolean;
  filhos?: ItemDRE[];
  detalhes?: Array<{ descricao: string; valor: number; data: string }>;
}

export default function DRE() {
  const navigate = useNavigate();
  const [mesAno, setMesAno] = useState(format(new Date(), 'yyyy-MM'));
  const [tipoVisualizacao, setTipoVisualizacao] = useState<'detalhada' | 'resumida'>('detalhada');
  const [itemDetalhado, setItemDetalhado] = useState<ItemDRE | null>(null);
  const [itensExpandidos, setItensExpandidos] = useState<Set<string>>(new Set([
    'despesas-operacionais',
    'despesas-administrativas',
    'despesas-vendas',
  ]));

  // Buscar dados do Supabase
  const { items: contasReceber, loading: loadingReceber } = useContasReceber();
  const { items: contasPagar, loading: loadingPagar } = useContasPagar();

  // Filtrar dados do período
  const dadosPeriodo = useMemo(() => {
    const [ano, mes] = mesAno.split('-').map(Number);
    const inicio = startOfMonth(new Date(ano, mes - 1));
    const fim = endOfMonth(new Date(ano, mes - 1));
    const inicioStr = format(inicio, 'yyyy-MM-dd');
    const fimStr = format(fim, 'yyyy-MM-dd');

    const receitasPeriodo = contasReceber.filter(c => 
      c.status === 'recebido' && 
      c.data_recebimento &&
      c.data_recebimento >= inicioStr && 
      c.data_recebimento <= fimStr
    );

    const despesasPeriodo = contasPagar.filter(c => 
      c.status === 'pago' && 
      c.data_pagamento &&
      c.data_pagamento >= inicioStr && 
      c.data_pagamento <= fimStr
    );

    return { receitas: receitasPeriodo, despesas: despesasPeriodo };
  }, [contasReceber, contasPagar, mesAno]);

  // Calcular estrutura do DRE
  const estruturaDRE = useMemo(() => {
    const { receitas, despesas } = dadosPeriodo;

    // RECEITAS
    const receitaBruta = receitas.reduce((acc, c) => acc + c.valor, 0);
    const deducoes = 0; // TODO: implementar categorias de dedução
    const receitaLiquida = receitaBruta - deducoes;

    // CUSTOS
    const custos = despesas
      .filter(d => d.categoria_id && (d.categoria_id.includes('custo') || d.categoria_id.includes('cmv')))
      .reduce((acc, c) => acc + c.valor, 0);
    
    const lucroBruto = receitaLiquida - custos;
    const margemBruta = receitaLiquida > 0 ? (lucroBruto / receitaLiquida) * 100 : 0;

    // DESPESAS OPERACIONAIS
    const despesasAdm = despesas
      .filter(d => d.categoria_id && (d.categoria_id.includes('adm') || d.categoria_id.includes('administrativa')))
      .reduce((acc, c) => acc + c.valor, 0);

    const despesasVendas = despesas
      .filter(d => d.categoria_id && (d.categoria_id.includes('vendas') || d.categoria_id.includes('comercial')))
      .reduce((acc, c) => acc + c.valor, 0);

    const despesasFinanceiras = despesas
      .filter(d => d.categoria_id && d.categoria_id.includes('financeira') && !d.categoria_id.includes('rec'))
      .reduce((acc, c) => acc + c.valor, 0);

    const receitasFinanceiras = receitas
      .filter(r => r.categoria_id && r.categoria_id.includes('financeira'))
      .reduce((acc, c) => acc + c.valor, 0);

    const despesasOperacionais = despesasAdm + despesasVendas + despesasFinanceiras - receitasFinanceiras;
    
    const resultadoOperacional = lucroBruto - despesasOperacionais;
    const margemOperacional = receitaLiquida > 0 ? (resultadoOperacional / receitaLiquida) * 100 : 0;

    // RESULTADO FINAL
    const outrasReceitas = 0;
    const depreciacao = 0;
    const lair = resultadoOperacional + outrasReceitas - depreciacao;
    
    const impostosLucro = 0; // TODO: calcular impostos
    const lucroLiquido = lair - impostosLucro;
    const margemLiquida = receitaLiquida > 0 ? (lucroLiquido / receitaLiquida) * 100 : 0;

    return {
      receitaBruta,
      deducoes,
      receitaLiquida,
      custos,
      lucroBruto,
      margemBruta,
      despesasAdm,
      despesasVendas,
      despesasFinanceiras,
      receitasFinanceiras,
      despesasOperacionais,
      resultadoOperacional,
      margemOperacional,
      outrasReceitas,
      depreciacao,
      lair,
      impostosLucro,
      lucroLiquido,
      margemLiquida,
    };
  }, [dadosPeriodo]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const toggleItem = (key: string) => {
    setItensExpandidos(prev => {
      const novo = new Set(prev);
      if (novo.has(key)) {
        novo.delete(key);
      } else {
        novo.add(key);
      }
      return novo;
    });
  };

  const exportarExcel = () => {
    const dados = [
      { Item: 'RECEITA BRUTA', Valor: estruturaDRE.receitaBruta.toFixed(2) },
      { Item: '(-) DEDUÇÕES DA RECEITA', Valor: estruturaDRE.deducoes.toFixed(2) },
      { Item: '(=) RECEITA LÍQUIDA', Valor: estruturaDRE.receitaLiquida.toFixed(2) },
      { Item: '', Valor: '' },
      { Item: '(-) CUSTOS', Valor: estruturaDRE.custos.toFixed(2) },
      { Item: '(=) LUCRO BRUTO', Valor: estruturaDRE.lucroBruto.toFixed(2) },
      { Item: 'Margem Bruta', Valor: `${estruturaDRE.margemBruta.toFixed(2)}%` },
      { Item: '', Valor: '' },
      { Item: '(-) DESPESAS OPERACIONAIS', Valor: estruturaDRE.despesasOperacionais.toFixed(2) },
      { Item: '    Despesas Administrativas', Valor: estruturaDRE.despesasAdm.toFixed(2) },
      { Item: '    Despesas com Vendas', Valor: estruturaDRE.despesasVendas.toFixed(2) },
      { Item: '    Despesas Financeiras', Valor: estruturaDRE.despesasFinanceiras.toFixed(2) },
      { Item: '(+) RECEITAS FINANCEIRAS', Valor: estruturaDRE.receitasFinanceiras.toFixed(2) },
      { Item: '(=) RESULTADO OPERACIONAL', Valor: estruturaDRE.resultadoOperacional.toFixed(2) },
      { Item: 'Margem Operacional', Valor: `${estruturaDRE.margemOperacional.toFixed(2)}%` },
      { Item: '', Valor: '' },
      { Item: '(-) IMPOSTOS SOBRE LUCRO', Valor: estruturaDRE.impostosLucro.toFixed(2) },
      { Item: '(=) LUCRO LÍQUIDO', Valor: estruturaDRE.lucroLiquido.toFixed(2) },
      { Item: 'Margem Líquida', Valor: `${estruturaDRE.margemLiquida.toFixed(2)}%` },
    ];

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DRE");
    
    ws['!cols'] = [{ wch: 40 }, { wch: 20 }];

    XLSX.writeFile(wb, `dre-${mesAno}.xlsx`);
    toast.success('DRE exportado com sucesso!');
  };

  // Dados para gráfico de pizza
  const dadosDespesas = useMemo(() => [
    { name: 'Administrativas', value: estruturaDRE.despesasAdm, color: '#E5C89F' },
    { name: 'Vendas', value: estruturaDRE.despesasVendas, color: '#D88B8B' },
    { name: 'Financeiras', value: estruturaDRE.despesasFinanceiras, color: '#7BA8D8' },
  ].filter(d => d.value > 0), [estruturaDRE]);

  const LinhaItem = ({ 
    label, 
    valor, 
    tipo, 
    nivel = 0,
    margem,
    expansivel = false,
    itemKey,
    semBorda = false
  }: { 
    label: string; 
    valor: number; 
    tipo: 'receita' | 'despesa' | 'totalizador';
    nivel?: number;
    margem?: number;
    expansivel?: boolean;
    itemKey?: string;
    semBorda?: boolean;
  }) => {
    const expandido = itemKey ? itensExpandidos.has(itemKey) : false;
    const isTotalizador = tipo === 'totalizador';
    const isPositivo = valor >= 0;

    return (
      <div 
        className={cn(
          "py-3 px-4",
          isTotalizador && "bg-muted/30 border-y border-border",
          semBorda && "border-none",
          !isTotalizador && "hover:bg-muted/20 transition-colors"
        )}
        style={{ paddingLeft: `${nivel * 1.5 + 1}rem` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            {expansivel && itemKey && (
              <button
                onClick={() => toggleItem(itemKey)}
                className="p-0.5 hover:bg-muted rounded"
              >
                {expandido ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            )}
            <span className={cn(
              isTotalizador && "font-bold text-base",
              !isTotalizador && "text-sm"
            )}>
              {label}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className={cn(
              "font-semibold",
              isTotalizador && "text-base",
              !isTotalizador && "text-sm",
              tipo === 'receita' && isPositivo && "text-success",
              tipo === 'despesa' && "text-destructive",
              tipo === 'totalizador' && valor >= 0 && "text-success",
              tipo === 'totalizador' && valor < 0 && "text-destructive"
            )}>
              {formatCurrency(Math.abs(valor))}
            </span>
            
            {margem !== undefined && (
              <span className="text-xs text-muted-foreground min-w-[60px] text-right">
                {formatPercent(margem)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loadingReceber || loadingPagar) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/relatorios')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">DRE - Demonstrativo de Resultado</h1>
            </div>
            <p className="text-base text-muted-foreground">
              Análise de receitas, custos e lucro
            </p>
          </div>
        </div>

        <Button onClick={exportarExcel} variant="outline" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Exportar Excel
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Período e Visualização</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="mesAno">Mês/Ano</Label>
              <Input
                id="mesAno"
                type="month"
                value={mesAno}
                onChange={(e) => setMesAno(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="visualizacao">Tipo de Visualização</Label>
              <Select value={tipoVisualizacao} onValueChange={(v: any) => setTipoVisualizacao(v)}>
                <SelectTrigger id="visualizacao">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="detalhada">Visão Detalhada</SelectItem>
                  <SelectItem value="resumida">Visão Resumida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Receita Líquida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(estruturaDRE.receitaLiquida)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Lucro Bruto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn(
              "text-2xl font-bold",
              estruturaDRE.lucroBruto >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(estruturaDRE.lucroBruto)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Margem: {formatPercent(estruturaDRE.margemBruta)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Resultado Operacional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn(
              "text-2xl font-bold",
              estruturaDRE.resultadoOperacional >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(estruturaDRE.resultadoOperacional)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Margem: {formatPercent(estruturaDRE.margemOperacional)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {estruturaDRE.lucroLiquido >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              Lucro Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn(
              "text-2xl font-bold",
              estruturaDRE.lucroLiquido >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(estruturaDRE.lucroLiquido)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Margem: {formatPercent(estruturaDRE.margemLiquida)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {estruturaDRE.margemBruta < 20 && estruturaDRE.receitaLiquida > 0 && (
        <div className="mb-6 bg-warning/10 border-l-4 border-warning p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            <p className="font-semibold text-foreground">Margem Bruta Baixa</p>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Sua margem bruta está abaixo de 20%. Considere revisar custos ou precificação.
          </p>
        </div>
      )}

      {estruturaDRE.lucroLiquido < 0 && (
        <div className="mb-6 bg-destructive/10 border-l-4 border-destructive p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="font-semibold text-foreground">Prejuízo no Período</p>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            O resultado do período foi negativo. Analise as despesas e busque aumentar as receitas.
          </p>
        </div>
      )}

      {/* Estrutura do DRE */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Demonstrativo de Resultado - {format(parseISO(mesAno + '-01'), 'MMMM/yyyy', { locale: ptBR })}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {/* RECEITAS */}
            <LinhaItem label="(+) RECEITA BRUTA" valor={estruturaDRE.receitaBruta} tipo="receita" />
            {tipoVisualizacao === 'detalhada' && estruturaDRE.deducoes > 0 && (
              <LinhaItem label="(-) DEDUÇÕES DA RECEITA" valor={estruturaDRE.deducoes} tipo="despesa" nivel={1} />
            )}
            <LinhaItem label="(=) RECEITA LÍQUIDA" valor={estruturaDRE.receitaLiquida} tipo="totalizador" />

            {/* CUSTOS */}
            <div className="h-4 bg-muted/10" />
            <LinhaItem label="(-) CUSTOS" valor={estruturaDRE.custos} tipo="despesa" />
            <LinhaItem 
              label="(=) LUCRO BRUTO" 
              valor={estruturaDRE.lucroBruto} 
              tipo="totalizador"
              margem={estruturaDRE.margemBruta}
            />

            {/* DESPESAS OPERACIONAIS */}
            <div className="h-4 bg-muted/10" />
            <LinhaItem 
              label="(-) DESPESAS OPERACIONAIS" 
              valor={estruturaDRE.despesasOperacionais} 
              tipo="despesa"
              expansivel={tipoVisualizacao === 'detalhada'}
              itemKey="despesas-operacionais"
            />
            
            {tipoVisualizacao === 'detalhada' && itensExpandidos.has('despesas-operacionais') && (
              <>
                <LinhaItem label="Despesas Administrativas" valor={estruturaDRE.despesasAdm} tipo="despesa" nivel={1} />
                <LinhaItem label="Despesas com Vendas" valor={estruturaDRE.despesasVendas} tipo="despesa" nivel={1} />
                <LinhaItem label="Despesas Financeiras" valor={estruturaDRE.despesasFinanceiras} tipo="despesa" nivel={1} />
                <LinhaItem label="(+) Receitas Financeiras" valor={estruturaDRE.receitasFinanceiras} tipo="receita" nivel={1} />
              </>
            )}

            <LinhaItem 
              label="(=) RESULTADO OPERACIONAL" 
              valor={estruturaDRE.resultadoOperacional} 
              tipo="totalizador"
              margem={estruturaDRE.margemOperacional}
            />

            {/* RESULTADO FINAL */}
            <div className="h-4 bg-muted/10" />
            {tipoVisualizacao === 'detalhada' && (
              <>
                {estruturaDRE.outrasReceitas > 0 && (
                  <LinhaItem label="(+/-) OUTRAS RECEITAS/DESPESAS" valor={estruturaDRE.outrasReceitas} tipo="receita" />
                )}
                {estruturaDRE.depreciacao > 0 && (
                  <LinhaItem label="(-) DEPRECIAÇÃO E AMORTIZAÇÃO" valor={estruturaDRE.depreciacao} tipo="despesa" />
                )}
                <LinhaItem label="(=) RESULTADO ANTES DOS IMPOSTOS (LAIR)" valor={estruturaDRE.lair} tipo="totalizador" />
                {estruturaDRE.impostosLucro > 0 && (
                  <LinhaItem label="(-) IMPOSTOS SOBRE O LUCRO" valor={estruturaDRE.impostosLucro} tipo="despesa" />
                )}
              </>
            )}
            
            <LinhaItem 
              label="(=) LUCRO LÍQUIDO DO PERÍODO" 
              valor={estruturaDRE.lucroLiquido} 
              tipo="totalizador"
              margem={estruturaDRE.margemLiquida}
              semBorda
            />
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      {dadosDespesas.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição das Despesas Operacionais</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dadosDespesas}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                  >
                    {dadosDespesas.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Margens do Período</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart 
                  data={[
                    { name: 'Margem Bruta', valor: estruturaDRE.margemBruta },
                    { name: 'Margem Operacional', valor: estruturaDRE.margemOperacional },
                    { name: 'Margem Líquida', valor: estruturaDRE.margemLiquida },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                  <Bar dataKey="valor" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
