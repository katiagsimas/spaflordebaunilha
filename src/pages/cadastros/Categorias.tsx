import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { useCategorias } from "@/hooks/useCategorias";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

const categoriasIniciais = [
  "Bolo Caseiro",
  "Bolo Decorado",
  "Doces",
  "Salgados",
  "Fatias",
];

export default function Categorias() {
  const navigate = useNavigate();
  
  const { categorias, loading, createCategoria, updateCategoria, deleteCategoria } = useCategorias();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
  });

  // Garantir que as categorias iniciais sejam carregadas se estiver vazio
  useEffect(() => {
    const initializeCategorias = async () => {
      if (!loading && categorias.length === 0) {
        for (const nome of categoriasIniciais) {
          try {
            await createCategoria({ nome });
          } catch (error) {
            console.error('Erro ao criar categoria inicial:', error);
          }
        }
      }
    };
    
    initializeCategorias();
  }, [loading, categorias.length]);

  useEffect(() => {
    if (editingCategoria) {
      setFormData(editingCategoria);
      setIsDialogOpen(true);
    }
  }, [editingCategoria]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      toast.error("Por favor, informe o nome da categoria");
      return;
    }

    try {
      if (editingCategoria) {
        await updateCategoria(editingCategoria.id, { nome: formData.nome });
      } else {
        await createCategoria({ nome: formData.nome });
      }
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar categoria");
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
    });
    setEditingCategoria(null);
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategoria(id);
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir categoria");
    }
  };

  const handleEdit = (categoria: any) => {
    setEditingCategoria(categoria);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias de Receitas"
        description="Gerencie as categorias de receitas"
        backButton={<BackButton to="/configuracoes/cadastros-base" />}
      />

      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingCategoria(null); resetForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategoria ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome da Categoria *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Bolos, Doces, Salgados, Combos"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCategoria ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {categorias.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Nenhuma categoria cadastrada"
          description="Comece criando sua primeira categoria"
          actionLabel="Nova Categoria"
          onAction={() => setIsDialogOpen(true)}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Categorias Cadastradas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorias.map((categoria) => (
                  <TableRow key={categoria.id}>
                    <TableCell className="font-medium">{categoria.nome}</TableCell>
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
                          onClick={() => setDeleteId(categoria.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Excluir categoria"
        description="Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
      />
    </div>
  );
}
