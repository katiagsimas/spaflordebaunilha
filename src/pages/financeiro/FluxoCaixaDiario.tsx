import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import * as XLSX from "@/lib/xlsxShim";
import { LoadingMascote } from "@/components/LoadingMascote";
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
      
      // Calcular saldo inicial — fonte única de verdade
      const inicioMesAtual = format(inicio, "yyyy-MM-dd");

      // 1. Buscar o registro mais recente em saldos_iniciais_bancos
      //    com data_referencia < início do mês atual
      const { data: saldoRefArr } = await supabase
        .from('saldos_iniciais_bancos')
        .select('saldo_inicial, data_referencia')
        .eq('user_id', user.id)
        .lt('data_referencia', inicioMesAtual)
        .order('data_referencia', { ascending: false })
        .limit(1);

      const saldoRef = saldoRefArr?.[0];

      let pontoPartida = 0;
      let dataInicioMovimentacoes: string | null = null;

      if (saldoRef) {
        // Caso 1: usar saldo configurado mais recente como ponto de partida
        // e considerar apenas movimentações posteriores a ele
        pontoPartida = saldoRef.saldo_inicial || 0;
        dataInicioMovimentacoes = saldoRef.data_referencia;
      } else {
        // Caso 2: usar a soma dos saldo_inicial dos bancos do usuário
        // e considerar todas as movimentações históricas
        const { data: bancos } = await supabase
          .from('bancos')
          .select('saldo_inicial')
          .eq('usuario_id', user.id);
        pontoPartida = bancos?.reduce((acc, b) => acc + (b.saldo_inicial || 0), 0) || 0;
        dataInicioMovimentacoes = null;
      }

      // Movimentações entre dataInicioMovimentacoes (exclusivo) e início do mês atual
      // Filtro de usuario_id via join nas tabelas pai garante isolamento de dados
      let queryEntradas = supabase
        .from("contas_receber_pagamentos")
        .select("valor_pago, juros, desconto, contas_receber_parcelas!inner(contas_receber!inner(usuario_id))")
        .lt("data_pagamento", inicioMesAtual)
        .eq("estornado", false)
        .eq("contas_receber_parcelas.contas_receber.usuario_id", user.id);

      let querySaidas = supabase
        .from("contas_pagar_pagamentos")
        .select("valor_pago, juros, desconto, contas_pagar_parcelas!inner(contas_pagar!inner(usuario_id))")
        .lt("data_pagamento", inicioMesAtual)
        .eq("estornado", false)
        .eq("contas_pagar_parcelas.contas_pagar.usuario_id", user.id);

      if (dataInicioMovimentacoes) {
        queryEntradas = queryEntradas.gte("data_pagamento", dataInicioMovimentacoes);
        querySaidas = querySaidas.gte("data_pagamento", dataInicioMovimentacoes);
      }

      const [{ data: entradasAnteriores }, { data: saidasAnteriores }] = await Promise.all([
        queryEntradas,
        querySaidas,
      ]);

      const totalEntradasAnteriores = entradasAnteriores
        ?.reduce((sum, e) => sum + (e.valor_pago || 0) + (e.juros || 0) - (e.desconto || 0), 0) || 0;

      const totalSaidasAnteriores = saidasAnteriores
        ?.reduce((sum, s) => sum + (s.valor_pago || 0) + (s.juros || 0) - (s.desconto || 0), 0) || 0;

      const saldoIni = pontoPartida + totalEntradasAnteriores - totalSaidasAnteriores;

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
    const dadosExportacao = fluxo.map(item => ({
      'Dia': format(item.dia, 'dd/MM/yyyy'),
      'Entradas': Number(item.entradas.toFixed(2)),
      'Saídas': Number(item.saidas.toFixed(2)),
      'Saldo do Dia': Number(item.saldoDia.toFixed(2)),
      'Saldo Acumulado': Number(item.saldoAcumulado.toFixed(2)),
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExportacao);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fluxo de Caixa Diário');
    XLSX.writeFile(wb, `fluxo-caixa-diario-${String(mes + 1).padStart(2, '0')}-${ano}.xlsx`);
  };

  // Gerar lista de anos (2025 em diante)
  const anos = Array.from({ length: anoAtual - 2024 + 5 }, (_, i) => 2025 + i);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Fluxo de Caixa Diário"
        description="Movimentações do mês dia a dia."
        backButton={<BackButton to="/financeiro/fluxo-caixa" />}
      />


      {/* Filtro de Ano e Mês + atalho cruzado */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Card className="w-fit">
          <CardContent className="py-3 px-4">
            <div className="flex items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-cda-vinho/70">Ano</label>
                <Select value={ano.toString()} onValueChange={(value) => setAno(parseInt(value))}>
                  <SelectTrigger className="h-9 w-[110px]">
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

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-cda-vinho/70">Mês</label>
                <Select value={mes.toString()} onValueChange={(value) => setMes(parseInt(value))}>
                  <SelectTrigger className="h-9 w-[150px]">
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

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/financeiro/fluxo-caixa/mensal")}
          className="h-9 rounded-full border-cda-dourado/50 bg-cda-creme/60 text-cda-vinho hover:bg-cda-dourado/15 hover:text-cda-vinho-escuro"
        >
          Ver Fluxo de Caixa Mensal
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2 border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              Saldo Final do Mês Anterior
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              R$ {saldoInicial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/30 bg-success/10/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-success">
              <TrendingUp className="inline w-4 h-4 mr-1" />
              Total Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {totais.entradas.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-cda-coral/30 bg-cda-coral/10/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-cda-coral">
              <TrendingDown className="inline w-4 h-4 mr-1" />
              Total Saídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cda-coral">
              R$ {totais.saidas.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${saldoFinal >= 0 ? 'border-primary bg-primary/10' : 'border-cda-coral bg-cda-coral/10'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${saldoFinal >= 0 ? 'text-primary' : 'text-cda-coral'}`}>
              Saldo Final
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoFinal >= 0 ? 'text-primary' : 'text-cda-coral'}`}>
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
                Exportar .xlsx
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
                    <TableCell colSpan={5}>
                      <div className="flex justify-center py-6">
                        <LoadingMascote size={48} label="Carregando movimentações..." />
                      </div>
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
                      className={item.entradas > 0 || item.saidas > 0 ? "bg-cda-dourado/10/30" : ""}
                    >
                      <TableCell className="font-medium">
                        {format(item.dia, "dd", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right text-success">
                        {item.entradas > 0 ? `R$ ${item.entradas.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right text-cda-coral">
                        {item.saidas > 0 ? `R$ ${item.saidas.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        item.saldoDia > 0 ? "text-success" : 
                        item.saldoDia < 0 ? "text-cda-coral" : 
                        "text-muted-foreground"
                      }`}>
                        {item.saldoDia !== 0 ? `R$ ${item.saldoDia.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${
                        item.saldoAcumulado >= 0 ? "text-primary" : "text-cda-coral"
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
                  <TableCell className="text-right font-bold text-success">
                    R$ {totais.entradas.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-cda-coral">
                    R$ {totais.saidas.toFixed(2)}
                  </TableCell>
                  <TableCell className={`text-right font-bold ${
                    totais.saldo >= 0 ? "text-success" : "text-cda-coral"
                  }`}>
                    R$ {totais.saldo.toFixed(2)}
                  </TableCell>
                  <TableCell className={`text-right font-bold ${
                    saldoFinal >= 0 ? "text-primary" : "text-cda-coral"
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
