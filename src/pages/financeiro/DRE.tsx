import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDateToISO } from "@/lib/dateUtils";
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
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGlobalLoading } from "@/contexts/GlobalLoadingContext";
import * as XLSX from "xlsx";
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
  const { toast } = useToast();
  const { showLoading, hideLoading } = useGlobalLoading();
  const [ano, setAno] = useState(new Date().getFullYear());
  const [dados, setDados] = useState<LinhasDRE | null>(null);
  
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

      // Buscar todos os planos de contas e suas categorias
      const { data: planosContas } = await supabase
        .from("plano_contas")
        .select(`
          id,
          codigo_estruturado,
          categoria_id,
          categorias_plano_contas (
            codigo
          )
        `)
        .eq("user_id", user.id);

      const planosMap = new Map();
      planosContas?.forEach((plano: any) => {
        const codigoCategoria = plano.categorias_plano_contas?.codigo;
        planosMap.set(plano.id, codigoCategoria);
      });

      for (let mes = 0; mes < 12; mes++) {
        const dataInicio = new Date(ano, mes, 1);
        const dataFim = new Date(ano, mes + 1, 0);
        
        const inicioStr = formatDateToISO(dataInicio);
        const fimStr = formatDateToISO(dataFim);

        // Buscar receitas (todas as parcelas com base na data de emissão)
        const { data: contasReceber } = await supabase
          .from("contas_receber")
          .select(`
            id,
            plano_conta_id,
            data_emissao,
            tipo_lancamento,
            contas_receber_parcelas (
              id,
              valor_parcela,
              data_emissao
            )
          `)
          .eq("usuario_id", user.id);

        const planosReceita: any = {};
        
        contasReceber?.forEach((conta: any) => {
          if (!conta.plano_conta_id) return;
          
          const codigoCategoria = planosMap.get(conta.plano_conta_id);
          if (!codigoCategoria) return;

          // Para lançamentos não recorrentes, usar data_emissao da conta principal
          if (conta.tipo_lancamento !== 'recorrente') {
            // Extrair ano e mês diretamente da string ISO para evitar problemas de fuso horário
            const [anoEmissao, mesEmissaoStr] = conta.data_emissao.split('-').map(Number);
            const mesEmissao = mesEmissaoStr - 1; // JavaScript meses são 0-11
            
            // Se a data de emissão da conta está neste mês/ano, somar TODAS as parcelas
            if (mesEmissao === mes && anoEmissao === ano) {
              conta.contas_receber_parcelas?.forEach((parcela: any) => {
                if (!planosReceita[codigoCategoria]) {
                  planosReceita[codigoCategoria] = 0;
                }
                planosReceita[codigoCategoria] += parcela.valor_parcela || 0;
              });
            }
          } else {
            // Para lançamentos recorrentes, usar data_emissao de cada parcela
            conta.contas_receber_parcelas?.forEach((parcela: any) => {
              // Extrair ano e mês diretamente da string ISO para evitar problemas de fuso horário
              const [anoEmissaoParcela, mesEmissaoParcelaStr] = parcela.data_emissao.split('-').map(Number);
              const mesEmissaoParcela = mesEmissaoParcelaStr - 1; // JavaScript meses são 0-11
              
              if (mesEmissaoParcela === mes && anoEmissaoParcela === ano) {
                if (!planosReceita[codigoCategoria]) {
                  planosReceita[codigoCategoria] = 0;
                }
                planosReceita[codigoCategoria] += parcela.valor_parcela || 0;
              }
            });
          }
        });

        linhas.receitaVendas[mes] = planosReceita['1'] || 0;
        linhas.receitasFinanceiras[mes] = planosReceita['106'] || 0;
        linhas.receitasNaoOperacionais[mes] = planosReceita['9'] || 0;

        // Buscar despesas (todas as parcelas com base na data de emissão)
        const { data: contasPagar } = await supabase
          .from("contas_pagar")
          .select(`
            id,
            plano_contas_id,
            data_emissao,
            tipo_lancamento,
            contas_pagar_parcelas (
              id,
              valor_parcela,
              data_emissao
            )
          `)
          .eq("usuario_id", user.id);

        const planosDespesa: any = {};
        
        contasPagar?.forEach((conta: any) => {
          if (!conta.plano_contas_id) return;
          
          const codigoCategoria = planosMap.get(conta.plano_contas_id);
          if (!codigoCategoria) return;

          // Para lançamentos não recorrentes, usar data_emissao da conta principal
          if (conta.tipo_lancamento !== 'recorrente') {
            // Extrair ano e mês diretamente da string ISO para evitar problemas de fuso horário
            const [anoEmissao, mesEmissaoStr] = conta.data_emissao.split('-').map(Number);
            const mesEmissao = mesEmissaoStr - 1; // JavaScript meses são 0-11
            
            // Se a data de emissão da conta está neste mês/ano, somar TODAS as parcelas
            if (mesEmissao === mes && anoEmissao === ano) {
              conta.contas_pagar_parcelas?.forEach((parcela: any) => {
                if (!planosDespesa[codigoCategoria]) {
                  planosDespesa[codigoCategoria] = 0;
                }
                planosDespesa[codigoCategoria] += parcela.valor_parcela || 0;
              });
            }
          } else {
            // Para lançamentos recorrentes, usar data_emissao de cada parcela
            conta.contas_pagar_parcelas?.forEach((parcela: any) => {
              // Extrair ano e mês diretamente da string ISO para evitar problemas de fuso horário
              const [anoEmissaoParcela, mesEmissaoParcelaStr] = parcela.data_emissao.split('-').map(Number);
              const mesEmissaoParcela = mesEmissaoParcelaStr - 1; // JavaScript meses são 0-11
              
              if (mesEmissaoParcela === mes && anoEmissaoParcela === ano) {
                if (!planosDespesa[codigoCategoria]) {
                  planosDespesa[codigoCategoria] = 0;
                }
                planosDespesa[codigoCategoria] += parcela.valor_parcela || 0;
              }
            });
          }
        });

        linhas.impostosSobreVendas[mes] = planosDespesa['2'] || 0;
        linhas.outrasDeducoes[mes] = planosDespesa['99'] || 0;
        linhas.cmv[mes] = planosDespesa['3'] || 0;
        linhas.despesasComerciais[mes] = planosDespesa['8'] || 0;
        linhas.despesaOperacionalVariavel[mes] = planosDespesa['103'] || 0;
        linhas.campanhasSazonais[mes] = planosDespesa['112'] || 0;
        linhas.despesasPessoal[mes] = planosDespesa['5'] || 0;
        linhas.despesasOcupacao[mes] = planosDespesa['6'] || 0;
        linhas.despesasAdministrativas[mes] = planosDespesa['7'] || 0;
        linhas.despesasFinanceiras[mes] = planosDespesa['107'] || 0;
        linhas.gastosNaoOperacionais[mes] = planosDespesa['10'] || 0;

        // Calcular totais e indicadores
        linhas.receitaBruta[mes] = linhas.receitaVendas[mes];
        linhas.totalDeducoes[mes] = linhas.impostosSobreVendas[mes] + linhas.outrasDeducoes[mes];
        linhas.receitaLiquida[mes] = linhas.receitaBruta[mes] - linhas.totalDeducoes[mes];
        
        linhas.totalCustosVariaveis[mes] = linhas.cmv[mes] + linhas.despesasComerciais[mes] + 
                                           linhas.despesaOperacionalVariavel[mes] + linhas.campanhasSazonais[mes];
        
        linhas.margemContribuicao[mes] = linhas.receitaLiquida[mes] - linhas.totalCustosVariaveis[mes];
        linhas.margemContribuicaoPerc[mes] = linhas.receitaBruta[mes] !== 0 
          ? (linhas.margemContribuicao[mes] / linhas.receitaBruta[mes]) * 100 
          : 0;

        linhas.totalCustosFixos[mes] = linhas.despesasPessoal[mes] + linhas.despesasOcupacao[mes] + 
                                       linhas.despesasAdministrativas[mes];
        
        linhas.resultadoOperacional[mes] = linhas.margemContribuicao[mes] - linhas.totalCustosFixos[mes];
        
        linhas.resultadoNaoOperacional[mes] = linhas.receitasNaoOperacionais[mes] - linhas.gastosNaoOperacionais[mes];
        
        linhas.lair[mes] = linhas.resultadoOperacional[mes] + linhas.receitasFinanceiras[mes] - 
                           linhas.despesasFinanceiras[mes] + linhas.resultadoNaoOperacional[mes];
        
        linhas.impostoRenda[mes] = 0;
        linhas.lucroLiquido[mes] = linhas.lair[mes] - linhas.impostoRenda[mes];
        
        linhas.margemLiquidaPerc[mes] = linhas.receitaBruta[mes] !== 0 
          ? (linhas.lucroLiquido[mes] / linhas.receitaBruta[mes]) * 100 
          : 0;
      }

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

    const worksheet_data = [
      ["Demonstrativo de Resultado", "", "", "", "", "", "", "", "", "", "", "", "", ano, "AV%"],
      ["Descrição", ...meses, ano.toString(), "AV%"],
      ["(+) Receita Bruta", ...dados.receitaBruta.map(v => v.toFixed(2)), receitaBrutaTotal.toFixed(2), "100%"],
      ["1 - Receita com Vendas", ...dados.receitaVendas.map(v => v.toFixed(2)), calcularTotal(dados.receitaVendas).toFixed(2), calcularAV(calcularTotal(dados.receitaVendas), receitaBrutaTotal).toFixed(0) + "%"],
      ["(-) Deduções Sobre Vendas", ...dados.totalDeducoes.map(v => v.toFixed(2)), calcularTotal(dados.totalDeducoes).toFixed(2), calcularAV(calcularTotal(dados.totalDeducoes), receitaBrutaTotal).toFixed(0) + "%"],
      ["(=) Receita Líquida", ...dados.receitaLiquida.map(v => v.toFixed(2)), calcularTotal(dados.receitaLiquida).toFixed(2), calcularAV(calcularTotal(dados.receitaLiquida), receitaBrutaTotal).toFixed(0) + "%"],
      ["(=) Lucro Líquido", ...dados.lucroLiquido.map(v => v.toFixed(2)), calcularTotal(dados.lucroLiquido).toFixed(2), calcularAV(calcularTotal(dados.lucroLiquido), receitaBrutaTotal).toFixed(0) + "%"],
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
    <div className="container mx-auto p-6 space-y-6 no-print">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/financeiro")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">Demonstrativo de Resultado</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              DRE - Análise completa do exercício
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={imprimir} variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button onClick={exportarExcel}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

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
                <TableRow className="bg-green-50">
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
                <TableRow className="bg-red-50">
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
                <TableRow className="bg-blue-50">
                  <TableCell className="font-semibold">(=) Receita Líquida</TableCell>
                  {dados.receitaLiquida.map((val, i) => (
                    <TableCell key={i} className={`text-right ${val >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {val.toFixed(2)}
                    </TableCell>
                  ))}
                  <TableCell className={`text-right font-bold ${calcularTotal(dados.receitaLiquida) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {calcularTotal(dados.receitaLiquida).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-bold">{calcularAV(calcularTotal(dados.receitaLiquida), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                {/* CUSTOS VARIÁVEIS */}
                <TableRow className="bg-orange-50">
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
                <TableRow className="bg-purple-50">
                  <TableCell className="font-semibold">(=) Margem de Contribuição</TableCell>
                  {dados.margemContribuicao.map((val, i) => (
                    <TableCell key={i} className={`text-right ${val >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
                      {val.toFixed(2)}
                    </TableCell>
                  ))}
                  <TableCell className={`text-right font-bold ${calcularTotal(dados.margemContribuicao) >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
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
                <TableRow className="bg-yellow-50">
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
                <TableRow className="bg-blue-100">
                  <TableCell className="font-semibold">(=) Resultado Operacional</TableCell>
                  {dados.resultadoOperacional.map((val, i) => (
                    <TableCell key={i} className={`text-right ${val >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                      {val.toFixed(2)}
                    </TableCell>
                  ))}
                  <TableCell className={`text-right font-bold ${calcularTotal(dados.resultadoOperacional) >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
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
                <TableRow className="bg-gray-50">
                  <TableCell className="font-semibold">Resultado Não Operacional</TableCell>
                  {dados.resultadoNaoOperacional.map((val, i) => (
                    <TableCell key={i} className={`text-right ${val >= 0 ? '' : 'text-red-600'}`}>
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
                <TableRow className="bg-yellow-100">
                  <TableCell className="font-semibold">(=) Lucro Antes do Imposto de Renda (LAIR)</TableCell>
                  {dados.lair.map((val, i) => (
                    <TableCell key={i} className={`text-right ${val >= 0 ? 'text-yellow-700' : 'text-red-700'}`}>
                      {val.toFixed(2)}
                    </TableCell>
                  ))}
                  <TableCell className={`text-right font-bold ${calcularTotal(dados.lair) >= 0 ? 'text-yellow-700' : 'text-red-700'}`}>
                    {calcularTotal(dados.lair).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-bold">{calcularAV(calcularTotal(dados.lair), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                {/* IMPOSTO */}
                <TableRow>
                  <TableCell>(-) Imposto de Renda e CSLL</TableCell>
                  {dados.impostoRenda.map((val, i) => (
                    <TableCell key={i} className="text-right">{val > 0 ? val.toFixed(2) : '-'}</TableCell>
                  ))}
                  <TableCell className="text-right">{calcularTotal(dados.impostoRenda).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{calcularAV(calcularTotal(dados.impostoRenda), receitaBrutaTotal).toFixed(0)}%</TableCell>
                </TableRow>

                {/* LUCRO LÍQUIDO */}
                <TableRow className="bg-primary/10">
                  <TableCell className="font-bold">(=) Lucro Líquido</TableCell>
                  {dados.lucroLiquido.map((val, i) => (
                    <TableCell key={i} className={`text-right font-semibold ${val >= 0 ? 'text-primary' : 'text-red-700'}`}>
                      {val.toFixed(2)}
                    </TableCell>
                  ))}
                  <TableCell className={`text-right font-bold ${calcularTotal(dados.lucroLiquido) >= 0 ? 'text-primary' : 'text-red-700'}`}>
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
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Receitas Totais</p>
                    <p className="text-2xl font-bold text-green-700">
                      R$ {receitaTotalAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Custos Totais</p>
                    <p className="text-2xl font-bold text-red-700">
                      R$ {custosTotaisAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`${lucroLiquidoAnual >= 0 ? 'border-primary bg-primary/10' : 'border-red-500 bg-red-50'}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <TrendingUp className={`h-8 w-8 ${lucroLiquidoAnual >= 0 ? 'text-primary' : 'text-red-600'}`} />
                  <div className="text-right">
                    <p className={`text-sm ${lucroLiquidoAnual >= 0 ? 'text-primary' : 'text-red-700'}`}>
                      Lucro Líquido
                    </p>
                    <p className={`text-2xl font-bold ${lucroLiquidoAnual >= 0 ? 'text-primary' : 'text-red-700'}`}>
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
                  <Bar dataKey="receitas" fill="#10b981" name="Receitas" />
                  <Bar dataKey="custos" fill="#ef4444" name="Custos" />
                  <Bar dataKey="lucro" fill="#3b82f6" name="Lucro" />
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
              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    Margem de Contribuição (R$)
                  </p>
                  <p className={`text-2xl font-bold ${dadosMensal.margemContribuicao >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
                    R$ {dadosMensal.margemContribuicao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    Margem de Contribuição (%)
                  </p>
                  <p className="text-2xl font-bold text-blue-700">
                    {dadosMensal.margemContribuicaoPerc.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card className="border-indigo-200 bg-indigo-50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    Resultado Operacional (R$)
                  </p>
                  <p className={`text-2xl font-bold ${dadosMensal.resultadoOperacional >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                    R$ {dadosMensal.resultadoOperacional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/50 bg-primary/10">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    Margem Líquida (%)
                  </p>
                  <p className={`text-2xl font-bold ${dadosMensal.margemLiquidaPerc >= 0 ? 'text-primary' : 'text-red-700'}`}>
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