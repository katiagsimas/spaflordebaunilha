import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Download, 
  Printer,
  DollarSign
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/BackButton";

interface FluxoMensal {
  mes: string;
  saldoInicial: number;
  entradas: {
    receitaVendas: number;
    receitasNaoOperacionais: number;
    transferenciasAjustes: number;
    importacao: number;
    receitasFinanceiras: number;
    investimentosPositivos: number;
    total: number;
  };
  saidas: {
    impostosSobreVendas: number;
    cmv: number;
    despesasPessoal: number;
    despesasOcupacao: number;
    despesasAdministrativas: number;
    despesasComerciais: number;
    gastosNaoOperacionais: number;
    investimentosNegativos: number;
    transferenciasAjustes: number;
    outrasDeducoes: number;
    despesaOperacionalVariavel: number;
    despesasFinanceiras: number;
    campanhasSazonais: number;
    total: number;
  };
  saldoOperacional: number;
  saldoFinal: number;
}

export default function FluxoCaixaMensal() {
  const navigate = useNavigate();
  const [ano, setAno] = useState(new Date().getFullYear());
  const [fluxo, setFluxo] = useState<FluxoMensal[]>([]);
  const [loading, setLoading] = useState(true);

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  useEffect(() => {
    carregarFluxo();
  }, [ano]);

  async function carregarFluxo() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fluxoCalculado: FluxoMensal[] = [];
      let saldoAnterior = 0;

      // Buscar saldo inicial dos bancos (Saldo Anterior do Dashboard)
      const { data: saldosBancos } = await supabase
        .from('bancos')
        .select('saldo_inicial')
        .eq('usuario_id', user.id);

      const saldoInicialBancos = saldosBancos?.reduce((acc, s) => acc + (s.saldo_inicial || 0), 0) || 0;

      // Buscar saldos iniciais configurados até o início do ano
      const inicioAno = `${ano}-01-01`;
      const { data: saldosConfiguradosAno } = await supabase
        .from('saldos_iniciais_bancos')
        .select('saldo_inicial, data_referencia')
        .eq('user_id', user.id)
        .lt('data_referencia', inicioAno);

      const totalSaldosConfiguradosIniciais = saldosConfiguradosAno?.reduce((acc, s) => acc + (s.saldo_inicial || 0), 0) || 0;

      // Buscar categorias do plano de contas
      const { data: categorias } = await supabase
        .from('categorias_plano_contas')
        .select('id, codigo')
        .eq('user_id', user.id);

      const getCategoriaId = (codigo: string) => {
        return categorias?.find(c => c.codigo === codigo)?.id;
      };

      for (let mes = 0; mes < 12; mes++) {
        const dataInicio = new Date(ano, mes, 1);
        const dataFim = new Date(ano, mes + 1, 0);
        
        const inicioStr = dataInicio.toISOString().split('T')[0];
        const fimStr = dataFim.toISOString().split('T')[0];

        // Para o primeiro mês do ano, calcular o saldo inicial
        if (mes === 0) {
          const dataLimite = new Date(ano, 0, 1).toISOString().split('T')[0];

          // Buscar movimentações anteriores
          const { data: entradasAnteriores } = await supabase
            .from("contas_receber_pagamentos")
            .select("valor_pago, juros, desconto")
            .lt("data_pagamento", dataLimite)
            .eq("estornado", false);

          const { data: saidasAnteriores } = await supabase
            .from("contas_pagar_pagamentos")
            .select("valor_pago, juros, desconto")
            .lt("data_pagamento", dataLimite)
            .eq("estornado", false);

          const totalEntradasAnt = entradasAnteriores
            ?.reduce((sum, e) => sum + (e.valor_pago || 0) + (e.juros || 0) - (e.desconto || 0), 0) || 0;

          const totalSaidasAnt = saidasAnteriores
            ?.reduce((sum, s) => sum + (s.valor_pago || 0) + (s.juros || 0) - (s.desconto || 0), 0) || 0;

          // Calcular: Saldo Bancos + Saldos Configurados + Entradas - Saídas anteriores
          saldoAnterior = saldoInicialBancos + totalSaldosConfiguradosIniciais + totalEntradasAnt - totalSaidasAnt;
        }

        // Para meses subsequentes, buscar saldos configurados dentro do ano
        const dataInicioMes = new Date(ano, mes, 1).toISOString().split('T')[0];
        const { data: saldosConfiguradosMes } = await supabase
          .from('saldos_iniciais_bancos')
          .select('saldo_inicial, data_referencia')
          .eq('user_id', user.id)
          .gte('data_referencia', inicioAno)
          .lt('data_referencia', dataInicioMes);

        const saldosConfiguradosNoMes = saldosConfiguradosMes?.reduce((acc, s) => acc + (s.saldo_inicial || 0), 0) || 0;

        // Buscar entradas (Contas a Receber pagas)
        const { data: pagamentosReceber } = await supabase
          .from("contas_receber_pagamentos")
          .select(`
            valor_pago,
            juros,
            desconto,
            parcela_id
          `)
          .gte("data_pagamento", inicioStr)
          .lte("data_pagamento", fimStr)
          .eq("estornado", false);

        // Buscar saídas (Contas a Pagar pagas)
        const { data: pagamentosPagar } = await supabase
          .from("contas_pagar_pagamentos")
          .select(`
            valor_pago,
            juros,
            desconto,
            parcela_id
          `)
          .gte("data_pagamento", inicioStr)
          .lte("data_pagamento", fimStr)
          .eq("estornado", false);

        // Processar entradas por categoria
        let entradasPorCategoria: Record<string, number> = {};
        let totalEntradas = 0;

        for (const pag of pagamentosReceber || []) {
          const valorLiquido = (pag.valor_pago || 0) + (pag.juros || 0) - (pag.desconto || 0);
          totalEntradas += valorLiquido;

          // Buscar categoria do pagamento
          const { data: parcela } = await supabase
            .from('contas_receber_parcelas')
            .select('conta_receber_id')
            .eq('id', pag.parcela_id)
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
                const { data: cat } = await supabase
                  .from('categorias_plano_contas')
                  .select('codigo')
                  .eq('id', plano.categoria_id)
                  .single();

                if (cat?.codigo) {
                  entradasPorCategoria[cat.codigo] = (entradasPorCategoria[cat.codigo] || 0) + valorLiquido;
                }
              }
            }
          }
        }

        // Processar saídas por categoria
        let saidasPorCategoria: Record<string, number> = {};
        let totalSaidas = 0;

        for (const pag of pagamentosPagar || []) {
          const valorLiquido = (pag.valor_pago || 0) + (pag.juros || 0) - (pag.desconto || 0);
          totalSaidas += valorLiquido;

          // Buscar categoria do pagamento
          const { data: parcela } = await supabase
            .from('contas_pagar_parcelas')
            .select('conta_pagar_id')
            .eq('id', pag.parcela_id)
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
                const { data: cat } = await supabase
                  .from('categorias_plano_contas')
                  .select('codigo')
                  .eq('id', plano.categoria_id)
                  .single();

                if (cat?.codigo) {
                  saidasPorCategoria[cat.codigo] = (saidasPorCategoria[cat.codigo] || 0) + valorLiquido;
                }
              }
            }
          }
        }

        const entradasCalc = {
          receitaVendas: entradasPorCategoria['1'] || 0,
          receitasNaoOperacionais: entradasPorCategoria['9'] || 0,
          transferenciasAjustes: entradasPorCategoria['14'] || 0,
          importacao: entradasPorCategoria['98'] || 0,
          receitasFinanceiras: entradasPorCategoria['106'] || 0,
          investimentosPositivos: entradasPorCategoria['111'] || 0,
          total: totalEntradas
        };

        const saidasCalc = {
          impostosSobreVendas: saidasPorCategoria['2'] || 0,
          cmv: saidasPorCategoria['3'] || 0,
          despesasPessoal: saidasPorCategoria['5'] || 0,
          despesasOcupacao: saidasPorCategoria['6'] || 0,
          despesasAdministrativas: saidasPorCategoria['7'] || 0,
          despesasComerciais: saidasPorCategoria['8'] || 0,
          gastosNaoOperacionais: saidasPorCategoria['10'] || 0,
          investimentosNegativos: saidasPorCategoria['12'] || 0,
          transferenciasAjustes: saidasPorCategoria['13'] || 0,
          outrasDeducoes: saidasPorCategoria['99'] || 0,
          despesaOperacionalVariavel: saidasPorCategoria['103'] || 0,
          despesasFinanceiras: saidasPorCategoria['107'] || 0,
          campanhasSazonais: saidasPorCategoria['112'] || 0,
          total: totalSaidas
        };

        const saldoOperacional = entradasCalc.total - saidasCalc.total;
        // Adicionar saldos configurados no mês ao cálculo
        const saldoFinal = saldoAnterior + saldosConfiguradosNoMes + saldoOperacional;

        fluxoCalculado.push({
          mes: meses[mes],
          saldoInicial: saldoAnterior,
          entradas: entradasCalc,
          saidas: saidasCalc,
          saldoOperacional,
          saldoFinal
        });

        saldoAnterior = saldoFinal;
      }

      setFluxo(fluxoCalculado);
    } catch (error) {
      console.error("Erro ao carregar fluxo:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleExportar = () => {
    const headers = ['Categoria', ...meses];
    const rows: string[][] = [];

    rows.push(['SALDO INICIAL', ...fluxo.map(f => f.saldoInicial.toFixed(2))]);
    rows.push(['ENTRADAS', ...fluxo.map(f => f.entradas.total.toFixed(2))]);
    rows.push(['1 - Receita com Vendas', ...fluxo.map(f => f.entradas.receitaVendas.toFixed(2))]);
    // ... adicionar todas as outras linhas

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fluxo-caixa-mensal-${ano}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton to="/financeiro/fluxo-caixa" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-primary" />
            Fluxo de Caixa Mensal
          </h1>
          <p className="text-muted-foreground">Visão comparativa mensal completa</p>
        </div>
      </div>

      {/* Filtro de Ano */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-32">
              <Label htmlFor="ano">Ano</Label>
              <Input
                id="ano"
                type="number"
                value={ano}
                onChange={(e) => setAno(parseInt(e.target.value))}
                min="2020"
                max="2030"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Fluxo Mensal */}
      <Card>
        <CardHeader>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <CardTitle>Fluxo de Caixa {ano}</CardTitle>
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
            <CardDescription>
              Comparativo mensal com todas as categorias
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px] sticky left-0 bg-background z-10">
                    Fluxo de Caixa
                  </TableHead>
                  {meses.map((mes) => (
                    <TableHead key={mes} className="text-right min-w-[120px]">
                      {mes}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* SALDO INICIAL */}
                <TableRow className="bg-blue-50/50">
                  <TableCell className="font-bold sticky left-0 bg-blue-50/50 z-10">SALDO INICIAL</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className="text-right font-medium">
                      {f.saldoInicial.toFixed(2)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* ENTRADAS */}
                <TableRow className="bg-green-50">
                  <TableCell className="font-bold sticky left-0 bg-green-50 z-10">ENTRADAS</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className="text-right font-bold text-green-700">
                      {f.entradas.total.toFixed(2)}
                    </TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8 sticky left-0 bg-background z-10">1 - Receita com Vendas</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className="text-right">{f.entradas.receitaVendas.toFixed(2)}</TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8 sticky left-0 bg-background z-10">9 - Receitas não Operacionais</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className="text-right">{f.entradas.receitasNaoOperacionais.toFixed(2)}</TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8 sticky left-0 bg-background z-10">14 - Transferências e Ajustes de Saldo</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className="text-right">{f.entradas.transferenciasAjustes.toFixed(2)}</TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8 sticky left-0 bg-background z-10">98 - Importação</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className="text-right">{f.entradas.importacao.toFixed(2)}</TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8 sticky left-0 bg-background z-10">106 - Receitas Financeiras</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className="text-right">{f.entradas.receitasFinanceiras.toFixed(2)}</TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8 sticky left-0 bg-background z-10">111 - Investimentos (+)</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className="text-right">{f.entradas.investimentosPositivos.toFixed(2)}</TableCell>
                  ))}
                </TableRow>

                {/* SAÍDAS */}
                <TableRow className="bg-red-50">
                  <TableCell className="font-bold sticky left-0 bg-red-50 z-10">SAÍDAS</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className="text-right font-bold text-red-700">
                      {f.saidas.total.toFixed(2)}
                    </TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8 sticky left-0 bg-background z-10">2 - Impostos Sobre Vendas</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className="text-right">{f.saidas.impostosSobreVendas.toFixed(2)}</TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8 sticky left-0 bg-background z-10">3 - CMV - Custo de Mercadoria Vendida</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className="text-right">{f.saidas.cmv.toFixed(2)}</TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8 sticky left-0 bg-background z-10">5 - Despesas com Pessoal</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className="text-right">{f.saidas.despesasPessoal.toFixed(2)}</TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8 sticky left-0 bg-background z-10">6 - Despesas com Ocupação</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className="text-right">{f.saidas.despesasOcupacao.toFixed(2)}</TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8 sticky left-0 bg-background z-10">7 - Despesas Administrativas</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className="text-right">{f.saidas.despesasAdministrativas.toFixed(2)}</TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8 sticky left-0 bg-background z-10">8 - Despesas Comerciais</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className="text-right">{f.saidas.despesasComerciais.toFixed(2)}</TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8 sticky left-0 bg-background z-10">10 - Gastos não Operacionais</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className="text-right">{f.saidas.gastosNaoOperacionais.toFixed(2)}</TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8 sticky left-0 bg-background z-10">12 - Investimentos (-)</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className="text-right">{f.saidas.investimentosNegativos.toFixed(2)}</TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8 sticky left-0 bg-background z-10">13 - Transferências e Ajustes de Saldo</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className="text-right">{f.saidas.transferenciasAjustes.toFixed(2)}</TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8 sticky left-0 bg-background z-10">99 - Outras Deduções sobre Vendas</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className="text-right">{f.saidas.outrasDeducoes.toFixed(2)}</TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8 sticky left-0 bg-background z-10">103 - Despesa Operacional Variável</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className="text-right">{f.saidas.despesaOperacionalVariavel.toFixed(2)}</TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8 sticky left-0 bg-background z-10">107 - Despesas Financeiras</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className="text-right">{f.saidas.despesasFinanceiras.toFixed(2)}</TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell className="pl-8 sticky left-0 bg-background z-10">112 - Campanhas Sazonais</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className="text-right">{f.saidas.campanhasSazonais.toFixed(2)}</TableCell>
                  ))}
                </TableRow>

                {/* SALDO OPERACIONAL */}
                <TableRow className="bg-amber-50">
                  <TableCell className="font-bold sticky left-0 bg-amber-50 z-10">SALDO OPERACIONAL</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className={`text-right font-bold ${f.saldoOperacional >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {f.saldoOperacional.toFixed(2)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* SALDO FINAL */}
                <TableRow className="bg-primary/10">
                  <TableCell className="font-bold sticky left-0 bg-primary/10 z-10">SALDO FINAL</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className={`text-right font-bold ${f.saldoFinal >= 0 ? 'text-primary' : 'text-red-700'}`}>
                      {f.saldoFinal.toFixed(2)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
