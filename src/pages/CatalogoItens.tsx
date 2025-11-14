import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Filter } from "lucide-react";
import { useEstoqueIntegrado } from "@/hooks/useEstoqueIntegrado";
import { ModalItem } from "@/components/estoque/ModalItem";
import { EntradaRapida } from "@/components/estoque/EntradaRapida";
import { AlertasEstoque } from "@/components/estoque/AlertasEstoque";
import { CardItem } from "@/components/estoque/CardItem";
import type { Item, ItemComEstoque } from "@/types/estoque";

export default function CatalogoItens() {
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [modalItemAberto, setModalItemAberto] = useState(false);
  const [modalEntradaAberto, setModalEntradaAberto] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<ItemComEstoque | undefined>();

  const { itens, loading, resumo, criarItem, atualizarItem, registrarMovimento, salvarPreco, ativarRastreamento } = useEstoqueIntegrado({
    busca: busca || undefined,
    tipo: filtroTipo === "todos" ? undefined : filtroTipo as any
  });

  // Contar alertas
  const alertas = {
    zerado: itens.filter(i => i.status === 'zerado').length,
    baixo: itens.filter(i => i.status === 'baixo').length,
    atencao: itens.filter(i => i.status === 'atencao').length,
    semRastreio: itens.filter(i => !i.rastrear_estoque).length
  };

  const handleNovoItem = () => {
    setItemSelecionado(undefined);
    setModalItemAberto(true);
  };

  const handleEditarItem = (item: ItemComEstoque) => {
    setItemSelecionado(item);
    setModalItemAberto(true);
  };

  const handleEntradaRapida = (item: ItemComEstoque) => {
    setItemSelecionado(item);
    setModalEntradaAberto(true);
  };

  const handleAtivarRastreio = async (item: ItemComEstoque) => {
    const pontoMinimo = prompt('Digite o ponto de pedido mínimo:', '10');
    if (pontoMinimo && !isNaN(Number(pontoMinimo))) {
      await ativarRastreamento(item.id, Number(pontoMinimo));
    }
  };

  const handleSalvarItem = async (item: Partial<Item>) => {
    if (itemSelecionado) {
      return await atualizarItem(itemSelecionado.id, item);
    } else {
      return await criarItem(item as any);
    }
  };

  const handleSalvarEntrada = async (data: any) => {
    if (!itemSelecionado) return { success: false };

    // Registrar movimento
    const resultMovimento = await registrarMovimento(data.movimento);
    if (!resultMovimento.success) return { success: false };

    // Atualizar preço se solicitado
    if (data.preco) {
      await salvarPreco({
        ...data.preco,
        item_id: itemSelecionado.id
      });
    }

    return { success: true };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="🏪 Catálogo de Itens"
        description="Gerencie ingredientes e embalagens"
      />

      {/* Alertas */}
      <AlertasEstoque alertas={alertas} />

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Itens Cadastrados</CardTitle>
              <CardDescription>
                {resumo?.total_itens || 0} itens • {resumo?.itens_rastreados || 0} com rastreamento
              </CardDescription>
            </div>
            <Button onClick={handleNovoItem}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controles de Filtro */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar item..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={filtroTipo}
              onValueChange={setFiltroTipo}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="ingrediente">🧈 Ingredientes</SelectItem>
                <SelectItem value="embalagem">📦 Embalagens</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grid de Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : itens.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">Nenhum item encontrado</p>
              <p className="text-sm mt-1">
                Clique em "Adicionar Item" para começar
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {itens.map((item) => (
                <CardItem
                  key={item.id}
                  item={item}
                  onEntrada={handleEntradaRapida}
                  onEditar={handleEditarItem}
                  onAtivarRastreio={handleAtivarRastreio}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ModalItem
        open={modalItemAberto}
        onOpenChange={setModalItemAberto}
        item={itemSelecionado as any}
        onSave={handleSalvarItem}
      />

      {itemSelecionado && (
        <EntradaRapida
          item={itemSelecionado}
          open={modalEntradaAberto}
          onOpenChange={setModalEntradaAberto}
          onSave={handleSalvarEntrada}
        />
      )}
    </div>
  );
}
