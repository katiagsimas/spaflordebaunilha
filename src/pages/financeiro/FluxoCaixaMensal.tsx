import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDateToISO } from "@/lib/dateUtils";
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
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/BackButton";
import { useGlobalLoading } from "@/contexts/GlobalLoadingContext";

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
  const [searchParams] = useSearchParams();
  const { showLoading, hideLoading } = useGlobalLoading();
  const [ano, setAno] = useState(() => {
    const anoParam = searchParams.get("ano");
    const parsed = anoParam ? parseInt(anoParam, 10) : NaN;
    return !isNaN(parsed) && parsed >= 2000 && parsed <= 2100 ? parsed : new Date().getFullYear();
  });
  const [fluxo, setFluxo] = useState<FluxoMensal[] | null>(null);

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  useEffect(() => {
    carregarFluxo();
  }, [ano]);

  async function carregarFluxo() {
    showLoading('Carregando fluxo de caixa mensal...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const inicioAno = `${ano}-01-01`;
      const fimAno = `${ano}-12-31`;

      // Buscar TODOS os dados necessários em paralelo, fora do loop.
      const [
        saldosBancosRes,
        saldosConfiguradosAntRes,
        saldosConfiguradosAnoRes,
        entradasAnterioresRes,
        saidasAnterioresRes,
        pagamentosReceberAnoRes,
        pagamentosPagarAnoRes,
      ] = await Promise.all([
        supabase
          .from('bancos')
          .select('saldo_inicial')
          .eq('usuario_id', user.id),
        supabase
          .from('saldos_iniciais_bancos')
          .select('saldo_inicial, data_referencia')
          .eq('user_id', user.id)
          .lt('data_referencia', inicioAno),
        supabase
          .from('saldos_iniciais_bancos')
          .select('saldo_inicial, data_referencia')
          .eq('user_id', user.id)
          .gte('data_referencia', inicioAno)
          .lte('data_referencia', fimAno),
        supabase
          .from('contas_receber_pagamentos')
          .select(`
            valor_pago, juros, desconto,
            parcela:contas_receber_parcelas!inner (
              conta:contas_receber!inner ( usuario_id )
            )
          `)
          .lt('data_pagamento', inicioAno)
          .eq('estornado', false)
          .eq('parcela.conta.usuario_id', user.id),
        supabase
          .from('contas_pagar_pagamentos')
          .select(`
            valor_pago, juros, desconto,
            parcela:contas_pagar_parcelas!inner (
              conta:contas_pagar!inner ( usuario_id )
            )
          `)
          .lt('data_pagamento', inicioAno)
          .eq('estornado', false)
          .eq('parcela.conta.usuario_id', user.id),
        supabase
          .from('contas_receber_pagamentos')
          .select(`
            valor_pago, juros, desconto, data_pagamento,
            parcela:contas_receber_parcelas!inner (
              conta:contas_receber!inner (
                usuario_id,
                plano:plano_contas!plano_conta_id (
                  categoria:categorias_plano_contas!categoria_id ( codigo )
                )
              )
            )
          `)
          .gte('data_pagamento', inicioAno)
          .lte('data_pagamento', fimAno)
          .eq('estornado', false)
          .eq('parcela.conta.usuario_id', user.id),
        supabase
          .from('contas_pagar_pagamentos')
          .select(`
            valor_pago, juros, desconto, data_pagamento,
            parcela:contas_pagar_parcelas!inner (
              conta:contas_pagar!inner (
                usuario_id,
                plano:plano_contas!plano_contas_id (
                  categoria:categorias_plano_contas!categoria_id ( codigo )
                )
              )
            )
          `)
          .gte('data_pagamento', inicioAno)
          .lte('data_pagamento', fimAno)
          .eq('estornado', false)
          .eq('parcela.conta.usuario_id', user.id),
      ]);

      const saldoInicialBancos = (saldosBancosRes.data || [])
        .reduce((acc, s: any) => acc + (s.saldo_inicial || 0), 0);

      const totalSaldosConfiguradosIniciais = (saldosConfiguradosAntRes.data || [])
        .reduce((acc, s: any) => acc + (s.saldo_inicial || 0), 0);

      const totalEntradasAnt = ((entradasAnterioresRes.data as any[]) || [])
        .reduce((sum, e) => sum + (e.valor_pago || 0) + (e.juros || 0) - (e.desconto || 0), 0);

      const totalSaidasAnt = ((saidasAnterioresRes.data as any[]) || [])
        .reduce((sum, s) => sum + (s.valor_pago || 0) + (s.juros || 0) - (s.desconto || 0), 0);

      // Indexar saldos configurados do ano por mês (0–11)
      const saldosConfigPorMes: number[] = Array(12).fill(0);
      ((saldosConfiguradosAnoRes.data as any[]) || []).forEach((s) => {
        if (!s.data_referencia) return;
        const [, mesP] = String(s.data_referencia).split('-').map(Number);
        const idx = (mesP || 1) - 1;
        if (idx >= 0 && idx < 12) {
          saldosConfigPorMes[idx] += s.saldo_inicial || 0;
        }
      });

      // Indexar pagamentos por mês e por categoria (codigo)
      const entradasPorMesCat: Array<Record<string, number>> = Array.from({ length: 12 }, () => ({}));
      const totalEntradasMes: number[] = Array(12).fill(0);
      ((pagamentosReceberAnoRes.data as any[]) || []).forEach((pag) => {
        if (!pag.data_pagamento) return;
        const [anoP, mesP] = String(pag.data_pagamento).split('-').map(Number);
        if (anoP !== ano) return;
        const idx = (mesP || 1) - 1;
        const valor = (pag.valor_pago || 0) + (pag.juros || 0) - (pag.desconto || 0);
        totalEntradasMes[idx] += valor;
        const codigo = pag?.parcela?.conta?.plano?.categoria?.codigo;
        if (codigo) {
          entradasPorMesCat[idx][codigo] = (entradasPorMesCat[idx][codigo] || 0) + valor;
        }
      });

      const saidasPorMesCat: Array<Record<string, number>> = Array.from({ length: 12 }, () => ({}));
      const totalSaidasMes: number[] = Array(12).fill(0);
      ((pagamentosPagarAnoRes.data as any[]) || []).forEach((pag) => {
        if (!pag.data_pagamento) return;
        const [anoP, mesP] = String(pag.data_pagamento).split('-').map(Number);
        if (anoP !== ano) return;
        const idx = (mesP || 1) - 1;
        const valor = (pag.valor_pago || 0) + (pag.juros || 0) - (pag.desconto || 0);
        totalSaidasMes[idx] += valor;
        const codigo = pag?.parcela?.conta?.plano?.categoria?.codigo;
        if (codigo) {
          saidasPorMesCat[idx][codigo] = (saidasPorMesCat[idx][codigo] || 0) + valor;
        }
      });

      // Loop puramente em memória — nenhum await aqui dentro
      const fluxoCalculado: FluxoMensal[] = [];
      let saldoAnterior = saldoInicialBancos + totalSaldosConfiguradosIniciais + totalEntradasAnt - totalSaidasAnt;

      for (let mes = 0; mes < 12; mes++) {
        const entradasPorCategoria = entradasPorMesCat[mes];
        const saidasPorCategoria = saidasPorMesCat[mes];
        const totalEntradas = totalEntradasMes[mes];
        const totalSaidas = totalSaidasMes[mes];
        const saldosConfiguradosNoMes = saldosConfigPorMes[mes];

        const entradasCalc = {
          receitaVendas: entradasPorCategoria['1'] || 0,
          receitasNaoOperacionais: entradasPorCategoria['9'] || 0,
          transferenciasAjustes: entradasPorCategoria['14'] || 0,
          importacao: entradasPorCategoria['98'] || 0,
          receitasFinanceiras: entradasPorCategoria['106'] || 0,
          investimentosPositivos: entradasPorCategoria['111'] || 0,
          total: totalEntradas,
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
          total: totalSaidas,
        };

        const saldoOperacional = entradasCalc.total - saidasCalc.total;
        const saldoFinal = saldoAnterior + saldosConfiguradosNoMes + saldoOperacional;

        fluxoCalculado.push({
          mes: meses[mes],
          saldoInicial: saldoAnterior + saldosConfiguradosNoMes,
          entradas: entradasCalc,
          saidas: saidasCalc,
          saldoOperacional,
          saldoFinal,
        });

        saldoAnterior = saldoFinal;
      }

      setFluxo(fluxoCalculado);
    } catch (error) {
      console.error("Erro ao carregar fluxo:", error);
    } finally {
      hideLoading();
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

  if (fluxo === null) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Fluxo de Caixa Mensal"
        description="Visão comparativa mensal completa."
        backButton={<BackButton to="/financeiro/fluxo-caixa" />}
      />


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
                  Exportar .xlsx
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
                <TableRow className="bg-cda-dourado/10/50">
                  <TableCell className="font-bold sticky left-0 bg-cda-dourado/10/50 z-10">SALDO INICIAL</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className="text-right font-medium">
                      {f.saldoInicial.toFixed(2)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* ENTRADAS */}
                <TableRow className="bg-success/10">
                  <TableCell className="font-bold sticky left-0 bg-success/10 z-10">ENTRADAS</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className="text-right font-bold text-success">
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
                <TableRow className="bg-cda-coral/10">
                  <TableCell className="font-bold sticky left-0 bg-cda-coral/10 z-10">SAÍDAS</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className="text-right font-bold text-cda-coral">
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
                    <TableCell key={i} className={`text-right font-bold ${f.saldoOperacional >= 0 ? 'text-success' : 'text-cda-coral'}`}>
                      {f.saldoOperacional.toFixed(2)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* SALDO FINAL */}
                <TableRow className="bg-primary/10">
                  <TableCell className="font-bold sticky left-0 bg-primary/10 z-10">SALDO FINAL</TableCell>
                  {fluxo.map((f, i) => (
                    <TableCell key={i} className={`text-right font-bold ${f.saldoFinal >= 0 ? 'text-primary' : 'text-cda-coral'}`}>
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
