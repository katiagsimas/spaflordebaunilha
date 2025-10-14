import { useState, useMemo } from "react";
import { BarChart3, Download, FileSpreadsheet, ArrowLeft, ArrowUpCircle, ArrowDownCircle, TrendingUp, Loader2 } from "lucide-react";
import { useContasReceber } from "@/hooks/useContasReceber";
import { useContasPagar } from "@/hooks/useContasPagar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { format, parseISO, startOfYear, endOfYear, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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

interface MovimentacaoMensal {
  mes: string;
  mesAno: string;
  entradas: number;
  saidas: number;
  saldoMes: number;
  saldoAcumulado: number;
}

export default function FluxoCaixaMensal() {
  const navigate = useNavigate();
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());

  // Buscar dados do Supabase
  const { items: contasReceber, loading: loadingReceber } = useContasReceber();
  const { items: contasPagar, loading: loadingPagar } = useContasPagar();

  // Calcular movimentações mensais
  const movimentacoesMensais = useMemo(() => {
    const inicio = startOfYear(new Date(anoSelecionado, 0, 1));
    const fim = endOfYear(new Date(anoSelecionado, 0, 1));
    const meses = eachMonthOfInterval({ start: inicio, end: fim });

    let saldoAcumulado = 0;
    const resultado: MovimentacaoMensal[] = [];

    meses.forEach(mes => {
      const mesNum = mes.getMonth();
      const anoMes = mes.getFullYear();
      
      // Buscar entradas do mês
      const entradasMes = contasReceber.filter(c => {
        if (c.status !== 'recebido' || !c.data_recebimento) return false;
        const data = parseISO(c.data_recebimento);
        return data.getMonth() === mesNum && data.getFullYear() === anoMes;
      });
      
      // Buscar saídas do mês
      const saidasMes = contasPagar.filter(c => {
        if (c.status !== 'pago' || !c.data_pagamento) return false;
        const data = parseISO(c.data_pagamento);
        return data.getMonth() === mesNum && data.getFullYear() === anoMes;
      });

      const totalEntradas = entradasMes.reduce((acc, c) => acc + c.valor, 0);
      const totalSaidas = saidasMes.reduce((acc, c) => acc + c.valor, 0);
      const saldoMes = totalEntradas - totalSaidas;
      saldoAcumulado += saldoMes;

      resultado.push({
        mes: format(mes, 'MMMM', { locale: ptBR }),
        mesAno: format(mes, 'MM/yyyy'),
        entradas: totalEntradas,
        saidas: totalSaidas,
        saldoMes,
        saldoAcumulado
      });
    });

    return resultado.reverse(); // Mais recente primeiro
  }, [contasReceber, contasPagar, anoSelecionado]);

  // Calcular resumo anual
  const resumoAnual = useMemo(() => {
    const totalEntradas = movimentacoesMensais.reduce((acc, m) => acc + m.entradas, 0);
    const totalSaidas = movimentacoesMensais.reduce((acc, m) => acc + m.saidas, 0);
    const saldoAno = totalEntradas - totalSaidas;
    
    const mesMaiorEntrada = movimentacoesMensais.reduce((prev, curr) => 
      curr.entradas > prev.entradas ? curr : prev
    , movimentacoesMensais[0] || { mes: '-', entradas: 0 });
    
    const mesMaiorSaida = movimentacoesMensais.reduce((prev, curr) => 
      curr.saidas > prev.saidas ? curr : prev
    , movimentacoesMensais[0] || { mes: '-', saidas: 0 });

    return {
      totalEntradas,
      totalSaidas,
      saldoAno,
      mesMaiorEntrada: {
        mes: mesMaiorEntrada.mes,
        valor: mesMaiorEntrada.entradas
      },
      mesMaiorSaida: {
        mes: mesMaiorSaida.mes,
        valor: mesMaiorSaida.saidas
      }
    };
  }, [movimentacoesMensais]);

  // Dados para gráfico
  const dadosGrafico = useMemo(() => {
    return [...movimentacoesMensais].reverse().map(m => ({
      mes: m.mes,
      Entradas: m.entradas,
      Saídas: m.saidas,
      Saldo: m.saldoAcumulado
    }));
  }, [movimentacoesMensais]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const exportarExcel = () => {
    const dados = movimentacoesMensais.map(m => ({
      'Mês/Ano': `${m.mes}/${anoSelecionado}`,
      'Entradas (R$)': m.entradas.toFixed(2),
      'Saídas (R$)': m.saidas.toFixed(2),
      'Saldo do Mês (R$)': m.saldoMes.toFixed(2),
      'Saldo Acumulado (R$)': m.saldoAcumulado.toFixed(2)
    }));

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fluxo de Caixa Mensal");
    
    // Ajustar largura das colunas
    ws['!cols'] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 20 }
    ];

    XLSX.writeFile(wb, `fluxo-caixa-mensal-${anoSelecionado}.xlsx`);
    toast.success('Arquivo Excel exportado com sucesso!');
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
              <BarChart3 className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Fluxo de Caixa Mensal</h1>
            </div>
            <p className="text-base text-muted-foreground">
              Visão consolidada mês a mês
            </p>
          </div>
        </div>

        <Button onClick={exportarExcel} variant="outline" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Exportar Excel
        </Button>
      </div>

      {/* Filtro de Ano */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Selecionar Ano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 max-w-xs">
              <Label htmlFor="ano">Ano</Label>
              <Input
                id="ano"
                type="number"
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                min={2020}
                max={2030}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo Anual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-success" />
              <p className="text-xl font-bold text-success">
                {formatCurrency(resumoAnual.totalEntradas)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Saídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-destructive" />
              <p className="text-xl font-bold text-destructive">
                {formatCurrency(resumoAnual.totalSaidas)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo do Ano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <p className={`text-xl font-bold ${resumoAnual.saldoAno >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(resumoAnual.saldoAno)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mês - Maior Entrada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold text-foreground capitalize mb-1">
              {resumoAnual.mesMaiorEntrada.mes}
            </p>
            <p className="text-lg font-bold text-success">
              {formatCurrency(resumoAnual.mesMaiorEntrada.valor)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mês - Maior Saída
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold text-foreground capitalize mb-1">
              {resumoAnual.mesMaiorSaida.mes}
            </p>
            <p className="text-lg font-bold text-destructive">
              {formatCurrency(resumoAnual.mesMaiorSaida.valor)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Barras */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Entradas x Saídas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="Entradas" fill="hsl(var(--success))" />
              <Bar dataKey="Saídas" fill="hsl(var(--destructive))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Linha - Saldo Acumulado */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Evolução do Saldo Acumulado</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="Saldo" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês/Ano</TableHead>
                  <TableHead className="text-right">Entradas (R$)</TableHead>
                  <TableHead className="text-right">Saídas (R$)</TableHead>
                  <TableHead className="text-right">Saldo do Mês (R$)</TableHead>
                  <TableHead className="text-right">Saldo Acumulado (R$)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentacoesMensais.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhuma movimentação encontrada no ano {anoSelecionado}
                    </TableCell>
                  </TableRow>
                ) : (
                  movimentacoesMensais.map((mov) => (
                    <TableRow key={mov.mesAno}>
                      <TableCell className="font-medium capitalize">
                        {mov.mes}/{anoSelecionado}
                      </TableCell>
                      <TableCell className="text-right text-success font-semibold">
                        {formatCurrency(mov.entradas)}
                      </TableCell>
                      <TableCell className="text-right text-destructive font-semibold">
                        {formatCurrency(mov.saidas)}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${mov.saldoMes >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(mov.saldoMes)}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${mov.saldoAcumulado >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(mov.saldoAcumulado)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
