import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, MoreVertical, Pencil, Trash2, Package, X, Calendar, AlertTriangle } from "lucide-react";
import { useEstoqueSimplificado } from "@/hooks/useEstoqueSimplificado";
import { ModalItem } from "@/components/estoque/ModalItem";
import { EntradaRapida } from "@/components/estoque/EntradaRapida";
import { AlertasEstoque } from "@/components/estoque/AlertasEstoque";
import { AtualizarEstoqueDialog } from "@/components/estoque/AtualizarEstoqueDialog";
import { BadgeStatus } from "@/components/estoque/BadgeStatus";
import type { Item, ItemComEstoque } from "@/types/estoque";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parseISO } from "date-fns";

type AlertaType = 'vencido' | 'critico' | 'vencendo' | null;
type StatusType = 'zerado' | 'baixo' | 'ok' | null;

interface ItemComValidade extends ItemComEstoque {
  dataValidade?: string | null;
  alerta?: AlertaType;
}

export default function CatalogoItens() {
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroAlerta, setFiltroAlerta] = useState<string>("todos");
  const [modalItemAberto, setModalItemAberto] = useState(false);
  const [modalEntradaAberto, setModalEntradaAberto] = useState(false);
  const [modalAtualizarAberto, setModalAtualizarAberto] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<ItemComEstoque | undefined>();
  const [itensComValidade, setItensComValidade] = useState<ItemComValidade[]>([]);

  const { itens, loading, criarItem, atualizarItem, carregarItens, registrarMovimentacao, salvarPreco, ativarRastreamento } = useEstoqueSimplificado({
    busca: busca || undefined,
    tipo: filtroTipo === "todos" ? undefined : filtroTipo as any
  });

  // Calcular resumo simples dos itens
  const resumo = {
    total_itens: itens.length,
    itens_rastreados: itens.filter(i => i.rastrear_estoque).length
  };

  // Buscar validades dos itens
  useEffect(() => {
    const carregarValidades = async () => {
      if (!itens.length) {
        setItensComValidade([]);
        return;
      }

      try {
        const { data: movimentacoes } = await supabase
          .from('movimentacoes_estoque')
          .select('item_id, validade')
          .in('item_id', itens.map(i => i.id))
          .not('validade', 'is', null)
          .order('validade', { ascending: true });

        const validadesPorItem = new Map<string, string>();
        movimentacoes?.forEach(mov => {
          if (mov.validade && !validadesPorItem.has(mov.item_id)) {
            validadesPorItem.set(mov.item_id, mov.validade);
          }
        });

        const itensAtualizados = itens.map(item => {
          const dataValidade = validadesPorItem.get(item.id);
          let alerta: AlertaType = null;

          if (dataValidade) {
            const diasAteVencer = differenceInDays(parseISO(dataValidade), new Date());
            if (diasAteVencer < 0) {
              alerta = 'vencido';
            } else if (diasAteVencer <= 4) {
              alerta = 'critico';
            } else if (diasAteVencer <= 30) {
              alerta = 'vencendo';
            }
          }

          return {
            ...item,
            dataValidade,
            alerta
          };
        });

        setItensComValidade(itensAtualizados);
      } catch (error) {
        console.error('Erro ao carregar validades:', error);
        setItensComValidade(itens);
      }
    };

    carregarValidades();
  }, [itens]);

  // Recarregar itens quando estoque for atualizado
  useEffect(() => {
    const handleEstoqueAtualizado = () => {
      carregarItens();
    };
    
    window.addEventListener('estoque-atualizado', handleEstoqueAtualizado);
    return () => window.removeEventListener('estoque-atualizado', handleEstoqueAtualizado);
  }, [carregarItens]);

  // Filtrar itens
  const itensFiltrados = itensComValidade.filter(item => {
    if (filtroCategoria !== "todas" && item.categoria !== filtroCategoria) return false;
    if (filtroStatus !== "todos" && item.status !== filtroStatus) return false;
    if (filtroAlerta !== "todos" && item.alerta !== filtroAlerta) return false;
    return true;
  });

  // Contar alertas
  const alertas = {
    zerado: itensComValidade.filter(i => i.status === 'zerado').length,
    baixo: itensComValidade.filter(i => i.status === 'baixo').length,
    atencao: itensComValidade.filter(i => i.status === 'atencao').length,
    semRastreio: itensComValidade.filter(i => !i.rastrear_estoque).length,
    vencido: itensComValidade.filter(i => i.alerta === 'vencido').length,
    critico: itensComValidade.filter(i => i.alerta === 'critico').length,
    vencendo: itensComValidade.filter(i => i.alerta === 'vencendo').length
  };

  // Obter categorias únicas
  const categorias = Array.from(new Set(itensComValidade.map(i => i.categoria).filter(Boolean)));

  const limparFiltros = () => {
    setBusca("");
    setFiltroTipo("todos");
    setFiltroCategoria("todas");
    setFiltroStatus("todos");
    setFiltroAlerta("todos");
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
    const resultMovimento = await registrarMovimentacao(data.movimento);
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
          <div>
            <CardTitle>Itens Cadastrados</CardTitle>
            <CardDescription>
              {resumo?.total_itens || 0} itens • {resumo?.itens_rastreados || 0} com rastreamento
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Botão Adicionar Item */}
          <div>
            <Button onClick={handleNovoItem}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Item
            </Button>
          </div>

          {/* Controles de Filtro */}
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Buscar Item</label>
              <div className="w-[250px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar item..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Tipo</label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ingrediente">Ingrediente</SelectItem>
                  <SelectItem value="embalagem">Embalagem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Categoria</label>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {categorias.map(cat => (
                    <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Status</label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ok">OK</SelectItem>
                  <SelectItem value="atencao">Atenção</SelectItem>
                  <SelectItem value="baixo">Baixo</SelectItem>
                  <SelectItem value="zerado">Zerado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Alertas</label>
              <Select value={filtroAlerta} onValueChange={setFiltroAlerta}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Alertas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="critico">Crítico</SelectItem>
                  <SelectItem value="vencendo">Vencendo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={limparFiltros}
              >
                <X className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>
            </div>
          </div>

          {/* Tabela de Itens */}
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : itensFiltrados.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">Nenhum item encontrado</p>
              <p className="text-sm mt-1">
                {busca || filtroTipo !== "todos" || filtroCategoria !== "todas" || filtroStatus !== "todos" || filtroAlerta !== "todos"
                  ? "Tente ajustar os filtros"
                  : "Clique em 'Adicionar Item' para começar"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria de Estoque</TableHead>
                    <TableHead>Estoque Mín.</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Qtde/Emb.</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Estoque Atual</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Alerta</TableHead>
                    <TableHead>Valor Unit.</TableHead>
                    <TableHead>Valor Estoque</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itensFiltrados.map((item) => {
                    const valorUnitario = item.preco_ativo?.custo_unitario || 0;
                    const valorEstoque = item.estoque?.valor_estoque || 0;
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.nome}
                        </TableCell>
                        <TableCell className="capitalize">
                          {item.tipo === 'ingrediente' ? 'Ingrediente' : 'Embalagem'}
                        </TableCell>
                        <TableCell>{item.categoria || '-'}</TableCell>
                        <TableCell>
                          {item.ponto_de_pedido || '-'}
                        </TableCell>
                        <TableCell>{item.preco_ativo?.marca || '-'}</TableCell>
                        <TableCell>
                          {item.dataValidade 
                            ? new Date(item.dataValidade).toLocaleDateString('pt-BR')
                            : '-'
                          }
                        </TableCell>
                        <TableCell>{item.quantidade_por_embalagem}</TableCell>
                        <TableCell>{item.unidade_base}</TableCell>
                        <TableCell>
                          {item.rastrear_estoque 
                            ? `${item.estoque?.saldo || 0}`
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {item.rastrear_estoque && item.status ? (
                            <BadgeStatus status={item.status} />
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.alerta ? (
                            <Badge 
                              variant="outline" 
                              className={
                                item.alerta === 'vencido' 
                                  ? "bg-destructive/10 text-destructive border-destructive/20"
                                  : item.alerta === 'critico'
                                  ? "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20"
                                  : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                              }
                            >
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              {item.alerta === 'vencido' ? 'Vencido' : item.alerta === 'critico' ? 'Crítico' : 'Vencendo'}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {valorUnitario > 0 
                            ? `R$ ${valorUnitario.toFixed(2)}`
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {valorEstoque > 0 
                            ? `R$ ${valorEstoque.toFixed(2)}`
                            : '-'
                          }
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
                    );
                  })}
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
