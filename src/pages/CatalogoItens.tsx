import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, Filter, MoreVertical, Pencil, Trash2, Package } from "lucide-react";
import { useEstoqueIntegrado } from "@/hooks/useEstoqueIntegrado";
import { ModalItem } from "@/components/estoque/ModalItem";
import { EntradaRapida } from "@/components/estoque/EntradaRapida";
import { AlertasEstoque } from "@/components/estoque/AlertasEstoque";
import { AtualizarEstoqueDialog } from "@/components/estoque/AtualizarEstoqueDialog";
import { BadgeStatus } from "@/components/estoque/BadgeStatus";
import type { Item, ItemComEstoque } from "@/types/estoque";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function CatalogoItens() {
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [modalItemAberto, setModalItemAberto] = useState(false);
  const [modalEntradaAberto, setModalEntradaAberto] = useState(false);
  const [modalAtualizarAberto, setModalAtualizarAberto] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<ItemComEstoque | undefined>();

  const { itens, loading, resumo, criarItem, atualizarItem, registrarMovimento, salvarPreco, ativarRastreamento, carregarItens } = useEstoqueIntegrado({
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

  const handleAtualizarEstoque = (item: ItemComEstoque) => {
    setItemSelecionado(item);
    setModalAtualizarAberto(true);
  };

  const handleExcluirItem = async (item: ItemComEstoque) => {
    if (!confirm(`Tem certeza que deseja excluir "${item.nome}"?`)) return;

    try {
      const { error } = await supabase
        .from('itens')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Item excluído",
        description: "O item foi removido com sucesso.",
      });

      await carregarItens();
    } catch (error) {
      toast({
        title: "Erro ao excluir item",
        description: "Ocorreu um erro ao excluir o item.",
        variant: "destructive",
      });
    }
  };

  const handleSalvarItem = async (item: Partial<Item>, extraData?: { marca?: string; quantidadeEntrada?: string; valorEntrada?: string }) => {
    if (itemSelecionado) {
      return await atualizarItem(itemSelecionado.id, item);
    } else {
      const result = await criarItem(item as any);
      
      // Se criou com sucesso e tem dados extras de entrada de estoque
      if (result.success && result.data && extraData) {
        const { marca, quantidadeEntrada, valorEntrada } = extraData;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return result;

        // Criar preço se marca foi informada
        if (marca) {
          const custoUnitario = valorEntrada && quantidadeEntrada 
            ? parseFloat(valorEntrada) / parseFloat(quantidadeEntrada)
            : 0;

          await supabase.from('precos').insert({
            item_id: result.data.id,
            usuario_id: user.id,
            marca: marca,
            preco_total_embalagem: valorEntrada ? parseFloat(valorEntrada) : 0,
            quantidade_embalagem: item.quantidade_por_embalagem || 1,
            custo_unitario: custoUnitario,
            ativo: true,
            data_coleta: new Date().toISOString(),
          });
        }

        // Registrar entrada de estoque se quantidade foi informada
        if (quantidadeEntrada && parseFloat(quantidadeEntrada) > 0) {
          const custoUnitario = valorEntrada && quantidadeEntrada 
            ? parseFloat(valorEntrada) / parseFloat(quantidadeEntrada)
            : 0;

          await supabase.from('movimentacoes_estoque').insert({
            item_id: result.data.id,
            usuario_id: user.id,
            tipo: 'ENTRADA',
            tipo_item: item.tipo === 'ingrediente' ? 'INSUMO' : 'EMBALAGEM',
            quantidade: parseFloat(quantidadeEntrada),
            custo_unitario: custoUnitario,
            custo_total: valorEntrada ? parseFloat(valorEntrada) : 0,
            unidade: item.unidade_base || 'un',
            data: new Date().toISOString(),
          });

          // Recarregar itens para refletir o novo estoque
          await carregarItens();
        }
      }
      
      return result;
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

          {/* Tabela de Itens */}
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.nome}
                        {item.preco_ativo?.marca && <span className="text-muted-foreground text-sm ml-2">({item.preco_ativo.marca})</span>}
                      </TableCell>
                      <TableCell>
                        {item.tipo === 'ingrediente' ? '🧈 Ingrediente' : '📦 Embalagem'}
                      </TableCell>
                      <TableCell>{item.categoria || '-'}</TableCell>
                      <TableCell>
                        {item.rastrear_estoque 
                          ? `${item.estoque?.saldo || 0} ${item.unidade_base}`
                          : 'Não rastreado'
                        }
                      </TableCell>
                      <TableCell>
                        {item.rastrear_estoque && <BadgeStatus status={item.status} />}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditarItem(item)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAtualizarEstoque(item)}>
                              <Package className="mr-2 h-4 w-4" />
                              Atualizar Estoque
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleExcluirItem(item)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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

      <AtualizarEstoqueDialog
        open={modalAtualizarAberto}
        onOpenChange={setModalAtualizarAberto}
        item={itemSelecionado || null}
        onSuccess={() => carregarItens()}
      />
    </div>
  );
}
