import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Printer, Copy, Send } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConsumoMedio } from "@/hooks/useConsumoMedio";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export default function RelatorioConsumoMedio() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dias, setDias] = useState(30);
  const [mostrar, setMostrar] = useState<'todos' | 'com_consumo' | 'ativos'>('todos');

  const { analises, isLoading, resumo } = useConsumoMedio({
    dias,
    mostrar,
  });

  const itensComprar = analises.filter(a => a.diasAteMinimo <= 7 && a.status.prioridade <= 2);

  const copiarLista = () => {
    const texto = itensComprar
      .map(item => 
        `☐ ${item.item.nome} - ${item.sugestao.comprar} ${item.item.unidade} (${item.status.status})`
      )
      .join('\n');

    navigator.clipboard.writeText(texto);
    toast({
      title: "Lista copiada!",
      description: "A lista de compras foi copiada para a área de transferência",
    });
  };

  const enviarWhatsApp = () => {
    const texto = encodeURIComponent(
      `📋 *Lista de Compras - Sugar Box*\n\n` +
      itensComprar.map(item => 
        `☐ *${item.item.nome}*\n` +
        `   Comprar: ${item.sugestao.comprar} ${item.item.unidade}\n` +
        `   Atual: ${item.item.quantidade_atual} ${item.item.unidade}\n` +
        `   Média: ${item.mediaDiaria.toFixed(2)} ${item.item.unidade}/dia\n`
      ).join('\n')
    );

    window.open(`https://wa.me/?text=${texto}`, '_blank');
  };

  const getStatusBadge = (status: any) => {
    const colors: any = {
      URGENTE: 'destructive',
      EM_BREVE: 'secondary',
      OK: 'outline',
      BAIXO_USO: 'outline',
    };

    return (
      <Badge variant={colors[status.status] || 'outline'}>
        {status.emoji} {status.status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Análise de Consumo Médio"
        description="Consumo, previsões e sugestões de compra"
        actions={
          <Button variant="outline" onClick={() => navigate("/estoque/relatorios")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        }
      />

      {/* Configuração */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Período de Análise
              </label>
              <Select value={dias.toString()} onValueChange={(v) => setDias(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="15">Últimos 15 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="60">Últimos 60 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Mostrar
              </label>
              <Select value={mostrar} onValueChange={(v: any) => setMostrar(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os itens</SelectItem>
                  <SelectItem value="com_consumo">Apenas com consumo</SelectItem>
                  <SelectItem value="ativos">Apenas ativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Geral */}
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
                🔥 Mais Consumido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {resumo?.maisConsumido?.item?.nome || '-'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {resumo?.maisConsumido?.consumoTotal.toFixed(2)} {resumo?.maisConsumido?.item?.unidade}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                📉 Consumo Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {resumo?.consumoTotalGeral.toFixed(0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ⚠️ Atenção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {resumo?.itensAtencao}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                itens acabam em 7 dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                💰 Valor Consumido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {resumo?.valorTotalConsumido.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Compras Sugerida */}
      {itensComprar.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Lista de Compras Sugerida</CardTitle>
            <p className="text-sm text-muted-foreground">
              Itens que precisam ser comprados nos próximos 7 dias
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {itensComprar.map((item) => (
                <div key={item.item.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox />
                    <span className="font-medium">
                      {item.item.nome} - Comprar: {item.sugestao.comprar} {item.item.unidade}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="text-sm text-muted-foreground ml-6">
                    Atual: {item.item.quantidade_atual} {item.item.unidade} | 
                    Média: {item.mediaDiaria.toFixed(2)} {item.item.unidade}/dia
                  </div>
                  <div className="text-sm text-muted-foreground ml-6">
                    Sugestão: Atingir {item.sugestao.paraAtingir.toFixed(0)} {item.item.unidade} para ~{item.sugestao.coberturaDias} dias
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={copiarLista}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar Lista
              </Button>
              <Button variant="outline" onClick={enviarWhatsApp}>
                <Send className="mr-2 h-4 w-4" />
                Enviar WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Análise Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Detalhada por Item</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : analises.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum item encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Atual</TableHead>
                  <TableHead>Consumo Total</TableHead>
                  <TableHead>Média/Dia</TableHead>
                  <TableHead>Previsão Acabar</TableHead>
                  <TableHead>Comprar Em</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analises.map((analise) => (
                  <TableRow key={analise.item.id}>
                    <TableCell className="font-medium">
                      {analise.item.nome}
                    </TableCell>
                    <TableCell>
                      {analise.item.quantidade_atual} {analise.item.unidade}
                    </TableCell>
                    <TableCell>
                      {analise.consumoTotal.toFixed(2)} {analise.item.unidade}
                    </TableCell>
                    <TableCell>
                      {analise.mediaDiaria.toFixed(2)} {analise.item.unidade}
                    </TableCell>
                    <TableCell>
                      {analise.diasParaZerar === Infinity ? '∞' : `${analise.diasParaZerar} dias`}
                    </TableCell>
                    <TableCell>{analise.comprarEm}</TableCell>
                    <TableCell>{getStatusBadge(analise.status)}</TableCell>
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
