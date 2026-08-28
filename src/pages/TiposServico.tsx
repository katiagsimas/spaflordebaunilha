
import { useState } from "react";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Search, Loader2, ListChecks } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCategorias } from "@/hooks/useCategorias";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import { TablePagination } from "@/components/TablePagination";
import { usePaginacao } from "@/hooks/usePaginacao";
import { ordenarAlfabetico } from "@/lib/sortUtils";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Label } from "@/components/ui/label";

import { DualScroll } from "@/components/DualScroll";
export default function TiposServico() {
  const { categorias, isLoading, createCategoria, updateCategoria, deleteCategoria } = useCategorias('servico');
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; nome: string } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const filteredCategories = ordenarAlfabetico(
    categorias.filter((c) => c.nome.toLowerCase().includes(searchTerm.toLowerCase())),
    (c) => c.nome,
  );
  const paginacao = usePaginacao(filteredCategories, 25);

  const handleSave = async () => {
    if (!newCategoryName.trim()) {
      toast.error("O nome é obrigatório");
      return;
    }

    try {
      if (editingCategory) {
        await updateCategoria(editingCategory.id, { nome: newCategoryName });
        toast.success("Tipo de serviço atualizado!");
      } else {
        await createCategoria(newCategoryName);
        toast.success("Tipo de serviço criado!");
      }
      setIsDialogOpen(false);
      setNewCategoryName("");
      setEditingCategory(null);
    } catch (error) {
      console.error(error);
      // O hook já mostra toast de erro
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory({ id: category.id, nome: category.nome });
    setNewCategoryName(category.nome);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategoria(categoryToDelete);
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error(error);
      // O hook já mostra toast de erro
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-sfb-terracota" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <BackButton to="/precificacao/ficha-tecnica" />
        </div>
        
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col items-start">
            <h1 className="font-display text-3xl tracking-tight text-sfb-cacau sm:text-4xl">
              Tipos de Serviço
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <span className="h-px w-12 bg-sfb-terracota" />
              <p className="text-sm font-body italic text-sfb-cacau/70">
                Gerencie as categorias dos seus serviços
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => {
              setEditingCategory(null);
              setNewCategoryName("");
              setIsDialogOpen(true);
            }}
            className="bg-sfb-terracota text-sfb-baunilha hover:bg-sfb-terracota/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Tipo
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sfb-cacau/40" />
          <Input
            placeholder="Buscar tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border-sfb-areia/50 focus-visible:ring-sfb-terracota"
          />
        </div>
      </div>

      {filteredCategories.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Nenhum tipo cadastrado"
          description={searchTerm ? "Nenhum resultado para sua busca" : "Comece criando seu primeiro tipo de serviço"}
          actionLabel={!searchTerm ? "Novo Tipo" : undefined}
          onAction={() => setIsDialogOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-sfb-areia/40 bg-sfb-baunilha/10 shadow-sm">
          <DualScroll>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-sfb-areia/20">
                <TableHead className="text-sfb-cacau/70 font-display">Nome</TableHead>
                <TableHead className="text-sfb-cacau/70 font-display">Status</TableHead>
                <TableHead className="text-sfb-cacau/70 font-display text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginacao.itensPagina.map((category) => (
                <TableRow key={category.id} className="hover:bg-sfb-baunilha/20 border-b border-sfb-areia/10">
                  <TableCell className="font-medium text-sfb-cacau">{category.nome}</TableCell>
                  <TableCell>
                    <Badge variant={category.ativo ? "default" : "secondary"} className={category.ativo ? "bg-sfb-salvia/20 text-sfb-salvia hover:bg-sfb-salvia/30 border-none" : ""}>
                      {category.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-sfb-cacau/60 hover:text-sfb-terracota">
                          <Plus className="h-4 w-4 rotate-45" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-sfb-baunilha border-sfb-areia">
                        <DropdownMenuItem onClick={() => handleEdit(category)} className="cursor-pointer hover:bg-sfb-areia/20">
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setCategoryToDelete(category.id);
                            setDeleteConfirmOpen(true);
                          }}
                          className="cursor-pointer text-red-600 hover:bg-red-50 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </DualScroll>
          <TablePagination
            pagina={paginacao.pagina}
            totalPaginas={paginacao.totalPaginas}
            total={paginacao.total}
            porPagina={paginacao.porPagina}
            onPaginaChange={paginacao.setPagina}
            onPorPaginaChange={paginacao.setPorPagina}
            label="tipos"
          />
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-sfb-baunilha border-sfb-areia sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-display text-sfb-cacau">
              {editingCategory ? "Editar Tipo" : "Novo Tipo de Serviço"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sfb-cacau">Nome do Tipo</Label>
              <Input
                id="name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex: Massagens, Faciais..."
                className="border-sfb-areia focus-visible:ring-sfb-terracota"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-sfb-areia text-sfb-cacau hover:bg-sfb-areia/20">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-sfb-terracota text-sfb-baunilha hover:bg-sfb-terracota/90">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDelete}
        title="Excluir Tipo"
        description="Tem certeza que deseja excluir este tipo de serviço? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
