import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Edit2, ChevronLeft, Leaf, Sparkles, Home, MoreVertical, Trash2, PauseCircle, PlayCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
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
          <h2 className="text-xl font-display font-semibold text-sfb-cacau">Catálogo de Produtos</h2>
          <Button 
            onClick={() => handleOpenForm()}
            className="bg-sfb-terracota hover:bg-sfb-terracota/90 text-white gap-2"
          >
            <Plus className="h-4 w-4" /> Novo Produto
          </Button>
        </div>

        <div className="bg-white border-2 border-sfb-areia/60 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-sfb-baunilha/10">
                <TableRow>
                  <TableHead className="w-[100px]">Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Linha</TableHead>
                  <TableHead>Qtd/ml</TableHead>
                  <TableHead>Pontos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
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
                          variant={produto.status === 'Ativo' ? 'default' : 'secondary'}
                          className={produto.status === 'Ativo' ? 'bg-sfb-salvia hover:bg-sfb-salvia/90' : ''}
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

      <button

        onClick={() => navigate("/cadastros/produtos-revenda")}
        className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-sfb-cacau text-sfb-baunilha flex items-center justify-center shadow-lg hover:opacity-90 transition"
        aria-label="Voltar"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    </div>
  );
}
