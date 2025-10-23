import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, TrendingUp, DollarSign, Package, Info } from "lucide-react";
import { useCMVGlobal } from "@/hooks/useCMVGlobal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function RelatorioCMVGlobal() {
  const hoje = new Date();
  const [mesSelecionado, setMesSelecionado] = useState(hoje.getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState(hoje.getFullYear());

  const { cmvData, isLoading } = useCMVGlobal({
    mes: mesSelecionado,
    ano: anoSelecionado
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getCorPorStatus = (cor: string) => {
    const cores: Record<string, string> = {
      green: 'bg-success text-success-foreground',
      yellow: 'bg-warning text-warning-foreground',
      orange: 'bg-destructive/70 text-destructive-foreground',
      red: 'bg-destructive text-destructive-foreground'
    };
    return cores[cor] || 'bg-muted text-muted-foreground';
  };

  const getAlertVariant = (tipo: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      CRITICO: 'destructive',
      ATENCAO: 'outline',
      INFO: 'secondary',
      SUCESSO: 'default'
    };
    return variants[tipo] || 'default';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Relatório de CMV Global"
          description="Custo de Mercadoria Vendida"
          backButton={<BackButton to="/estoque/relatorios" />}
        />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!cmvData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Relatório de CMV Global"
          description="Custo de Mercadoria Vendida"
          backButton={<BackButton to="/estoque/relatorios" />}
        />
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Não há dados disponíveis para o período selecionado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatório de CMV Global"
        description="Custo de Mercadoria Vendida"
        backButton={<BackButton to="/estoque/relatorios" />}
      />

      {/* Seleção de Período */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selecionar Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Mês</label>
              <Select
                value={mesSelecionado.toString()}
                onValueChange={(value) => setMesSelecionado(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((mes, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {mes}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Ano</label>
              <Select
                value={anoSelecionado.toString()}
                onValueChange={(value) => setAnoSelecionado(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => hoje.getFullYear() - i).map((ano) => (
                    <SelectItem key={ano} value={ano.toString()}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setMesSelecionado(hoje.getMonth() + 1);
                  setAnoSelecionado(hoje.getFullYear());
                }}
              >
                Este Mês
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
                  setMesSelecionado(mesPassado.getMonth() + 1);
                  setAnoSelecionado(mesPassado.getFullYear());
                }}
              >
                Mês Passado
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demonstrativo do CMV */}
      <Card>
        <CardHeader>
          <CardTitle>Demonstrativo do CMV - {meses[mesSelecionado - 1]}/{anoSelecionado}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estoque Inicial */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                (=) ESTOQUE INICIAL
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Saldo do mês anterior
            </p>
            <p className="text-3xl font-bold">{formatCurrency(cmvData.estoqueInicial)}</p>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Valor calculado automaticamente do saldo final do mês anterior
            </p>
          </div>

          {/* Compras do Mês */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                (+) COMPRAS DO MÊS
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Todas as entradas de estoque
            </p>
            <p className="text-3xl font-bold text-success">{formatCurrency(cmvData.compras.total)}</p>
            
            <div className="mt-4 space-y-2 text-sm">
              <p className="font-medium">📋 Detalhamento:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <p>• Total de entradas: {cmvData.compras.quantidade}</p>
                <p>• Maior compra: {formatCurrency(cmvData.compras.maiorCompra)}</p>
              </div>
              
              {Object.keys(cmvData.compras.porCategoria).length > 0 && (
                <div className="mt-3">
                  <p className="font-medium mb-2">Por Categoria:</p>
                  {Object.entries(cmvData.compras.porCategoria).map(([categoria, valor]) => (
                    <div key={categoria} className="flex justify-between text-xs mb-1">
                      <span>• {categoria}</span>
                      <span className="font-medium">
                        {formatCurrency(valor)} 
                        ({((valor / cmvData.compras.total) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Estoque Final */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-destructive" />
                (-) ESTOQUE FINAL
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Saldo atual do estoque
            </p>
            <p className="text-3xl font-bold text-destructive">{formatCurrency(cmvData.estoqueFinal.valor)}</p>
            
            <div className="mt-4 space-y-2 text-sm">
              <p className="font-medium">📊 Composição do Estoque:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <p>• {cmvData.estoqueFinal.detalhes.totalItens} itens cadastrados</p>
                <p>• {cmvData.estoqueFinal.detalhes.itensAtivos} itens ativos</p>
                {cmvData.estoqueFinal.detalhes.itensAbaixoMinimo > 0 && (
                  <p className="text-warning">• {cmvData.estoqueFinal.detalhes.itensAbaixoMinimo} abaixo do mínimo ⚠️</p>
                )}
              </div>
            </div>
          </div>

          {/* CMV Total */}
          <div className="border-2 border-primary rounded-lg p-6 bg-primary/5">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              (=) CUSTO DE MERCADORIA VENDIDA (CMV)
            </h3>
            <p className="text-4xl font-bold text-primary mb-3">{formatCurrency(cmvData.cmv)}</p>
            <p className="text-sm text-muted-foreground">
              📝 Cálculo: {formatCurrency(cmvData.estoqueInicial)} + {formatCurrency(cmvData.compras.total)} - {formatCurrency(cmvData.estoqueFinal.valor)} = {formatCurrency(cmvData.cmv)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Análise do CMV */}
      <Card>
        <CardHeader>
          <CardTitle>Análise do CMV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Faturamento */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <h3 className="font-semibold mb-2">📈 FATURAMENTO BRUTO DO MÊS</h3>
            <p className="text-3xl font-bold mb-2">{formatCurrency(cmvData.faturamento.valor)}</p>
            <p className="text-sm text-muted-foreground">
              Pedidos recebidos: {cmvData.faturamento.pedidos}
            </p>
          </div>

          {/* Indicadores */}
          <div className="border rounded-lg p-6 bg-card">
            <h3 className="font-semibold text-lg mb-4">📊 INDICADORES DO CMV</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Custo do CMV</p>
                  <p className="text-xl font-bold">{formatCurrency(cmvData.cmv)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Faturamento Bruto</p>
                  <p className="text-xl font-bold">{formatCurrency(cmvData.faturamento.valor)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm text-muted-foreground">% CMV</p>
                    <p className="text-3xl font-bold">{cmvData.percentualCMV.toFixed(2)}%</p>
                  </div>
                  <Badge className={getCorPorStatus(cmvData.classificacao.cor)}>
                    {cmvData.classificacao.emoji} {cmvData.classificacao.status}
                  </Badge>
                </div>
                <Progress value={Math.min(cmvData.percentualCMV, 100)} className="h-3" />
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Lucro Bruto</p>
                    <p className="text-xl font-bold text-success">{formatCurrency(cmvData.lucroBruto)}</p>
                    <p className="text-xs text-muted-foreground">(Faturamento - CMV)</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Margem Bruta</p>
                    <p className="text-xl font-bold text-success">{cmvData.margemBruta.toFixed(2)}%</p>
                    <p className="text-xs text-muted-foreground">(100% - % CMV)</p>
                  </div>
                </div>
                <Progress value={Math.min(cmvData.margemBruta, 100)} className="h-3 mt-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classificação e Benchmarks */}
      <Card>
        <CardHeader>
          <CardTitle>Classificação e Benchmarks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border rounded-lg p-6 bg-card">
            <h3 className="font-semibold text-lg mb-4">🎯 CLASSIFICAÇÃO DO SEU CMV</h3>
            
            <div className="flex items-center gap-3 mb-6">
              <span className="text-5xl">{cmvData.classificacao.emoji}</span>
              <div>
                <p className="text-2xl font-bold">{cmvData.percentualCMV.toFixed(2)}%</p>
                <Badge className={getCorPorStatus(cmvData.classificacao.cor)}>
                  {cmvData.classificacao.status}
                </Badge>
              </div>
            </div>

            <div className="border-t pt-4 mb-4">
              <p className="font-medium mb-3">📊 Benchmark Confeitaria Artesanal:</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-success">🟢 EXCELENTE</Badge>
                  <span className="text-muted-foreground">{'<'} 30% - Gestão eficiente!</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-warning">🟡 BOM</Badge>
                  <span className="text-muted-foreground">30-40% - Dentro da média</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-destructive/70">🟠 ATENÇÃO</Badge>
                  <span className="text-muted-foreground">40-50% - Revisar custos/preços</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">🔴 CRÍTICO</Badge>
                  <span className="text-muted-foreground">{'>'} 50% - Ação urgente necessária</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 bg-muted/30 p-4 rounded-lg">
              <p className="font-medium mb-2">💡 SEU RESULTADO:</p>
              <p className="text-sm text-muted-foreground">{cmvData.classificacao.mensagem}</p>
            </div>
          </div>

          {/* Alertas */}
          <div>
            <h3 className="font-semibold mb-3">⚠️ ALERTAS E RECOMENDAÇÕES</h3>
            <div className="space-y-3">
              {cmvData.alertas.map((alerta, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{alerta.icone}</span>
                    <div className="flex-1">
                      <p className="font-semibold mb-1">{alerta.titulo}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {alerta.mensagem}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orientações */}
      <Card>
        <CardHeader>
          <CardTitle>Orientações e Dicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-4 bg-muted/50">
            <h3 className="font-semibold mb-3">💡 COMO MELHORAR SEU CMV</h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium mb-2">REDUZIR CUSTOS (Diminuir CMV):</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>✅ Negociar melhores preços com fornecedores</li>
                  <li>✅ Comprar em maior quantidade (atacado)</li>
                  <li>✅ Buscar fornecedores alternativos</li>
                  <li>✅ Reduzir desperdícios na produção</li>
                  <li>✅ Controlar porções rigorosamente</li>
                  <li>✅ Evitar perdas por validade (FIFO)</li>
                  <li>✅ Treinar equipe para otimizar receitas</li>
                </ul>
              </div>

              <div>
                <p className="font-medium mb-2">AUMENTAR RECEITA (Melhorar margem):</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>✅ Revisar precificação (se CMV {'>'} 40%)</li>
                  <li>✅ Focar em produtos de maior margem</li>
                  <li>✅ Oferecer produtos premium</li>
                  <li>✅ Combos e upsell</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-info/5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Info className="h-5 w-5" />
              ENTENDENDO O CMV
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                O CMV mostra quanto você gastou em ingredientes e insumos para produzir 
                o que vendeu no mês.
              </p>
              <p>
                🟢 CMV BAIXO = Boa gestão de custos e preços adequados
              </p>
              <p>
                🔴 CMV ALTO = Custos altos ou preços baixos
              </p>
              <p>
                Para confeitarias artesanais, o ideal é manter o CMV entre 25% e 35% do faturamento.
              </p>
              <p>
                Margem Bruta = Quanto sobra após cobrir custos diretos. Quanto maior a margem, 
                melhor para cobrir despesas fixas (aluguel, luz, salários) e gerar lucro.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
