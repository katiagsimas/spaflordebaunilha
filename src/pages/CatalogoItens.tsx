import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Filter, Package, MoreVertical, Pencil, Trash2, X, FileDown, Check, ChevronsUpDown } from "lucide-react";
import * as XLSX from 'xlsx';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEstoqueIntegrado } from "@/hooks/useEstoqueIntegrado";
import { ModalItem } from "@/components/estoque/ModalItem";
import { EntradaRapida } from "@/components/estoque/EntradaRapida";
import { ModalMovimentacao } from "@/components/estoque/ModalMovimentacao";
import { DialogExcluirItem } from "@/components/estoque/DialogExcluirItem";
import { AlertasEstoque } from "@/components/estoque/AlertasEstoque";
import { BadgeStatus } from "@/components/estoque/BadgeStatus";
import { Badge } from "@/components/ui/badge";
import { formatarMilhar } from "@/lib/utils";
import type { Item, ItemComEstoque, StatusEstoque } from "@/types/estoque";
import { ResumoEstoqueMensal } from "@/components/estoque/ResumoEstoqueMensal";
import { useCategoriasEstoque } from "@/hooks/useCategoriasEstoque";

export default function CatalogoItens() {
  const [busca, setBusca] = useState("");
  const [openCombobox, setOpenCombobox] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [itensPorPagina, setItensPorPagina] = useState<number>(10);
  const [modalItemAberto, setModalItemAberto] = useState(false);
  const [modalEntradaAberto, setModalEntradaAberto] = useState(false);
  const [modalMovimentacaoAberto, setModalMovimentacaoAberto] = useState(false);
  const [dialogExcluirAberto, setDialogExcluirAberto] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<ItemComEstoque | undefined>();

  const { categorias } = useCategoriasEstoque();

  const { itens, loading, resumo, criarItem, atualizarItem, registrarMovimento, salvarPreco, ativarRastreamento, carregarItens } = useEstoqueIntegrado({
    busca: busca || undefined,
    tipo: filtroTipo === "todos" ? undefined : filtroTipo as any,
    categoria: filtroCategoria === "todos" ? undefined : filtroCategoria,
    status: filtroStatus === "todos" ? undefined : filtroStatus as StatusEstoque
  });

  // Contar alertas
  const alertas = {
    zerado: itens.filter(i => i.status === 'zerado').length,
    baixo: itens.filter(i => i.status === 'baixo').length,
    atencao: itens.filter(i => i.status === 'atencao').length,
    semRastreio: itens.filter(i => !i.rastrear_estoque).length
  };

  // Paginação
  const itensPaginados = useMemo(() => {
    if (itensPorPagina === 0) return itens; // "Todos"
    return itens.slice(0, itensPorPagina);
  }, [itens, itensPorPagina]);

  const limparFiltros = () => {
    setBusca("");
    setFiltroTipo("todos");
    setFiltroCategoria("todos");
    setFiltroStatus("todos");
    setOpenCombobox(false);
  };

  const exportarParaExcel = () => {
    const dadosExportacao = itens.map(item => ({
      'Nome': item.nome,
      'Tipo': item.tipo === 'ingrediente' ? 'Ingrediente' : 'Embalagem',
      'Categoria': item.categoria || '-',
      'Status': item.status === 'ok' ? 'OK' : 
                item.status === 'atencao' ? 'Atenção' :
                item.status === 'baixo' ? 'Baixo' :
                item.status === 'zerado' ? 'Zerado' : 'Sem Rastreio',
      'Estoque Atual': item.rastrear_estoque && item.estoque ? `${item.estoque.saldo} ${item.unidade_base}` : '-',
      'Custo Unitário': item.rastrear_estoque && item.estoque?.custo_medio 
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.estoque.custo_medio)
        : '-',
      'Valor Total': item.rastrear_estoque && item.estoque?.valor_estoque
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.estoque.valor_estoque)
        : '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dadosExportacao);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estoque');
    
    const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    XLSX.writeFile(workbook, `estoque_${dataAtual}.xlsx`);
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
        title="Controle de Estoque"
        description="Gerencie ingredientes e embalagens"
      />

      {/* Alertas */}
      <AlertasEstoque alertas={alertas} />

      {/* Resumo Mensal */}
      <ResumoEstoqueMensal />

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
            <div className="flex gap-2">
              <Button 
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setModalMovimentacaoAberto(true)}
              >
                <Package className="mr-2 h-4 w-4" />
                Movimentação de Estoque
              </Button>
              <Button onClick={handleNovoItem}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Item
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Área de Filtros */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-4 w-4" />
              <span className="font-semibold">Filtros</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Busca por Nome */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Busca</Label>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCombobox}
                      className="w-full justify-between text-left font-normal"
                      onMouseEnter={() => setOpenCombobox(true)}
                      onMouseLeave={(e) => {
                        // Só fecha se não estiver indo para o popover
                        const relatedTarget = e.relatedTarget as HTMLElement;
                        if (!relatedTarget?.closest('[role="dialog"]')) {
                          setTimeout(() => setOpenCombobox(false), 200);
                        }
                      }}
                    >
                      {busca ? (
                        <span className="truncate">{busca}</span>
                      ) : (
                        <span className="text-muted-foreground">por nome</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-[300px] p-0" 
                    align="start"
                    onMouseLeave={() => {
                      // Fecha quando sair do popover se não estiver digitando
                      const input = document.querySelector('[cmdk-input]') as HTMLInputElement;
                      if (document.activeElement !== input) {
                        setTimeout(() => setOpenCombobox(false), 200);
                      }
                    }}
                  >
                    <Command>
                      <CommandInput 
                        placeholder="Digite para buscar..." 
                        value={busca}
                        onValueChange={setBusca}
                      />
                      <CommandList>
                        <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                        <CommandGroup>
                          {itens.map((item) => (
                            <CommandItem
                              key={item.id}
                              value={item.nome}
                              onSelect={(currentValue) => {
                                setBusca(currentValue === busca ? "" : currentValue);
                                setOpenCombobox(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  busca === item.nome ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex-1">
                                <div className="font-medium">{item.nome}</div>
                                <div className="text-xs text-muted-foreground">
                                  {item.tipo === 'ingrediente' ? '🧈 Ingrediente' : '📦 Embalagem'}
                                  {item.categoria && ` • ${item.categoria}`}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Tipo */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo</Label>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="ingrediente">🧈 Ingredientes</SelectItem>
                    <SelectItem value="embalagem">📦 Embalagens</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Categoria</Label>
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    {categorias.map(cat => (
                      <SelectItem key={cat.id} value={cat.nome}>
                        {cat.icone} {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="ok">✅ OK</SelectItem>
                    <SelectItem value="atencao">⚠️ Atenção</SelectItem>
                    <SelectItem value="baixo">🔻 Baixo</SelectItem>
                    <SelectItem value="zerado">❌ Zerado</SelectItem>
                    <SelectItem value="sem_rastreio">➖ Sem Rastreio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ações */}
              <div className="space-y-2">
                <Label className="text-sm font-medium opacity-0">Ações</Label>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={limparFiltros}
                    className="flex-1"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Limpar
                  </Button>
                </div>
              </div>
            </div>

          </div>

          {/* Seletor de itens por página */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Mostrar:</span>
              <Select
                value={itensPorPagina.toString()}
                onValueChange={(value) => setItensPorPagina(value === "0" ? 0 : parseInt(value))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="0">Todos</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                {itensPorPagina === 0 ? `Exibindo ${itens.length}` : `Exibindo ${Math.min(itensPorPagina, itens.length)}`} de {itens.length} itens
              </span>
            </div>
            <Button
              variant="outline"
              onClick={exportarParaExcel}
              size="sm"
              className="min-w-[180px]"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Exportar para Excel
            </Button>
          </div>

          {/* Tabela de Itens */}
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Estoque Atual</TableHead>
                  <TableHead className="text-right">Custo/Un</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itensPaginados.map((item) => {
                  const formatarValor = (valor?: number) => {
                    if (!valor) return '-';
                    return new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(valor);
                  };

                  const formatarQuantidade = (qtd?: number, unidade?: string) => {
                    if (qtd === undefined) return '-';
                    return `${formatarMilhar(qtd)} ${unidade || ''}`;
                  };

                  // Calcular custo unitário usando o custo médio da view
                  const calcularCustoUnitario = () => {
                    if (!item.rastrear_estoque || !item.estoque) return '-';
                    const custoMedio = item.estoque.custo_medio || 0;
                    if (custoMedio === 0) return '-';
                    return `${formatarValor(custoMedio)}/${item.unidade_base}`;
                  };

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.nome}</div>
                      </TableCell>
                      <TableCell>
                        {item.tipo === 'ingrediente' ? '🧈 Ingrediente' : '📦 Embalagem'}
                      </TableCell>
                      <TableCell>
                        {item.rastrear_estoque ? (
                          <BadgeStatus status={item.status || 'sem_rastreio'} />
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.rastrear_estoque && item.estoque
                          ? formatarQuantidade(item.estoque.saldo, item.unidade_base)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {calcularCustoUnitario()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400">
                        {item.rastrear_estoque && item.estoque
                          ? formatarValor(item.estoque.valor_estoque)
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditarItem(item)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Alterar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setItemSelecionado(item);
                                  setDialogExcluirAberto(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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

      <ModalMovimentacao
        aberto={modalMovimentacaoAberto}
        onFechar={() => setModalMovimentacaoAberto(false)}
        onSucesso={carregarItens}
      />

      {itemSelecionado && (
        <DialogExcluirItem
          item={itemSelecionado}
          aberto={dialogExcluirAberto}
          onFechar={() => {
            setDialogExcluirAberto(false);
            setItemSelecionado(undefined);
          }}
          onExcluir={() => {
            setDialogExcluirAberto(false);
            setItemSelecionado(undefined);
            carregarItens();
          }}
        />
      )}
    </div>
  );
}
