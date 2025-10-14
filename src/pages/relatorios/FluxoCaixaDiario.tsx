import { useState, useMemo } from "react";
import { Calendar, Download, FileSpreadsheet, ArrowLeft, ArrowUpCircle, ArrowDownCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface MovimentacaoDiaria {
  data: string;
  entradas: number;
  saidas: number;
  saldoDia: number;
  saldoAcumulado: number;
  movimentacoes: Array<{
    descricao: string;
    categoria: string;
    valor: number;
    tipo: 'entrada' | 'saida';
    status: string;
  }>;
}

export default function FluxoCaixaDiario() {
  const navigate = useNavigate();
  const [dataInicial, setDataInicial] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dataFinal, setDataFinal] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [diaDetalhado, setDiaDetalhado] = useState<MovimentacaoDiaria | null>(null);
  const [mostrarApenasComMovimento, setMostrarApenasComMovimento] = useState(true);

  // Buscar dados do localStorage
  const contasReceber: ContaReceber[] = useMemo(() => {
    const str = localStorage.getItem('sugarbox_contas_receber');
    return str ? JSON.parse(str) : [];
  }, []);

  const contasPagar: ContaPagar[] = useMemo(() => {
    const str = localStorage.getItem('sugarbox_contas_pagar');
    return str ? JSON.parse(str) : [];
  }, []);

  // Calcular movimentações diárias
  const movimentacoesDiarias = useMemo(() => {
    const inicio = parseISO(dataInicial);
    const fim = parseISO(dataFinal);
    const dias = eachDayOfInterval({ start: inicio, end: fim });

    let saldoAcumulado = 0;
    const resultado: MovimentacaoDiaria[] = [];

    dias.forEach(dia => {
      const dataStr = format(dia, 'yyyy-MM-dd');
      
      // Buscar entradas do dia
      const entradasDia = contasReceber.filter(c => 
        c.status === 'recebido' && c.dataRecebimento === dataStr
      );
      
      // Buscar saídas do dia
      const saidasDia = contasPagar.filter(c => 
        c.status === 'pago' && c.dataPagamento === dataStr
      );

      const totalEntradas = entradasDia.reduce((acc, c) => acc + c.valor, 0);
      const totalSaidas = saidasDia.reduce((acc, c) => acc + c.valor, 0);
      const saldoDia = totalEntradas - totalSaidas;
      saldoAcumulado += saldoDia;

      const movimentacoes = [
        ...entradasDia.map(c => ({
          descricao: c.descricao,
          categoria: c.categoriaId,
          valor: c.valor,
          tipo: 'entrada' as const,
          status: c.status
        })),
        ...saidasDia.map(c => ({
          descricao: c.descricao,
          categoria: c.categoriaId,
          valor: c.valor,
          tipo: 'saida' as const,
          status: c.status
        }))
      ];

      if (!mostrarApenasComMovimento || movimentacoes.length > 0) {
        resultado.push({
          data: dataStr,
          entradas: totalEntradas,
          saidas: totalSaidas,
          saldoDia,
          saldoAcumulado,
          movimentacoes
        });
      }
    });

    return resultado.reverse(); // Mais recente primeiro
  }, [contasReceber, contasPagar, dataInicial, dataFinal, mostrarApenasComMovimento]);

  // Calcular resumo do período
  const resumoPeriodo = useMemo(() => {
    const totalEntradas = movimentacoesDiarias.reduce((acc, m) => acc + m.entradas, 0);
    const totalSaidas = movimentacoesDiarias.reduce((acc, m) => acc + m.saidas, 0);
    const saldoPeriodo = totalEntradas - totalSaidas;
    const saldoAtual = movimentacoesDiarias.length > 0 
      ? movimentacoesDiarias[0].saldoAcumulado 
      : 0;

    return {
      totalEntradas,
      totalSaidas,
      saldoPeriodo,
      saldoAtual
    };
  }, [movimentacoesDiarias]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR });
  };

  const exportarExcel = () => {
    const dados = movimentacoesDiarias.map(m => ({
      'Data': formatDate(m.data),
      'Entradas (R$)': m.entradas.toFixed(2),
      'Saídas (R$)': m.saidas.toFixed(2),
      'Saldo do Dia (R$)': m.saldoDia.toFixed(2),
      'Saldo Acumulado (R$)': m.saldoAcumulado.toFixed(2)
    }));

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fluxo de Caixa Diário");
    
    // Ajustar largura das colunas
    ws['!cols'] = [
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 20 }
    ];

    XLSX.writeFile(wb, `fluxo-caixa-diario-${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
    toast.success('Arquivo Excel exportado com sucesso!');
  };

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
              <Calendar className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Fluxo de Caixa Diário</h1>
            </div>
            <p className="text-base text-muted-foreground">
              Movimentações financeiras dia a dia
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
          <CardTitle className="text-lg">Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="dataInicial">Data Inicial</Label>
              <Input
                id="dataInicial"
                type="date"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="dataFinal">Data Final</Label>
              <Input
                id="dataFinal"
                type="date"
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant={mostrarApenasComMovimento ? "default" : "outline"}
                onClick={() => setMostrarApenasComMovimento(!mostrarApenasComMovimento)}
              >
                {mostrarApenasComMovimento ? "Com Movimentação" : "Todos os Dias"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-success" />
              <p className="text-2xl font-bold text-success">
                {formatCurrency(resumoPeriodo.totalEntradas)}
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
              <p className="text-2xl font-bold text-destructive">
                {formatCurrency(resumoPeriodo.totalSaidas)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo do Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <p className={`text-2xl font-bold ${resumoPeriodo.saldoPeriodo >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(resumoPeriodo.saldoPeriodo)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <p className={`text-2xl font-bold ${resumoPeriodo.saldoAtual >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(resumoPeriodo.saldoAtual)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Entradas (R$)</TableHead>
                  <TableHead className="text-right">Saídas (R$)</TableHead>
                  <TableHead className="text-right">Saldo do Dia (R$)</TableHead>
                  <TableHead className="text-right">Saldo Acumulado (R$)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentacoesDiarias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhuma movimentação encontrada no período
                    </TableCell>
                  </TableRow>
                ) : (
                  movimentacoesDiarias.map((mov) => (
                    <TableRow
                      key={mov.data}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setDiaDetalhado(mov)}
                    >
                      <TableCell className="font-medium">{formatDate(mov.data)}</TableCell>
                      <TableCell className="text-right text-success font-semibold">
                        {formatCurrency(mov.entradas)}
                      </TableCell>
                      <TableCell className="text-right text-destructive font-semibold">
                        {formatCurrency(mov.saidas)}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${mov.saldoDia >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(mov.saldoDia)}
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

      {/* Dialog de Detalhes */}
      <Dialog open={!!diaDetalhado} onOpenChange={() => setDiaDetalhado(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Movimentações de {diaDetalhado && formatDate(diaDetalhado.data)}
            </DialogTitle>
            <DialogDescription>
              Detalhamento de todas as entradas e saídas do dia
            </DialogDescription>
          </DialogHeader>

          {diaDetalhado && (
            <div className="space-y-4">
              {diaDetalhado.movimentacoes.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma movimentação neste dia
                </p>
              ) : (
                <div className="space-y-2">
                  {diaDetalhado.movimentacoes.map((mov, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-l-4 ${
                        mov.tipo === 'entrada'
                          ? 'bg-success/5 border-success'
                          : 'bg-destructive/5 border-destructive'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {mov.tipo === 'entrada' ? (
                              <ArrowDownCircle className="h-4 w-4 text-success" />
                            ) : (
                              <ArrowUpCircle className="h-4 w-4 text-destructive" />
                            )}
                            <p className="font-semibold text-foreground">{mov.descricao}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Categoria: {mov.categoria}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            mov.tipo === 'entrada' ? 'text-success' : 'text-destructive'
                          }`}>
                            {formatCurrency(mov.valor)}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {mov.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Entradas</p>
                    <p className="text-xl font-bold text-success">
                      {formatCurrency(diaDetalhado.entradas)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Saídas</p>
                    <p className="text-xl font-bold text-destructive">
                      {formatCurrency(diaDetalhado.saidas)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo do Dia</p>
                    <p className={`text-xl font-bold ${diaDetalhado.saldoDia >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(diaDetalhado.saldoDia)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Acumulado</p>
                    <p className={`text-xl font-bold ${diaDetalhado.saldoAcumulado >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(diaDetalhado.saldoAcumulado)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
