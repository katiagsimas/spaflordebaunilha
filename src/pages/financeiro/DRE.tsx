import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDateToISO } from "@/lib/dateUtils";
import { PageHeader } from "@/components/PageHeader";
import { FinanceiroNav } from "@/components/financeiro/FinanceiroNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ArrowLeft, 
  Download, 
  Printer,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGlobalLoading } from "@/contexts/GlobalLoadingContext";
import * as XLSX from "@/lib/xlsxShim";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface LinhasDRE {
  receitaBruta: number[];
  receitaVendas: number[];
  impostosSobreVendas: number[];
  outrasDeducoes: number[];
  totalDeducoes: number[];
  receitaLiquida: number[];
  cmv: number[];
  despesasComerciais: number[];
  despesaOperacionalVariavel: number[];
  campanhasSazonais: number[];
  totalCustosVariaveis: number[];
  margemContribuicao: number[];
  margemContribuicaoPerc: number[];
  despesasPessoal: number[];
  despesasOcupacao: number[];
  despesasAdministrativas: number[];
  totalCustosFixos: number[];
  resultadoOperacional: number[];
  receitasFinanceiras: number[];
  despesasFinanceiras: number[];
  receitasNaoOperacionais: number[];
  gastosNaoOperacionais: number[];
  resultadoNaoOperacional: number[];
  lair: number[];
  impostoRenda: number[];
  lucroLiquido: number[];
  margemLiquidaPerc: number[];
}

