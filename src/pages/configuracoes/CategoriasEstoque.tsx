import { useState, useEffect } from "react";
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
import { useCategoriasEstoque, CategoriaEstoque } from "@/hooks/useCategoriasEstoque";
import { Plus, Pencil, Trash2, Package, Power, PowerOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function CategoriasEstoque() {
  const { categorias, loading, createCategoria, updateCategoria, deleteCategoria, toggleAtivo } = useCategoriasEstoque();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaEstoque | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    icone: "",
    cor: "#D4A574",
    ativo: true,
  });

  useEffect(() => {
    if (editingCategoria) {
      setFormData({
        nome: editingCategoria.nome,
        icone: editingCategoria.icone || "",
        cor: editingCategoria.cor || "#D4A574",
        ativo: editingCategoria.ativo,
      });
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
        await updateCategoria(editingCategoria.id, formData);
      } else {
        await createCategoria(formData);
      }
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar categoria");
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      icone: "",
      cor: "#D4A574",
      ativo: true,
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

  const handleEdit = (categoria: CategoriaEstoque) => {
    setEditingCategoria(categoria);
  };

  const handleToggleAtivo = async (id: string, ativo: boolean) => {
    try {
      await toggleAtivo(id, !ativo);
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar status");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias de Estoque"
        description="Gerencie as categorias para organizar seus insumos"
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
                  placeholder="Ex: Secos/Farináceos"
                  required
                />
              </div>

              <div>
                <Label htmlFor="cor">Cor</Label>
                <div className="flex gap-2">
                  <Input
                    id="cor"
                    type="color"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    placeholder="#D4A574"
                    className="flex-1"
                  />
                </div>
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

      {categorias.length === 0 && !loading ? (
        <EmptyState
          icon={Package}
          title="Nenhuma categoria cadastrada"
          description="Comece criando sua primeira categoria de estoque"
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
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorias.map((categoria) => (
                  <TableRow key={categoria.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {categoria.icone && (
                          <span className="text-xl">{categoria.icone}</span>
                        )}
                        <span className="font-medium">{categoria.nome}</span>
                        {categoria.cor && (
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: categoria.cor }}
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={categoria.ativo ? "default" : "secondary"}>
                        {categoria.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(categoria)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Alterar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(categoria.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
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
