import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Package } from "lucide-react";
import { useProducao } from "@/hooks/useProducao";
import { useIngredientesDia } from "@/hooks/useIngredientesDia";
import { ResumoProducao } from "@/components/producao/ResumoProducao";
import { CardTarefaProducao } from "@/components/producao/CardTarefaProducao";

export default function Producao() {
  const { tarefasPorCategoria, stats, isLoading, gerarTarefas, marcarProduzido, isGerando, isMarcando } = useProducao();
  const { data: ingredientes = [], isLoading: isLoadingIngredientes } = useIngredientesDia();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const ingredientesFaltando = ingredientes.filter(i => !i.tem_suficiente);

  return (
    <div className="space-y-6">
      <PageHeader title="Produção" breadcrumbs={[{ label: "Produção", href: "/producao" }]}>
        <Button onClick={() => gerarTarefas(3)} disabled={isGerando}>
          {isGerando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Gerar Tarefas
        </Button>
      </PageHeader>

      <ResumoProducao totalPedidos={stats.total} totalItens={stats.totalItens} tempoTotal={stats.tempoTotal} />

      <Tabs defaultValue="hoje">
        <TabsList>
          <TabsTrigger value="hoje">Hoje {(tarefasPorCategoria.urgente.length + tarefasPorCategoria.hoje.length) > 0 && <Badge variant="secondary" className="ml-2">{tarefasPorCategoria.urgente.length + tarefasPorCategoria.hoje.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="amanha">Amanhã {tarefasPorCategoria.amanha.length > 0 && <Badge variant="secondary" className="ml-2">{tarefasPorCategoria.amanha.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="proximos">Próximos Dias {tarefasPorCategoria.futuro.length > 0 && <Badge variant="secondary" className="ml-2">{tarefasPorCategoria.futuro.length}</Badge>}</TabsTrigger>
        </TabsList>

        <TabsContent value="hoje" className="space-y-4">
          {tarefasPorCategoria.urgente.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2"><AlertTriangle className="h-5 w-5" />🔴 URGENTE</h3>
              {tarefasPorCategoria.urgente.map(t => <CardTarefaProducao key={t.id} tarefa={t} onMarcarProduzido={id => marcarProduzido({ tarefaId: id })} isLoading={isMarcando} />)}
            </div>
          )}
          {tarefasPorCategoria.hoje.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Package className="h-5 w-5" />📋 HOJE</h3>
              {tarefasPorCategoria.hoje.map(t => <CardTarefaProducao key={t.id} tarefa={t} onMarcarProduzido={id => marcarProduzido({ tarefaId: id })} isLoading={isMarcando} />)}
            </div>
          )}
          {tarefasPorCategoria.urgente.length === 0 && tarefasPorCategoria.hoje.length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma tarefa para hoje</CardContent></Card>}
        </TabsContent>

        <TabsContent value="amanha">
          {tarefasPorCategoria.amanha.length > 0 ? tarefasPorCategoria.amanha.map(t => <CardTarefaProducao key={t.id} tarefa={t} onMarcarProduzido={id => marcarProduzido({ tarefaId: id })} isLoading={isMarcando} />) : <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma tarefa para amanhã</CardContent></Card>}
        </TabsContent>

        <TabsContent value="proximos">
          {tarefasPorCategoria.futuro.length > 0 ? tarefasPorCategoria.futuro.map(t => <CardTarefaProducao key={t.id} tarefa={t} onMarcarProduzido={id => marcarProduzido({ tarefaId: id })} isLoading={isMarcando} />) : <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma tarefa futura</CardContent></Card>}
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader><CardTitle>Ingredientes Necessários Hoje</CardTitle></CardHeader>
        <CardContent>
          {isLoadingIngredientes ? <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : ingredientes.length === 0 ? <p className="text-center text-muted-foreground py-4">✅ Todos ingredientes disponíveis!</p> : (
            <div className="space-y-2">
              {ingredientes.map(i => (
                <div key={i.ingrediente_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{i.ingrediente_nome}</p>
                    <p className="text-sm text-muted-foreground">Necessário: {i.quantidade_total.toFixed(2)} {i.unidade} | Disponível: {i.estoque_disponivel.toFixed(2)} {i.unidade}</p>
                  </div>
                  {!i.tem_suficiente && <Badge variant="destructive">Falta: {i.faltam.toFixed(2)} {i.unidade}</Badge>}
                </div>
              ))}
              {ingredientesFaltando.length > 0 && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{ingredientesFaltando.length} ingrediente(s) com estoque insuficiente</AlertDescription></Alert>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
