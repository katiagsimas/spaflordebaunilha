import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  TableRow,
  TableFooter 
} from "@/components/ui/table";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Download,
  Printer
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/BackButton";

interface FluxoDiario {
  dia: Date;
  entradas: number;
  saidas: number;
  saldoDia: number;
  saldoAcumulado: number;
}

export default function FluxoCaixaDiario() {
  const navigate = useNavigate();
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth();
  
  const [ano, setAno] = useState(anoAtual);
  const [mes, setMes] = useState(mesAtual);
  const [fluxo, setFluxo] = useState<FluxoDiario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saldoInicial, setSaldoInicial] = useState(0);

  useEffect(() => {
    carregarFluxo();
  }, [ano, mes]);

  const mesesNomes = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  async function carregarFluxo() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const mesAno = new Date(ano, mes, 1);
      const inicio = startOfMonth(mesAno);
      const fim = endOfMonth(mesAno);
      
      // Calcular saldo inicial
      const fimMesAnterior = new Date(mesAno.getFullYear(), mesAno.getMonth(), 0);
      
      // 1. Buscar saldo inicial dos bancos (Saldo Anterior do Dashboard)
      const { data: saldos } = await supabase
        .from('bancos')
        .select('saldo_inicial')
        .eq('usuario_id', user.id);

      const saldoInicialBancos = saldos?.reduce((acc, s) => acc + (s.saldo_inicial || 0), 0) || 0;

      // 2. Verificar se há movimentações anteriores
      const { data: entradasAnteriores } = await supabase
        .from("contas_receber_pagamentos")
        .select("valor_pago, juros, desconto")
        .lte("data_pagamento", format(fimMesAnterior, "yyyy-MM-dd"))
        .eq("estornado", false);

      const { data: saidasAnteriores } = await supabase
        .from("contas_pagar_pagamentos")
        .select("valor_pago, juros, desconto")
        .lte("data_pagamento", format(fimMesAnterior, "yyyy-MM-dd"))
        .eq("estornado", false);

      const totalEntradasAnteriores = entradasAnteriores
        ?.reduce((sum, e) => sum + (e.valor_pago || 0) + (e.juros || 0) - (e.desconto || 0), 0) || 0;

      const totalSaidasAnteriores = saidasAnteriores
        ?.reduce((sum, s) => sum + (s.valor_pago || 0) + (s.juros || 0) - (s.desconto || 0), 0) || 0;

      // Se não há movimentações anteriores (mês 0), usar apenas o Saldo Anterior dos bancos
      // Caso contrário, calcular: Saldo Inicial dos Bancos + Entradas - Saídas até o mês anterior
      const saldoIni = totalEntradasAnteriores === 0 && totalSaidasAnteriores === 0
        ? saldoInicialBancos
        : saldoInicialBancos + totalEntradasAnteriores - totalSaidasAnteriores;
      
      setSaldoInicial(saldoIni);
      
      // Buscar todas as entradas do mês
      const { data: entradas } = await supabase
        .from("contas_receber_pagamentos")
        .select("data_pagamento, valor_pago, juros, desconto")
        .gte("data_pagamento", format(inicio, "yyyy-MM-dd"))
        .lte("data_pagamento", format(fim, "yyyy-MM-dd"))
        .eq("estornado", false);

      // Buscar todas as saídas do mês
      const { data: saidas } = await supabase
        .from("contas_pagar_pagamentos")
        .select("data_pagamento, valor_pago, juros, desconto")
        .gte("data_pagamento", format(inicio, "yyyy-MM-dd"))
        .lte("data_pagamento", format(fim, "yyyy-MM-dd"))
        .eq("estornado", false);

      // Gerar todos os dias do mês
      const dias = eachDayOfInterval({ start: inicio, end: fim });
      
      let saldoAcumulado = saldoIni;
      
      const fluxoCalculado: FluxoDiario[] = dias.map(dia => {
        const diaStr = format(dia, "yyyy-MM-dd");
        
        // Somar entradas do dia
        const entradasDia = entradas
          ?.filter(e => e.data_pagamento === diaStr)
          .reduce((sum, e) => sum + (e.valor_pago || 0) + (e.juros || 0) - (e.desconto || 0), 0) || 0;
        
        // Somar saídas do dia
        const saidasDia = saidas
          ?.filter(s => s.data_pagamento === diaStr)
          .reduce((sum, s) => sum + (s.valor_pago || 0) + (s.juros || 0) - (s.desconto || 0), 0) || 0;
        
        const saldoDia = entradasDia - saidasDia;
        saldoAcumulado += saldoDia;
        
        return {
          dia,
          entradas: entradasDia,
          saidas: saidasDia,
          saldoDia,
          saldoAcumulado
        };
      });

      setFluxo(fluxoCalculado);
    } catch (error) {
      console.error("Erro ao carregar fluxo:", error);
    } finally {
      setLoading(false);
    }
  }

  const totais = fluxo.reduce(
    (acc, item) => ({
      entradas: acc.entradas + item.entradas,
      saidas: acc.saidas + item.saidas,
      saldo: acc.saldo + item.saldoDia,
    }),
    { entradas: 0, saidas: 0, saldo: 0 }
  );

  const saldoFinal = saldoInicial + totais.saldo;

  const handleExportar = () => {
    const csvContent = [
      ['Dia', 'Entradas', 'Saídas', 'Saldo do Dia', 'Saldo Acumulado'],
      ...fluxo.map(item => [
        format(item.dia, 'dd/MM/yyyy'),
        item.entradas.toFixed(2),
        item.saidas.toFixed(2),
        item.saldoDia.toFixed(2),
        item.saldoAcumulado.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fluxo-caixa-diario-${String(mes + 1).padStart(2, '0')}-${ano}.csv`;
    link.click();
  };

  // Gerar lista de anos (2025 em diante)
  const anos = Array.from({ length: anoAtual - 2024 + 5 }, (_, i) => 2025 + i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton to="/financeiro/fluxo-caixa" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-primary" />
            Fluxo de Caixa Diário
          </h1>
          <p className="text-muted-foreground">Movimentações do mês dia a dia</p>
        </div>
      </div>

      {/* Filtro de Ano e Mês */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Ano</label>
              <Select value={ano.toString()} onValueChange={(value) => setAno(parseInt(value))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map((a) => (
                    <SelectItem key={a} value={a.toString()}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Mês</label>
              <Select value={mes.toString()} onValueChange={(value) => setMes(parseInt(value))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mesesNomes.map((nome, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Inicial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {saldoInicial.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              <TrendingUp className="inline w-4 h-4 mr-1" />
              Total Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              R$ {totais.entradas.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              <TrendingDown className="inline w-4 h-4 mr-1" />
              Total Saídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              R$ {totais.saidas.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${saldoFinal >= 0 ? 'border-primary bg-primary/10' : 'border-red-500 bg-red-50'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${saldoFinal >= 0 ? 'text-primary' : 'text-red-700'}`}>
              Saldo Final
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoFinal >= 0 ? 'text-primary' : 'text-red-700'}`}>
              R$ {saldoFinal.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Fluxo Diário */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Movimentações Diárias</CardTitle>
              <CardDescription>
                {mesesNomes[mes]} de {ano}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportar}>
                <Download className="w-4 h-4 mr-2" />
                Exportar para Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dia</TableHead>
                  <TableHead className="text-right">Entradas</TableHead>
                  <TableHead className="text-right">Saídas</TableHead>
                  <TableHead className="text-right">Saldo do Dia</TableHead>
                  <TableHead className="text-right">Saldo Acumulado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : fluxo.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Nenhuma movimentação no período
                    </TableCell>
                  </TableRow>
                ) : (
                  fluxo.map((item, index) => (
                    <TableRow 
                      key={index}
                      className={item.entradas > 0 || item.saidas > 0 ? "bg-blue-50/30" : ""}
                    >
                      <TableCell className="font-medium">
                        {format(item.dia, "dd", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {item.entradas > 0 ? `R$ ${item.entradas.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {item.saidas > 0 ? `R$ ${item.saidas.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        item.saldoDia > 0 ? "text-green-600" : 
                        item.saldoDia < 0 ? "text-red-600" : 
                        "text-gray-600"
                      }`}>
                        {item.saldoDia !== 0 ? `R$ ${item.saldoDia.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${
                        item.saldoAcumulado >= 0 ? "text-primary" : "text-red-600"
                      }`}>
                        R$ {item.saldoAcumulado.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold">TOTAL</TableCell>
                  <TableCell className="text-right font-bold text-green-700">
                    R$ {totais.entradas.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-700">
                    R$ {totais.saidas.toFixed(2)}
                  </TableCell>
                  <TableCell className={`text-right font-bold ${
                    totais.saldo >= 0 ? "text-green-700" : "text-red-700"
                  }`}>
                    R$ {totais.saldo.toFixed(2)}
                  </TableCell>
                  <TableCell className={`text-right font-bold ${
                    saldoFinal >= 0 ? "text-primary" : "text-red-700"
                  }`}>
                    R$ {saldoFinal.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
