import { useState } from "react";
import { FolderTree, Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CategoriaPlano {
  id: string;
  codigo: string;
  descricao: string;
  indicador: "receita" | "despesa" | "ativo" | "passivo";
  faixaDRE: string;
}

const categoriasIniciais: CategoriaPlano[] = [
  { id: "1", codigo: "1", descricao: "Receitas Operacionais", indicador: "receita", faixaDRE: "Receita Bruta" },
  { id: "2", codigo: "2", descricao: "Deduções da Receita", indicador: "despesa", faixaDRE: "Deduções" },
  { id: "3", codigo: "3", descricao: "Custos Diretos", indicador: "despesa", faixaDRE: "CMV/CPV" },
  { id: "4", codigo: "4", descricao: "Despesas Operacionais", indicador: "despesa", faixaDRE: "Despesas Operacionais" },
  { id: "5", codigo: "5", descricao: "Despesas Administrativas", indicador: "despesa", faixaDRE: "Despesas Administrativas" },
  { id: "6", codigo: "6", descricao: "Despesas Comerciais", indicador: "despesa", faixaDRE: "Despesas Comerciais" },
  { id: "7", codigo: "7", descricao: "Receitas Financeiras", indicador: "receita", faixaDRE: "Resultado Financeiro" },
  { id: "8", codigo: "8", descricao: "Despesas Financeiras", indicador: "despesa", faixaDRE: "Resultado Financeiro" },
];

export default function CategoriasPlanoContas() {
  const [categorias, setCategorias] = useLocalStorage<CategoriaPlano[]>("sugarbox_categorias_plano", categoriasIniciais);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaPlano | null>(null);
  const [categoriaToDelete, setCategoriaToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    codigo: "",
    descricao: "",
    indicador: "receita" as "receita" | "despesa" | "ativo" | "passivo",
    faixaDRE: "",
  });

  const resetForm = () => {
    setFormData({ codigo: "", descricao: "", indicador: "receita", faixaDRE: "" });
    setEditingCategoria(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategoria) {
      setCategorias(categorias.map(c => 
        c.id === editingCategoria.id 
          ? { ...editingCategoria, ...formData }
          : c
      ));
      toast.success("Categoria atualizada com sucesso!");
    } else {
      const novaCategoria: CategoriaPlano = {
        id: Date.now().toString(),
        ...formData,
      };
      setCategorias([...categorias, novaCategoria]);
      toast.success("Categoria criada com sucesso!");
    }
    
    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (categoria: CategoriaPlano) => {
    setEditingCategoria(categoria);
    setFormData({
      codigo: categoria.codigo,
      descricao: categoria.descricao,
      indicador: categoria.indicador,
      faixaDRE: categoria.faixaDRE,
    });
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (categoriaToDelete) {
      setCategorias(categorias.filter(c => c.id !== categoriaToDelete));
      toast.success("Categoria excluída com sucesso!");
      setDeleteDialogOpen(false);
      setCategoriaToDelete(null);
    }
  };

  const getIndicadorLabel = (indicador: string) => {
    const labels = {
      receita: "Receita",
      despesa: "Despesa",
      ativo: "Ativo",
      passivo: "Passivo",
    };
    return labels[indicador as keyof typeof labels] || indicador;
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Categorias Planos de Contas"
        description="Gerencie as categorias para organizar seu plano de contas"
        actions={
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategoria ? "Editar Categoria" : "Nova Categoria"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição da Categoria</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="indicador">Indicador</Label>
                  <Select
                    value={formData.indicador}
                    onValueChange={(value: "receita" | "despesa" | "ativo" | "passivo") => 
                      setFormData({ ...formData, indicador: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="passivo">Passivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faixaDRE">Faixa no DRE</Label>
                  <Input
                    id="faixaDRE"
                    value={formData.faixaDRE}
                    onChange={(e) => setFormData({ ...formData, faixaDRE: e.target.value })}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {categorias.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="Nenhuma categoria cadastrada"
          description="Comece criando sua primeira categoria de plano de contas"
          actionLabel="Nova Categoria"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="bg-card rounded-xl border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Indicador</TableHead>
                <TableHead>Faixa no DRE</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorias.map((categoria) => (
                <TableRow key={categoria.id}>
                  <TableCell className="font-medium">{categoria.codigo}</TableCell>
                  <TableCell>{categoria.descricao}</TableCell>
                  <TableCell>{getIndicadorLabel(categoria.indicador)}</TableCell>
                  <TableCell>{categoria.faixaDRE}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(categoria)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCategoriaToDelete(categoria.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Excluir Categoria"
        description="Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