export default function DRE() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { showLoading, hideLoading } = useGlobalLoading();
  const [ano, setAno] = useState(() => {
    const anoParam = searchParams.get("ano");
    const parsed = anoParam ? parseInt(anoParam, 10) : NaN;
    return !isNaN(parsed) && parsed >= 2000 && parsed <= 2100 ? parsed : new Date().getFullYear();
  });
  const [dados, setDados] = useState<LinhasDRE | null>(null);
  const [aliquotaSimples, setAliquotaSimples] = useState<number | null>(null);
  
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [anoMensal, setAnoMensal] = useState(new Date().getFullYear());

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  useEffect(() => {
    carregarDRE();
  }, [ano]);

  async function carregarDRE() {
    showLoading('Carregando DRE...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar alíquota efetiva do Simples Nacional configurada
      const { data: configJuros } = await supabase
        .from('configuracoes_juros')
        .select('aliquota_simples_nacional')
        .eq('usuario_id', user.id)
        .maybeSingle();
      const aliquota = (configJuros as any)?.aliquota_simples_nacional;
      const aliquotaNum = aliquota != null ? Number(aliquota) : null;
      setAliquotaSimples(aliquotaNum);

      const linhas: LinhasDRE = {
        receitaBruta: Array(12).fill(0),
        receitaVendas: Array(12).fill(0),
        impostosSobreVendas: Array(12).fill(0),
        outrasDeducoes: Array(12).fill(0),
        totalDeducoes: Array(12).fill(0),
        receitaLiquida: Array(12).fill(0),
        cmv: Array(12).fill(0),
        despesasComerciais: Array(12).fill(0),
        despesaOperacionalVariavel: Array(12).fill(0),
        campanhasSazonais: Array(12).fill(0),
        totalCustosVariaveis: Array(12).fill(0),
        margemContribuicao: Array(12).fill(0),
        margemContribuicaoPerc: Array(12).fill(0),
        despesasPessoal: Array(12).fill(0),
        despesasOcupacao: Array(12).fill(0),
        despesasAdministrativas: Array(12).fill(0),
        totalCustosFixos: Array(12).fill(0),
        resultadoOperacional: Array(12).fill(0),
        receitasFinanceiras: Array(12).fill(0),
        despesasFinanceiras: Array(12).fill(0),
        receitasNaoOperacionais: Array(12).fill(0),
        gastosNaoOperacionais: Array(12).fill(0),
        resultadoNaoOperacional: Array(12).fill(0),
        lair: Array(12).fill(0),
        impostoRenda: Array(12).fill(0),
        lucroLiquido: Array(12).fill(0),
        margemLiquidaPerc: Array(12).fill(0),
      };

      // Regime de CAIXA: buscar pagamentos realizados no ano, em paralelo.
      // Join até categorias_plano_contas para obter codigo + faixa_dre de cada pagamento.
      // Filtros de usuario_id via inner join nas tabelas pai garantem isolamento.
      const inicioAno = `${ano}-01-01`;
      const fimAno = `${ano}-12-31`;

      const [pagamentosReceberRes, pagamentosPagarRes] = await Promise.all([
        supabase
          .from("contas_receber_pagamentos")
          .select(`
            valor_pago,
            juros,
            desconto,
            data_pagamento,
            contas_receber_parcelas!inner (
              contas_receber!inner (
                usuario_id,
                plano_contas!plano_conta_id (
                  categorias_plano_contas (
                    faixa_dre,
                    subfaixa_dre
                  )
                )
              )
            )
          `)
          .eq("estornado", false)
          .eq("contas_receber_parcelas.contas_receber.usuario_id", user.id)
          .gte("data_pagamento", inicioAno)
          .lte("data_pagamento", fimAno),
        supabase
          .from("contas_pagar_pagamentos")
          .select(`
            valor_pago,
            juros,
            desconto,
            data_pagamento,
            contas_pagar_parcelas!inner (
              contas_pagar!inner (
                usuario_id,
                plano_contas!plano_contas_id (
                  categorias_plano_contas (
                    faixa_dre,
                    subfaixa_dre
                  )
                )
              )
            )
          `)
          .eq("estornado", false)
          .eq("contas_pagar_parcelas.contas_pagar.usuario_id", user.id)
          .gte("data_pagamento", inicioAno)
          .lte("data_pagamento", fimAno),
      ]);

      const pagamentosReceber = (pagamentosReceberRes.data as any[]) || [];
      const pagamentosPagar = (pagamentosPagarRes.data as any[]) || [];

      // Acumuladores por mês: granular (subfaixa_dre) + faixa_dre
      const subfaixasReceberMes: Array<Record<string, number>> = Array.from({ length: 12 }, () => ({}));
      const subfaixasPagarMes: Array<Record<string, number>> = Array.from({ length: 12 }, () => ({}));
      const faixasReceberMes: Array<Record<string, number>> = Array.from({ length: 12 }, () => ({}));
      const faixasPagarMes: Array<Record<string, number>> = Array.from({ length: 12 }, () => ({}));

      const extrairMes = (dataPagamento: string | null): number | null => {
        if (!dataPagamento) return null;
        const [anoP, mesP] = String(dataPagamento).split('-').map(Number);
        if (anoP !== ano) return null;
        return (mesP || 1) - 1;
      };

      // Distribui pagamentos de RECEBER por mês (data_pagamento)
      pagamentosReceber.forEach((pag) => {
        const mes = extrairMes(pag.data_pagamento);
        if (mes === null) return;
        const valor = (pag.valor_pago || 0) + (pag.juros || 0) - (pag.desconto || 0);
        const cat = pag?.contas_receber_parcelas?.contas_receber?.plano_contas?.categorias_plano_contas;
        const subfaixa = cat?.subfaixa_dre ?? null;
        const faixa = cat?.faixa_dre ?? null;
        if (subfaixa) {
          subfaixasReceberMes[mes][subfaixa] = (subfaixasReceberMes[mes][subfaixa] || 0) + valor;
        }
        if (faixa) {
          faixasReceberMes[mes][faixa] = (faixasReceberMes[mes][faixa] || 0) + valor;
        }
      });

      // Distribui pagamentos de PAGAR por mês (data_pagamento)
      pagamentosPagar.forEach((pag) => {
        const mes = extrairMes(pag.data_pagamento);
        if (mes === null) return;
        const valor = (pag.valor_pago || 0) + (pag.juros || 0) - (pag.desconto || 0);
        const cat = pag?.contas_pagar_parcelas?.contas_pagar?.plano_contas?.categorias_plano_contas;
        const subfaixa = cat?.subfaixa_dre ?? null;
        const faixa = cat?.faixa_dre ?? null;
        if (subfaixa) {
          subfaixasPagarMes[mes][subfaixa] = (subfaixasPagarMes[mes][subfaixa] || 0) + valor;
        }
        if (faixa) {
          faixasPagarMes[mes][faixa] = (faixasPagarMes[mes][faixa] || 0) + valor;
        }
      });

      for (let mes = 0; mes < 12; mes++) {
        const subReceber = subfaixasReceberMes[mes];
        const subPagar = subfaixasPagarMes[mes];
        const faixasReceber = faixasReceberMes[mes];
        const faixasPagar = faixasPagarMes[mes];

        // Linhas granulares (mapeadas via subfaixa_dre — sem códigos numéricos)
        linhas.receitaVendas[mes] = subReceber['Receita com vendas'] || 0;
        linhas.receitasFinanceiras[mes] = subReceber['Receitas financeiras'] || 0;
        linhas.receitasNaoOperacionais[mes] = subReceber['Receitas não operacionais'] || 0;

        linhas.impostosSobreVendas[mes] = subPagar['Impostos sobre vendas'] || 0;
        linhas.outrasDeducoes[mes] = subPagar['Outras deduções sobre vendas'] || 0;
        linhas.cmv[mes] = subPagar['CMV'] || 0;
        linhas.despesasComerciais[mes] = subPagar['Despesas comerciais'] || 0;
        linhas.despesaOperacionalVariavel[mes] = subPagar['Despesa operacional variável'] || 0;
        linhas.campanhasSazonais[mes] = subPagar['Campanhas sazonais'] || 0;
        linhas.despesasPessoal[mes] = subPagar['Despesas com pessoal'] || 0;
        linhas.despesasOcupacao[mes] = subPagar['Despesas com ocupação'] || 0;
        linhas.despesasAdministrativas[mes] = subPagar['Despesas administrativas'] || 0;
        linhas.despesasFinanceiras[mes] = subPagar['Despesas financeiras'] || 0;
        linhas.gastosNaoOperacionais[mes] = subPagar['Gastos não operacionais'] || 0;

        // Totais via faixa_dre — inclui categorias customizadas
        linhas.receitaBruta[mes] = faixasReceber['Receitas'] || 0;
        linhas.totalDeducoes[mes] = faixasPagar['Deduções sobre vendas'] || 0;
        linhas.receitaLiquida[mes] = linhas.receitaBruta[mes] - linhas.totalDeducoes[mes];

        linhas.totalCustosVariaveis[mes] = faixasPagar['Custos variáveis'] || 0;
        linhas.margemContribuicao[mes] = linhas.receitaLiquida[mes] - linhas.totalCustosVariaveis[mes];
        linhas.margemContribuicaoPerc[mes] = linhas.receitaBruta[mes] !== 0
          ? (linhas.margemContribuicao[mes] / linhas.receitaBruta[mes]) * 100
          : 0;

        linhas.totalCustosFixos[mes] = faixasPagar['Custos fixos'] || 0;
        linhas.resultadoOperacional[mes] = linhas.margemContribuicao[mes] - linhas.totalCustosFixos[mes];

        const receitasNaoOpFaixa = faixasReceber['Resultado não operacional'] || 0;
        const gastosNaoOpFaixa = faixasPagar['Resultado não operacional'] || 0;
        linhas.resultadoNaoOperacional[mes] = receitasNaoOpFaixa - gastosNaoOpFaixa;

        const receitasFinFaixa = faixasReceber['Resultado financeiro'] || 0;
        const despesasFinFaixa = faixasPagar['Resultado financeiro'] || 0;
        if (receitasFinFaixa > linhas.receitasFinanceiras[mes]) {
          linhas.receitasFinanceiras[mes] = receitasFinFaixa;
        }
        if (despesasFinFaixa > linhas.despesasFinanceiras[mes]) {
          linhas.despesasFinanceiras[mes] = despesasFinFaixa;
        }

        linhas.lair[mes] = linhas.resultadoOperacional[mes] + linhas.receitasFinanceiras[mes] -
                           linhas.despesasFinanceiras[mes] + linhas.resultadoNaoOperacional[mes];

        // Imposto de Renda/CSLL = alíquota efetiva do Simples Nacional × LAIR (apenas quando LAIR > 0)
        if (aliquotaNum != null && linhas.lair[mes] > 0) {
          linhas.impostoRenda[mes] = linhas.lair[mes] * (aliquotaNum / 100);
        } else {
          linhas.impostoRenda[mes] = 0;
        }
        linhas.lucroLiquido[mes] = linhas.lair[mes] - linhas.impostoRenda[mes];

        linhas.margemLiquidaPerc[mes] = linhas.receitaBruta[mes] !== 0
          ? (linhas.lucroLiquido[mes] / linhas.receitaBruta[mes]) * 100
          : 0;
      }

      // Sobrescrever meses com fechamento status='fechado' usando o snapshot gravado
      // (garante integridade histórica: meses fechados não mudam ao alterar lançamentos).
      const { data: fechamentosFechados } = await (supabase.from("fechamentos_mensais" as any) as any)
        .select("mes_referencia, snapshot")
        .eq("status", "fechado")
        .gte("mes_referencia", `${ano}-01-01`)
        .lte("mes_referencia", `${ano}-12-01`);

      ((fechamentosFechados as any[]) || []).forEach((f) => {
        const ld = f?.snapshot?.linhas_dre;
        if (!ld) return; // snapshot antigo sem detalhamento: mantém o cálculo ao vivo
        const mesIdx = Number(String(f.mes_referencia).split('-')[1]) - 1;
        if (mesIdx < 0 || mesIdx > 11) return;
        (Object.keys(linhas) as Array<keyof LinhasDRE>).forEach((k) => {
          if (typeof ld[k] === 'number') {
            (linhas[k] as number[])[mesIdx] = ld[k];
          }
        });
      });

      setDados(linhas);
    } catch (error) {
      console.error("Erro ao carregar DRE:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o DRE.",
        variant: "destructive",
      });
    } finally {
      hideLoading();
    }
  }

  const calcularTotal = (valores: number[]) => {
    return valores.reduce((sum, val) => sum + val, 0);
  };

  const calcularAV = (valor: number, receitaBrutaTotal: number) => {
    if (receitaBrutaTotal === 0) return 0;
    return (valor / receitaBrutaTotal) * 100;
  };

  const exportarExcel = () => {
    if (!dados) return;

    const receitaBrutaTotal = calcularTotal(dados.receitaBruta);

    const linha = (label: string, valores: number[]) => [
      label,
      ...valores.map(v => Number(v.toFixed(2))),
      Number(calcularTotal(valores).toFixed(2)),
      calcularAV(calcularTotal(valores), receitaBrutaTotal).toFixed(0) + "%",
    ];

    const linhaPerc = (label: string, perc: number[], totalPerc: number) => [
      label,
      ...perc.map(v => v.toFixed(0) + "%"),
      totalPerc.toFixed(0) + "%",
      "-",
    ];

    const totalMargemContribPerc = receitaBrutaTotal !== 0
      ? (calcularTotal(dados.margemContribuicao) / receitaBrutaTotal) * 100
      : 0;
    const totalMargemLiquidaPerc = receitaBrutaTotal !== 0
      ? (calcularTotal(dados.lucroLiquido) / receitaBrutaTotal) * 100
      : 0;

    const worksheet_data = [
      ["Demonstrativo de Resultado", "", "", "", "", "", "", "", "", "", "", "", "", ano, "AV%"],
      ["Descrição", ...meses, ano.toString(), "AV%"],
      // RECEITA BRUTA
      ["(+) Receita Bruta", ...dados.receitaBruta.map(v => Number(v.toFixed(2))), Number(receitaBrutaTotal.toFixed(2)), "100%"],
      linha("    1 - Receita com Vendas", dados.receitaVendas),
      // DEDUÇÕES
      linha("(-) Deduções Sobre Vendas", dados.totalDeducoes),
      linha("    2 - Impostos Sobre Vendas", dados.impostosSobreVendas),
      linha("    99 - Outras Deduções sobre Vendas", dados.outrasDeducoes),
      // RECEITA LÍQUIDA
      linha("(=) Receita Líquida", dados.receitaLiquida),
      // CUSTOS VARIÁVEIS
      linha("(-) Custos Variáveis", dados.totalCustosVariaveis),
      linha("    3 - CMV - Custo de Mercadoria Vendida", dados.cmv),
      linha("    8 - Despesas Comerciais", dados.despesasComerciais),
      linha("    103 - Despesa Operacional Variável", dados.despesaOperacionalVariavel),
      linha("    112 - Campanhas Sazonais", dados.campanhasSazonais),
      // MARGEM DE CONTRIBUIÇÃO
      linha("(=) Margem de Contribuição", dados.margemContribuicao),
      linhaPerc("(=) % Margem de Contribuição", dados.margemContribuicaoPerc, totalMargemContribPerc),
      // CUSTOS FIXOS
      linha("(-) Custos Fixos", dados.totalCustosFixos),
      linha("    5 - Despesas com Pessoal", dados.despesasPessoal),
      linha("    6 - Despesas com Ocupação", dados.despesasOcupacao),
      linha("    7 - Despesas Administrativas", dados.despesasAdministrativas),
      // RESULTADO OPERACIONAL
      linha("(=) Resultado Operacional", dados.resultadoOperacional),
      // FINANCEIRO
      linha("  106 - Receitas Financeiras", dados.receitasFinanceiras),
      linha("  107 - Despesas Financeiras", dados.despesasFinanceiras),
      // NÃO OPERACIONAL
      linha("Resultado Não Operacional", dados.resultadoNaoOperacional),
      linha("    9 - Receitas não Operacionais", dados.receitasNaoOperacionais),
      linha("    10 - Gastos não Operacionais", dados.gastosNaoOperacionais),
      // LAIR
      linha("(=) Lucro Antes do Imposto de Renda (LAIR)", dados.lair),
      // IMPOSTO
      linha("(-) Imposto de Renda e CSLL", dados.impostoRenda),
      // LUCRO LÍQUIDO
      linha("(=) Lucro Líquido", dados.lucroLiquido),
      // MARGEM LÍQUIDA
      linhaPerc("(=) % Margem Líquida", dados.margemLiquidaPerc, totalMargemLiquidaPerc),
    ];


    const worksheet = XLSX.utils.aoa_to_sheet(worksheet_data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DRE");
    
    XLSX.writeFile(workbook, `DRE_${ano}.xlsx`);

    toast({
      title: "✅ Exportado",
      description: "DRE exportado com sucesso!",
    });
  };

  const imprimir = () => {
    window.print();
  };

  if (!dados) return null;

  const receitaBrutaTotal = calcularTotal(dados.receitaBruta);
  const receitaTotalAnual = calcularTotal(dados.receitaBruta);
  const custosTotaisAnual = calcularTotal(dados.totalDeducoes) + calcularTotal(dados.totalCustosVariaveis) + 
                            calcularTotal(dados.totalCustosFixos) + calcularTotal(dados.despesasFinanceiras);
  const lucroLiquidoAnual = calcularTotal(dados.lucroLiquido);

  const dadosGraficoAnual = meses.map((mes, i) => ({
    mes: mes.substring(0, 3),
    receitas: dados.receitaBruta[i],
    custos: dados.totalDeducoes[i] + dados.totalCustosVariaveis[i] + dados.totalCustosFixos[i] + dados.despesasFinanceiras[i],
    lucro: dados.lucroLiquido[i]
  }));

  const indexMesSelecionado = anoMensal === ano ? mesSelecionado : -1;
  const dadosMensal = indexMesSelecionado >= 0 ? {
    margemContribuicao: dados.margemContribuicao[indexMesSelecionado],
    margemContribuicaoPerc: dados.margemContribuicaoPerc[indexMesSelecionado],
    resultadoOperacional: dados.resultadoOperacional[indexMesSelecionado],
    margemLiquidaPerc: dados.margemLiquidaPerc[indexMesSelecionado]
  } : null;

  return (
    <div className="container mx-auto px-6 pt-1 pb-6 space-y-6 no-print">
      <PageHeader
        title="Demonstrativo de Resultado"
        description="DRE — análise completa do exercício."
        backButton={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/financeiro")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <FinanceiroNav current="/financeiro/dre" />
          </div>
        }
        actions={
          <div className="flex gap-2">
            <Button onClick={imprimir} variant="outline">
              <Printer className="mr-2 h-4 w-4" /> Imprimir
            </Button>
            <Button onClick={exportarExcel} className="bg-sfb-terracota hover:bg-sfb-terracota-escuro text-sfb-baunilha">
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
          </div>
        }
      />


      {/* Filtro de Ano */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label>Ano de Exercício</Label>
              <Input
                type="number"
                value={ano}
                onChange={(e) => setAno(parseInt(e.target.value))}
                min="2020"
                max="2030"
                className="w-32"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela DRE */}
      <Card>
        <CardHeader>
          <CardTitle>Demonstrativo de Resultado - {ano}</CardTitle>
          <CardDescription>
            Análise vertical e comparativo mensal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Descrição</TableHead>
                  {meses.map((mes) => (
                    <TableHead key={mes} className="text-right">{mes.substring(0, 3)}</TableHead>
                  ))}
                  <TableHead className="text-right font-bold">{ano}</TableHead>
                  <TableHead className="text-right font-bold">AV%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* RECEITA BRUTA */}
                <TableRow className="bg-success/10">
                  <TableCell className="font-semibold">(+) Receita Bruta</TableCell>
                  {dados.receitaBruta.map((val, i) => (
                    <TableCell key={i} className="text-right">{val > 0 ? val.toFixed(2) : '-'}</TableCell>
                  ))}
                  <TableCell className="text-right font-bold">{receitaBrutaTotal.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold">100%</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8">1 - Receita com Vendas</TableCell>
                  {dados.receitaVendas.map((val, i) => (
                    <TableCell key={i} className="text-right">{val > 0 ? val.toFixed(2) : '-'}</TableCell>
                  ))}
                  <TableCell className="text-right">{calcularTotal(dados.receitaVendas).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{calcularAV(calcularTotal(dados.receitaVendas), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                {/* DEDUÇÕES */}
                <TableRow className="bg-sfb-coral/10">
                  <TableCell className="font-semibold">(-) Deduções Sobre Vendas</TableCell>
                  {dados.totalDeducoes.map((val, i) => (
                    <TableCell key={i} className="text-right">{val > 0 ? val.toFixed(2) : '-'}</TableCell>
                  ))}
                  <TableCell className="text-right font-bold">{calcularTotal(dados.totalDeducoes).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold">{calcularAV(calcularTotal(dados.totalDeducoes), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8">2 - Impostos Sobre Vendas</TableCell>
                  {dados.impostosSobreVendas.map((val, i) => (
                    <TableCell key={i} className="text-right">{val > 0 ? val.toFixed(2) : '-'}</TableCell>
                  ))}
                  <TableCell className="text-right">{calcularTotal(dados.impostosSobreVendas).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{calcularAV(calcularTotal(dados.impostosSobreVendas), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8">99 - Outras Deduções sobre Vendas</TableCell>
                  {dados.outrasDeducoes.map((val, i) => (
                    <TableCell key={i} className="text-right">{val > 0 ? val.toFixed(2) : '-'}</TableCell>
                  ))}
                  <TableCell className="text-right">{calcularTotal(dados.outrasDeducoes).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{calcularAV(calcularTotal(dados.outrasDeducoes), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                {/* RECEITA LÍQUIDA */}
                <TableRow className="bg-sfb-areia/10">
                  <TableCell className="font-semibold">(=) Receita Líquida</TableCell>
                  {dados.receitaLiquida.map((val, i) => (
                    <TableCell key={i} className={`text-right ${val >= 0 ? 'text-success' : 'text-sfb-coral'}`}>
                      {val.toFixed(2)}
                    </TableCell>
                  ))}
                  <TableCell className={`text-right font-bold ${calcularTotal(dados.receitaLiquida) >= 0 ? 'text-success' : 'text-sfb-coral'}`}>
                    {calcularTotal(dados.receitaLiquida).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-bold">{calcularAV(calcularTotal(dados.receitaLiquida), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                {/* CUSTOS VARIÁVEIS */}
                <TableRow className="bg-warning/10">
                  <TableCell className="font-semibold">(-) Custos Variáveis</TableCell>
                  {dados.totalCustosVariaveis.map((val, i) => (
                    <TableCell key={i} className="text-right">{val > 0 ? val.toFixed(2) : '-'}</TableCell>
                  ))}
                  <TableCell className="text-right font-bold">{calcularTotal(dados.totalCustosVariaveis).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold">{calcularAV(calcularTotal(dados.totalCustosVariaveis), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8">3 - CMV - Custo de Mercadoria Vendida</TableCell>
                  {dados.cmv.map((val, i) => (
                    <TableCell key={i} className="text-right">{val > 0 ? val.toFixed(2) : '-'}</TableCell>
                  ))}
                  <TableCell className="text-right">{calcularTotal(dados.cmv).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{calcularAV(calcularTotal(dados.cmv), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8">8 - Despesas Comerciais</TableCell>
                  {dados.despesasComerciais.map((val, i) => (
                    <TableCell key={i} className="text-right">{val > 0 ? val.toFixed(2) : '-'}</TableCell>
                  ))}
                  <TableCell className="text-right">{calcularTotal(dados.despesasComerciais).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{calcularAV(calcularTotal(dados.despesasComerciais), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8">103 - Despesa Operacional Variável</TableCell>
                  {dados.despesaOperacionalVariavel.map((val, i) => (
                    <TableCell key={i} className="text-right">{val > 0 ? val.toFixed(2) : '-'}</TableCell>
                  ))}
                  <TableCell className="text-right">{calcularTotal(dados.despesaOperacionalVariavel).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{calcularAV(calcularTotal(dados.despesaOperacionalVariavel), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8">112 - Campanhas Sazonais</TableCell>
                  {dados.campanhasSazonais.map((val, i) => (
                    <TableCell key={i} className="text-right">{val > 0 ? val.toFixed(2) : '-'}</TableCell>
                  ))}
                  <TableCell className="text-right">{calcularTotal(dados.campanhasSazonais).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{calcularAV(calcularTotal(dados.campanhasSazonais), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                {/* MARGEM DE CONTRIBUIÇÃO */}
                <TableRow className="bg-sfb-pink/15">
                  <TableCell className="font-semibold">(=) Margem de Contribuição</TableCell>
                  {dados.margemContribuicao.map((val, i) => (
                    <TableCell key={i} className={`text-right ${val >= 0 ? 'text-sfb-pink' : 'text-sfb-coral'}`}>
                      {val.toFixed(2)}
                    </TableCell>
                  ))}
                  <TableCell className={`text-right font-bold ${calcularTotal(dados.margemContribuicao) >= 0 ? 'text-sfb-pink' : 'text-sfb-coral'}`}>
                    {calcularTotal(dados.margemContribuicao).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-bold">{calcularAV(calcularTotal(dados.margemContribuicao), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-semibold">(=) % Margem de Contribuição</TableCell>
                  {dados.margemContribuicaoPerc.map((val, i) => (
                    <TableCell key={i} className="text-right">{val.toFixed(0)}%</TableCell>
                  ))}
                  <TableCell className="text-right font-bold">
                    {receitaBrutaTotal !== 0 
                      ? ((calcularTotal(dados.margemContribuicao) / receitaBrutaTotal) * 100).toFixed(0) 
                      : 0}%
                  </TableCell>
                  <TableCell className="text-right">-</TableCell>
                </TableRow>

                {/* CUSTOS FIXOS */}
                <TableRow className="bg-warning/10">
                  <TableCell className="font-semibold">(-) Custos Fixos</TableCell>
                  {dados.totalCustosFixos.map((val, i) => (
                    <TableCell key={i} className="text-right">{val > 0 ? val.toFixed(2) : '-'}</TableCell>
                  ))}
                  <TableCell className="text-right font-bold">{calcularTotal(dados.totalCustosFixos).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold">{calcularAV(calcularTotal(dados.totalCustosFixos), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8">5 - Despesas com Pessoal</TableCell>
                  {dados.despesasPessoal.map((val, i) => (
                    <TableCell key={i} className="text-right">{val > 0 ? val.toFixed(2) : '-'}</TableCell>
                  ))}
                  <TableCell className="text-right">{calcularTotal(dados.despesasPessoal).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{calcularAV(calcularTotal(dados.despesasPessoal), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8">6 - Despesas com Ocupação</TableCell>
                  {dados.despesasOcupacao.map((val, i) => (
                    <TableCell key={i} className="text-right">{val > 0 ? val.toFixed(2) : '-'}</TableCell>
                  ))}
                  <TableCell className="text-right">{calcularTotal(dados.despesasOcupacao).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{calcularAV(calcularTotal(dados.despesasOcupacao), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8">7 - Despesas Administrativas</TableCell>
                  {dados.despesasAdministrativas.map((val, i) => (
                    <TableCell key={i} className="text-right">{val > 0 ? val.toFixed(2) : '-'}</TableCell>
                  ))}
                  <TableCell className="text-right">{calcularTotal(dados.despesasAdministrativas).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{calcularAV(calcularTotal(dados.despesasAdministrativas), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                {/* RESULTADO OPERACIONAL */}
                <TableRow className="bg-sfb-areia/15">
                  <TableCell className="font-semibold">(=) Resultado Operacional</TableCell>
                  {dados.resultadoOperacional.map((val, i) => (
                    <TableCell key={i} className={`text-right ${val >= 0 ? 'text-primary' : 'text-sfb-coral'}`}>
                      {val.toFixed(2)}
                    </TableCell>
                  ))}
                  <TableCell className={`text-right font-bold ${calcularTotal(dados.resultadoOperacional) >= 0 ? 'text-primary' : 'text-sfb-coral'}`}>
                    {calcularTotal(dados.resultadoOperacional).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-bold">{calcularAV(calcularTotal(dados.resultadoOperacional), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                {/* FINANCEIRO */}
                <TableRow>
                  <TableCell className="pl-4">106 - Receitas Financeiras</TableCell>
                  {dados.receitasFinanceiras.map((val, i) => (
                    <TableCell key={i} className="text-right">{val > 0 ? val.toFixed(2) : '-'}</TableCell>
                  ))}
                  <TableCell className="text-right">{calcularTotal(dados.receitasFinanceiras).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{calcularAV(calcularTotal(dados.receitasFinanceiras), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="pl-4">107 - Despesas Financeiras</TableCell>
                  {dados.despesasFinanceiras.map((val, i) => (
                    <TableCell key={i} className="text-right">{val > 0 ? val.toFixed(2) : '-'}</TableCell>
                  ))}
                  <TableCell className="text-right">{calcularTotal(dados.despesasFinanceiras).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{calcularAV(calcularTotal(dados.despesasFinanceiras), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                {/* NÃO OPERACIONAL */}
                <TableRow className="bg-muted/30">
                  <TableCell className="font-semibold">Resultado Não Operacional</TableCell>
                  {dados.resultadoNaoOperacional.map((val, i) => (
                    <TableCell key={i} className={`text-right ${val >= 0 ? '' : 'text-sfb-coral'}`}>
                      {val.toFixed(2)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold">{calcularTotal(dados.resultadoNaoOperacional).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold">{calcularAV(calcularTotal(dados.resultadoNaoOperacional), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8">9 - Receitas não Operacionais</TableCell>
                  {dados.receitasNaoOperacionais.map((val, i) => (
                    <TableCell key={i} className="text-right">{val > 0 ? val.toFixed(2) : '-'}</TableCell>
                  ))}
                  <TableCell className="text-right">{calcularTotal(dados.receitasNaoOperacionais).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{calcularAV(calcularTotal(dados.receitasNaoOperacionais), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8">10 - Gastos não Operacionais</TableCell>
                  {dados.gastosNaoOperacionais.map((val, i) => (
                    <TableCell key={i} className="text-right">{val > 0 ? val.toFixed(2) : '-'}</TableCell>
                  ))}
                  <TableCell className="text-right">{calcularTotal(dados.gastosNaoOperacionais).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{calcularAV(calcularTotal(dados.gastosNaoOperacionais), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                {/* LAIR */}
                <TableRow className="bg-warning/15">
                  <TableCell className="font-semibold">(=) Lucro Antes do Imposto de Renda (LAIR)</TableCell>
                  {dados.lair.map((val, i) => (
                    <TableCell key={i} className={`text-right ${val >= 0 ? 'text-warning' : 'text-sfb-coral'}`}>
                      {val.toFixed(2)}
                    </TableCell>
                  ))}
                  <TableCell className={`text-right font-bold ${calcularTotal(dados.lair) >= 0 ? 'text-warning' : 'text-sfb-coral'}`}>
                    {calcularTotal(dados.lair).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-bold">{calcularAV(calcularTotal(dados.lair), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                {/* IMPOSTO */}
                <TableRow>
                  <TableCell>(-) Imposto de Renda e CSLL{aliquotaSimples == null ? ' *' : ` (${aliquotaSimples.toString().replace('.', ',')}%)`}</TableCell>
                  {dados.impostoRenda.map((val, i) => (
                    <TableCell key={i} className="text-right">
                      {aliquotaSimples == null ? '—' : (val > 0 ? val.toFixed(2) : '-')}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">{aliquotaSimples == null ? '—' : calcularTotal(dados.impostoRenda).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{aliquotaSimples == null ? '—' : calcularAV(calcularTotal(dados.impostoRenda), receitaBrutaTotal).toFixed(0) + '%'}</TableCell>
                </TableRow>

                {/* LUCRO LÍQUIDO */}
                <TableRow className="bg-primary/10">
                  <TableCell className="font-bold">(=) Lucro Líquido</TableCell>
                  {dados.lucroLiquido.map((val, i) => (
                    <TableCell key={i} className={`text-right font-semibold ${val >= 0 ? 'text-primary' : 'text-sfb-coral'}`}>
                      {val.toFixed(2)}
                    </TableCell>
                  ))}
                  <TableCell className={`text-right font-bold ${calcularTotal(dados.lucroLiquido) >= 0 ? 'text-primary' : 'text-sfb-coral'}`}>
                    {calcularTotal(dados.lucroLiquido).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-bold">{calcularAV(calcularTotal(dados.lucroLiquido), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                {/* MARGEM LÍQUIDA */}
                <TableRow>
                  <TableCell className="font-semibold">(=) % Margem Líquida</TableCell>
                  {dados.margemLiquidaPerc.map((val, i) => (
                    <TableCell key={i} className="text-right">{val.toFixed(0)}%</TableCell>
                  ))}
                  <TableCell className="text-right font-bold">
                    {receitaBrutaTotal !== 0 
                      ? ((calcularTotal(dados.lucroLiquido) / receitaBrutaTotal) * 100).toFixed(0) 
                      : 0}%
                  </TableCell>
                  <TableCell className="text-right">-</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          {aliquotaSimples == null && (
            <p className="mt-3 text-sm text-muted-foreground">
              * Alíquota do Simples Nacional não configurada. Acesse{' '}
              <button
                type="button"
                onClick={() => navigate('/configuracoes')}
                className="underline text-primary hover:opacity-80"
              >
                Configurações
              </button>{' '}
              para informar.
            </p>
          )}
        </CardContent>
      </Card>

      {/* VISÃO ECONÔMICA ANUAL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Visão Econômica Anual - {ano}
          </CardTitle>
          <CardDescription>
            Resumo dos principais indicadores do ano
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Cards de Indicadores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-success/30 bg-success/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <DollarSign className="h-8 w-8 text-success" />
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Receitas Totais</p>
                    <p className="text-2xl font-bold text-success">
                      R$ {receitaTotalAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-sfb-coral/30 bg-sfb-coral/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <TrendingDown className="h-8 w-8 text-sfb-coral" />
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Custos Totais</p>
                    <p className="text-2xl font-bold text-sfb-coral">
                      R$ {custosTotaisAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`${lucroLiquidoAnual >= 0 ? 'border-primary bg-primary/10' : 'border-sfb-coral bg-sfb-coral/10'}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <TrendingUp className={`h-8 w-8 ${lucroLiquidoAnual >= 0 ? 'text-primary' : 'text-sfb-coral'}`} />
                  <div className="text-right">
                    <p className={`text-sm ${lucroLiquidoAnual >= 0 ? 'text-primary' : 'text-sfb-coral'}`}>
                      Lucro Líquido
                    </p>
                    <p className={`text-2xl font-bold ${lucroLiquidoAnual >= 0 ? 'text-primary' : 'text-sfb-coral'}`}>
                      R$ {lucroLiquidoAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Evolução Mensal</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGraficoAnual}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  />
                  <Legend />
                  <Bar dataKey="receitas" fill="hsl(var(--success))" name="Receitas" />
                  <Bar dataKey="custos" fill="hsl(var(--error))" name="Custos" />
                  <Bar dataKey="lucro" fill="hsl(var(--accent))" name="Lucro" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VISÃO ECONÔMICA MENSAL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Visão Econômica Mensal
          </CardTitle>
          <CardDescription>
            Indicadores detalhados do mês selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex items-end gap-4 mb-6">
            <div className="space-y-2 w-32">
              <Label>Ano</Label>
              <Select
                value={anoMensal.toString()}
                onValueChange={(value) => setAnoMensal(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 w-40">
              <Label>Mês</Label>
              <Select
                value={mesSelecionado.toString()}
                onValueChange={(value) => setMesSelecionado(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((mes, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {mes}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Indicadores do Mês */}
          {anoMensal === ano && dadosMensal ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-sfb-pink/30 bg-sfb-pink/15">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    Margem de Contribuição (R$)
                  </p>
                  <p className={`text-2xl font-bold ${dadosMensal.margemContribuicao >= 0 ? 'text-sfb-pink' : 'text-sfb-coral'}`}>
                    R$ {dadosMensal.margemContribuicao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-sfb-areia/40 bg-sfb-areia/10">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    Margem de Contribuição (%)
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {dadosMensal.margemContribuicaoPerc.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card className="border-indigo-200 bg-indigo-50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    Resultado Operacional (R$)
                  </p>
                  <p className={`text-2xl font-bold ${dadosMensal.resultadoOperacional >= 0 ? 'text-primary' : 'text-sfb-coral'}`}>
                    R$ {dadosMensal.resultadoOperacional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/50 bg-primary/10">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    Margem Líquida (%)
                  </p>
                  <p className={`text-2xl font-bold ${dadosMensal.margemLiquidaPerc >= 0 ? 'text-primary' : 'text-sfb-coral'}`}>
                    {dadosMensal.margemLiquidaPerc.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Selecione o ano {ano} para visualizar os indicadores mensais
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}