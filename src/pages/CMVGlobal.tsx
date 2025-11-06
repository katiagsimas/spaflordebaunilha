import { useState, useEffect } from "react";
import { Calculator, TrendingDown, TrendingUp, DollarSign, Package, Edit2, Save, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCMVMensal } from "@/hooks/useCMVMensal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CMVGlobal() {
  const anoAtual = new Date().getFullYear();
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);
  const [mesEditando, setMesEditando] = useState<number | null>(null);
  const [dadosEditados, setDadosEditados] = useState<Record<number, any>>({});

  const { dadosAnuais, isLoading, upsertDado } = useCMVMensal(anoSelecionado);

  useEffect(() => {
    setDadosEditados({});
    setMesEditando(null);
  }, [anoSelecionado]);

  const handleEditar = (mes: number, campo: string, valor: string) => {
    const mesData = dadosAnuais.find((d) => d.mes === mes);
    setDadosEditados((prev) => ({
      ...prev,
      [mes]: {
        ...prev[mes],
        [campo]: parseFloat(valor) || 0,
      },
    }));
  };

  const handleSalvarMes = async (mes: number) => {
    try {
      const valores = dadosEditados[mes] || {};
      const mesData = dadosAnuais.find((d) => d.mes === mes);

      // Estoque inicial só pode ser editado no primeiro mês
      const estoqueInicial = mes === 1 ? valores.estoque_inicial ?? mesData?.estoque_inicial : null;

      await upsertDado({
        ano: anoSelecionado,
        mes,
        updates: {
          estoque_inicial: estoqueInicial,
          compras: valores.compras ?? mesData?.compras,
          estoque_final: valores.estoque_final ?? mesData?.estoque_final,
          faturamento: valores.faturamento ?? mesData?.faturamento,
          usa_dados_sistema: anoSelecionado >= 2025,
        },
      });

      setMesEditando(null);
      setDadosEditados((prev) => {
        const newData = { ...prev };
        delete newData[mes];
        return newData;
      });
      toast.success("Dados salvos com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar dados");
    }
  };

  const handleCancelarMes = (mes: number) => {
    setMesEditando(null);
    setDadosEditados((prev) => {
      const newData = { ...prev };
      delete newData[mes];
      return newData;
    });
  };

  // Calcular totais
  const totais = dadosAnuais.reduce(
    (acc, mes) => ({
      compras: acc.compras + (mes.compras || 0),
      cmv: acc.cmv + (mes.cmv || 0),
      faturamento: acc.faturamento + (mes.faturamento || 0),
    }),
    { compras: 0, cmv: 0, faturamento: 0 }
  );

  const percentualCMVMedio = totais.faturamento > 0 ? (totais.cmv / totais.faturamento) * 100 : 0;

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor || 0);
  };

  const getCorPercentual = (percentual: number) => {
    if (percentual <= 30) return "text-green-600 bg-green-50 border-green-200";
    if (percentual <= 40) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getStatusPercentual = (percentual: number) => {
    if (percentual <= 30) return "✅ Excelente";
    if (percentual <= 40) return "⚠️ Atenção";
    return "🚨 Crítico";
  };

  // Gerar lista de anos (2020 até ano atual + 1)
  const anos = Array.from({ length: anoAtual - 2020 + 2 }, (_, i) => 2020 + i);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="CMV Global"
          description="Custo de Mercadoria Vendida - Análise Anual"
          backButton={<BackButton to="/planejamento" />}
        />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="CMV Global"
        description="Custo de Mercadoria Vendida - Análise Anual"
        backButton={<BackButton to="/relatorios/inteligencia" />}
      />

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Ano:</label>
        <Select value={anoSelecionado.toString()} onValueChange={(v) => setAnoSelecionado(parseInt(v))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {anos.map((ano) => (
              <SelectItem key={ano} value={ano.toString()}>
                {ano}
                {ano === anoAtual && " (atual)"}
                {ano < 2025 && " (histórico)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Alertas informativos */}
      {anoSelecionado < 2025 && (
        <Alert>
          <AlertDescription>
            📝 <strong>Ano {anoSelecionado} (Histórico):</strong> Todos os dados devem ser digitados manualmente.
            Use este recurso para registrar informações de anos anteriores.
          </AlertDescription>
        </Alert>
      )}

      {anoSelecionado >= 2025 && (
        <Alert>
          <AlertDescription>
            🤖 <strong>Ano {anoSelecionado}:</strong> Dados carregados automaticamente do sistema. Você pode fazer
            ajustes manuais se necessário.
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compras Totais</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarMoeda(totais.compras)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CMV Total</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarMoeda(totais.cmv)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarMoeda(totais.faturamento)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">% CMV Médio</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{percentualCMVMedio.toFixed(1)}%</div>
            <Badge variant="outline" className={cn("mt-1", getCorPercentual(percentualCMVMedio))}>
              {getStatusPercentual(percentualCMVMedio)}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Tabela CMV */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Mensal - {anoSelecionado}</CardTitle>
          <CardDescription>Detalhamento do Custo de Mercadoria Vendida por mês</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Mês</TableHead>
                  <TableHead className="text-right">Estoque Inicial</TableHead>
                  <TableHead className="text-right">Compras</TableHead>
                  <TableHead className="text-right">Estoque Final</TableHead>
                  <TableHead className="text-right">CMV</TableHead>
                  <TableHead className="text-right">Faturamento</TableHead>
                  <TableHead className="text-right">% CMV</TableHead>
                  <TableHead className="text-center w-32">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosAnuais.map((mes, index) => {
                  const editandoEsteMes = mesEditando === mes.mes;
                  const dadosEditadosMes = dadosEditados[mes.mes] || {};
                  const estoqueInicial =
                    mes.mes === 1
                      ? editandoEsteMes
                        ? dadosEditadosMes.estoque_inicial ?? mes.estoque_inicial
                        : mes.estoque_inicial
                      : index > 0
                      ? dadosAnuais[index - 1].estoque_final
                      : 0;

                  const compras = editandoEsteMes ? dadosEditadosMes.compras ?? mes.compras : mes.compras;
                  const estoqueFinal = editandoEsteMes
                    ? dadosEditadosMes.estoque_final ?? mes.estoque_final
                    : mes.estoque_final;
                  const faturamento = editandoEsteMes ? dadosEditadosMes.faturamento ?? mes.faturamento : mes.faturamento;

                  const cmvCalculado = (estoqueInicial || 0) + (compras || 0) - (estoqueFinal || 0);
                  const percentualCalculado = faturamento > 0 ? (cmvCalculado / faturamento) * 100 : 0;

                  return (
                    <TableRow key={mes.mes}>
                      <TableCell className="font-medium">{mes.mes_nome}</TableCell>

                      {/* Estoque Inicial */}
                      <TableCell className="text-right">
                        {mes.mes === 1 && editandoEsteMes ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={dadosEditadosMes.estoque_inicial ?? mes.estoque_inicial}
                            onChange={(e) => handleEditar(mes.mes, "estoque_inicial", e.target.value)}
                            className="text-right h-9"
                          />
                        ) : (
                          <span className="text-sm">{formatarMoeda(estoqueInicial)}</span>
                        )}
                      </TableCell>

                      {/* Compras */}
                      <TableCell className="text-right">
                        {editandoEsteMes ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={dadosEditadosMes.compras ?? mes.compras}
                            onChange={(e) => handleEditar(mes.mes, "compras", e.target.value)}
                            className="text-right h-9"
                          />
                        ) : (
                          formatarMoeda(compras)
                        )}
                      </TableCell>

                      {/* Estoque Final */}
                      <TableCell className="text-right">
                        {editandoEsteMes ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={dadosEditadosMes.estoque_final ?? mes.estoque_final}
                            onChange={(e) => handleEditar(mes.mes, "estoque_final", e.target.value)}
                            className="text-right h-9"
                          />
                        ) : (
                          formatarMoeda(estoqueFinal)
                        )}
                      </TableCell>

                      {/* CMV (Calculado) */}
                      <TableCell className="text-right font-semibold">{formatarMoeda(cmvCalculado)}</TableCell>

                      {/* Faturamento */}
                      <TableCell className="text-right">
                        {editandoEsteMes ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={dadosEditadosMes.faturamento ?? mes.faturamento}
                            onChange={(e) => handleEditar(mes.mes, "faturamento", e.target.value)}
                            className="text-right h-9"
                          />
                        ) : (
                          formatarMoeda(faturamento)
                        )}
                      </TableCell>

                      {/* % CMV (Calculado) */}
                      <TableCell className="text-right">
                        <Badge variant="outline" className={cn("font-semibold", getCorPercentual(percentualCalculado))}>
                          {percentualCalculado.toFixed(1)}%
                        </Badge>
                      </TableCell>

                      {/* Ações */}
                      <TableCell className="text-center">
                        {editandoEsteMes ? (
                          <div className="flex gap-1 justify-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancelarMes(mes.mes)}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSalvarMes(mes.mes)}
                              className="h-8 w-8 p-0"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setMesEditando(mes.mes)}
                            disabled={mesEditando !== null}
                            className="h-8"
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Alterar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* LINHA DE TOTAIS */}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>TOTAL {anoSelecionado}</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">{formatarMoeda(totais.compras)}</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">{formatarMoeda(totais.cmv)}</TableCell>
                  <TableCell className="text-right">{formatarMoeda(totais.faturamento)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={cn("font-semibold", getCorPercentual(percentualCMVMedio))}>
                      {percentualCMVMedio.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Legenda */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
            <h4 className="font-semibold mb-2">📚 Como Interpretar:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• <strong>CMV</strong> = Estoque Inicial + Compras - Estoque Final</li>
              <li>• <strong>% CMV Ideal para Confeitaria:</strong> Entre 25% e 30%</li>
              <li>• ✅ <strong>0-30%:</strong> Excelente controle de custos</li>
              <li>• ⚠️ <strong>31-40%:</strong> Atenção! Revisar fornecedores e desperdícios</li>
              <li>• 🚨 <strong>Acima de 40%:</strong> Crítico! Ajustes urgentes necessários</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
