import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Edit2, ChevronLeft, Leaf, Sparkles, Home, MoreVertical, Trash2, PauseCircle, PlayCircle, Search, Filter } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProdutoRevendaForm } from "@/components/ProdutoRevendaForm";
import { useProdutosRevenda, type ProdutoRevenda } from "@/hooks/useProdutosRevenda";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


export default function MarcaRevendaPage() {
  const navigate = useNavigate();
  const { marca } = useParams<{ marca: 'natura' | 'avon' | 'casa-estilo' }>();
  
  // Normalize marca for DB queries
  const dbMarca = marca === 'casa-estilo' ? 'casa_estilo' : (marca as 'natura' | 'avon');
  
  const { produtos, loading: loadingProdutos, deleteProduto, updateProduto } = useProdutosRevenda(dbMarca);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<ProdutoRevenda | undefined>(undefined);
  const [produtoToDelete, setProdutoToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "Ativo" | "Pausado">("todos");

  const filteredProdutos = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return produtos.filter((produto) => {
      const matchesStatus = statusFilter === "todos" || produto.status === statusFilter;
      if (!term) return matchesStatus;
      const matchesSearch =
        (produto.descricao?.toLowerCase().includes(term)) ||
        (produto.codigo?.toLowerCase().includes(term)) ||
        (produto.linha?.toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [produtos, searchQuery, statusFilter]);


  const getMarcaConfig = (m: string | undefined) => {
    switch(m) {
      case 'natura': 
        return { label: 'Natura', icon: Leaf, desc: 'Gestão de produtos e pedidos Natura' };
      case 'avon': 
        return { label: 'Avon', icon: Sparkles, desc: 'Gestão de produtos e pedidos Avon' };
      case 'casa-estilo': 
        return { label: 'Casa & Estilo', icon: Home, desc: 'Itens de decoração e utilidades domésticas' };
      default: 
        return { label: 'Marca', icon: Home, desc: '' };
    }
  };

  const config = getMarcaConfig(marca);

  const handleOpenForm = (produto?: ProdutoRevenda) => {
    setEditingProduto(produto);
    setIsFormOpen(true);
  };

  const handleToggleStatus = async (produto: ProdutoRevenda) => {
    const newStatus = produto.status === 'Ativo' ? 'Pausado' : 'Ativo';
    await updateProduto(produto.id, { status: newStatus });
  };

  const handleDelete = async () => {
    if (produtoToDelete) {
      await deleteProduto(produtoToDelete);
      setProdutoToDelete(null);
    }
  };

  return (

    <div className="min-h-screen bg-sfb-baunilha pb-24">
      <PageHeader
        title={`Produtos ${config.label}`}
        description={config.desc}
      />

      <div className="container mx-auto px-6 pt-4 space-y-8">
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => navigate("/cadastros/produtos-revenda")}
            className="border-sfb-areia/60 text-sfb-cacau hover:bg-sfb-baunilha gap-2"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Button>
          <Button
            onClick={() => handleOpenForm()}
            className="bg-sfb-terracota hover:bg-sfb-terracota/90 text-white gap-2"
          >
            <Plus className="h-4 w-4" /> Novo Produto
          </Button>
        </div>
        <h2 className="text-xl font-display font-semibold text-sfb-cacau">Catálogo de Produtos</h2>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sfb-cacau/50" />
            <Input
              placeholder="Buscar por nome, código ou linha..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-sfb-areia/60 text-sfb-cacau placeholder:text-sfb-cacau/50"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "todos" | "Ativo" | "Pausado")}>
            <SelectTrigger className="w-full md:w-[160px] bg-white border-sfb-areia/60 text-sfb-cacau gap-2">
              <Filter className="h-4 w-4 text-sfb-terracota" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white border-sfb-areia/60">
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Pausado">Pausado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-white border-2 border-sfb-areia/60 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-sfb-terracota">
                <TableRow className="hover:bg-sfb-terracota border-sfb-terracota">
                  <TableHead className="w-[100px] text-sfb-baunilha">Código</TableHead>
                  <TableHead className="text-sfb-baunilha">Descrição</TableHead>
                  <TableHead className="text-sfb-baunilha">Linha</TableHead>
                  <TableHead className="text-sfb-baunilha">Qtd/ml</TableHead>
                  <TableHead className="text-sfb-baunilha">Pontos</TableHead>
                  <TableHead className="text-sfb-baunilha">Status</TableHead>
                  <TableHead className="text-right text-sfb-baunilha">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {loadingProdutos ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Carregando produtos...
                    </TableCell>
                  </TableRow>
                ) : produtos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum produto cadastrado para esta marca.
                    </TableCell>
                  </TableRow>
                ) : (
                  produtos.map((produto) => (
                    <TableRow key={produto.id}>
                      <TableCell className="font-mono text-sm">{produto.codigo || '-'}</TableCell>
                      <TableCell className="font-medium">{produto.descricao}</TableCell>
                      <TableCell>{produto.linha || '-'}</TableCell>
                      <TableCell>{produto.quantidade_ml || '-'}</TableCell>
                      <TableCell>{produto.quantidade_pontos || 0}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            produto.status === 'Ativo'
                              ? 'bg-sfb-terracota hover:bg-sfb-terracota/90 text-sfb-baunilha'
                              : 'bg-sfb-terracota/60 hover:bg-sfb-terracota/70 text-sfb-baunilha'
                          }
                        >
                          {produto.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 bg-white border-2 border-sfb-areia/60">
                            <DropdownMenuItem 
                              onClick={() => handleOpenForm(produto)}
                              className="gap-2 cursor-pointer hover:bg-sfb-baunilha text-sfb-cacau"
                            >
                              <Edit2 className="h-4 w-4 text-sfb-terracota" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(produto)}
                              className="gap-2 cursor-pointer hover:bg-sfb-baunilha text-sfb-cacau"
                            >
                              {produto.status === 'Ativo' ? (
                                <>
                                  <PauseCircle className="h-4 w-4 text-orange-500" />
                                  Pausar
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="h-4 w-4 text-sfb-salvia" />
                                  Ativar
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setProdutoToDelete(produto.id)}
                              className="gap-2 cursor-pointer hover:bg-red-50 text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>

                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingProduto ? 'Editar Produto' : 'Novo Produto'} - {config.label}
            </DialogTitle>
          </DialogHeader>
          <ProdutoRevendaForm 
            marca={dbMarca}
            produto={editingProduto}
            onSuccess={() => {
              setIsFormOpen(false);
              setEditingProduto(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!produtoToDelete} onOpenChange={(open) => !open && setProdutoToDelete(null)}>
        <AlertDialogContent className="bg-white border-2 border-sfb-areia/60">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sfb-cacau font-display">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-sfb-areia/60 text-sfb-cacau hover:bg-sfb-baunilha">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
