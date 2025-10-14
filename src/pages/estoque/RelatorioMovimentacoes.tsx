import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Download, Printer, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMovimentacoes } from "@/hooks/useMovimentacoes";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import * as XLSX from 'xlsx';

export default function RelatorioMovimentacoes() {
  const navigate = useNavigate();
  const [dataInicio, setDataInicio] = useState(() => {
    const date = new Date();
    date.setDate(1); // Primeiro dia do mês
    return date;
  });
  const [dataFim, setDataFim] = useState(new Date());
  const [mostrarGrafico, setMostrarGrafico] = useState(false);
  const [mostrarAnalise, setMostrarAnalise] = useState(false);

  const { movimentacoes, isLoading, resumo } = useMovimentacoes({
    dataInicio,
    dataFim,
  });

  const exportarExcel = () => {
    const wsResumo = XLSX.utils.json_to_sheet([
      { Campo: 'Período', Valor: `${format(dataInicio, 'dd/MM/yyyy')} a ${format(dataFim, 'dd/MM/yyyy')}` },
      { Campo: 'Total Entradas', Valor: resumo?.totalEntradas.valor || 0 },
      { Campo: 'Total Saídas', Valor: resumo?.totalSaidas.valor || 0 },
      { Campo: 'Saldo', Valor: resumo?.saldo || 0 },
    ]);

    const wsMovimentacoes = XLSX.utils.json_to_sheet(
      movimentacoes.map(m => ({
        Data: format(new Date(m.data), 'dd/MM/yyyy'),
        Tipo: m.tipo,
        Quantidade: m.quantidade,
        Unidade: m.unidade,
        'Custo Unitário': m.custo_unitario,
        'Custo Total': m.custo_total,
        Motivo: m.motivo,
        Observações: m.observacoes || '',
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');
    XLSX.utils.book_append_sheet(wb, wsMovimentacoes, 'Movimentações');

    XLSX.writeFile(wb, `Movimentacoes_Estoque_${format(dataInicio, 'ddMMyyyy')}_${format(dataFim, 'ddMMyyyy')}.xlsx`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Relatório de Movimentações"
        description="Entradas e saídas de estoque por período"
        actions={
          <Button variant="outline" onClick={() => navigate("/estoque/relatorios")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        }
      />

      {/* Cards de Resumo */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ➕ Entradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {resumo?.totalEntradas.valor.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {resumo?.totalEntradas.quantidade} entradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ➖ Saídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                R$ {resumo?.totalSaidas.valor.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {resumo?.totalSaidas.quantidade} saídas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                💰 Saldo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(resumo?.saldo || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(resumo?.saldo || 0) >= 0 ? '+' : ''}R$ {resumo?.saldo.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                📊 Movimentações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {resumo?.totalMovimentacoes}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                movimentações
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={exportarExcel}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Excel
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
      </div>

      {/* Tabela de Movimentações */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações Detalhadas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : movimentacoes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma movimentação encontrada no período</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentacoes.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell>{format(new Date(mov.data), 'dd/MM')}</TableCell>
                    <TableCell>
                      {mov.tipo === 'ENTRADA' ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          ➕ Entrada
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          ➖ Saída
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {mov.quantidade} {mov.unidade}
                    </TableCell>
                    <TableCell className={mov.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}>
                      {mov.tipo === 'ENTRADA' ? '+' : '-'}R$ {Number(mov.custo_total).toFixed(2)}
                    </TableCell>
                    <TableCell>{mov.motivo}</TableCell>
                    <TableCell className="max-w-xs truncate">{mov.observacoes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
