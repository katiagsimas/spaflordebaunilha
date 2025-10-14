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
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

interface Categoria {
  id: string;
  nome: string;
}

const categoriasIniciais: Categoria[] = [
  { id: "1", nome: "Bolo Caseiro" },
  { id: "2", nome: "Bolo Decorado" },
  { id: "3", nome: "Doces" },
  { id: "4", nome: "Salgados" },
  { id: "5", nome: "Fatias" },
];

export default function Categorias() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useLocalStorage<Categoria[]>("categorias", categoriasIniciais);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
  });


  // Garantir que as categorias iniciais sejam carregadas se estiver vazio
  useEffect(() => {
    if (categorias.length === 0) {
      setCategorias(categoriasIniciais);
    }
  }, []);

  useEffect(() => {
    if (editingCategoria) {
      setFormData(editingCategoria);
      setIsDialogOpen(true);
    }
  }, [editingCategoria]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      toast.error("Por favor, informe o nome da categoria");
      return;
    }

    if (editingCategoria) {
      const updatedCategorias = categorias.map(c => 
        c.id === editingCategoria.id ? { ...formData, id: c.id } : c
      );
      // Ordenar alfabeticamente
      setCategorias(updatedCategorias.sort((a, b) => a.nome.localeCompare(b.nome)));
      toast.success("Categoria atualizada com sucesso!");
    } else {
      const newCategoria: Categoria = {
        ...formData,
        id: Date.now().toString(),
      };
      // Adicionar e ordenar alfabeticamente
      const updatedCategorias = [...categorias, newCategoria];
      setCategorias(updatedCategorias.sort((a, b) => a.nome.localeCompare(b.nome)));
      toast.success("Categoria cadastrada com sucesso!");
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nome: "",
    });
    setEditingCategoria(null);
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setCategorias(categorias.filter(c => c.id !== id));
    setDeleteId(null);
    toast.success("Categoria excluída com sucesso!");
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton to="/configuracoes" />
        <div className="flex-1">
          <PageHeader
            title="Categorias de Receitas"
            description="Gerencie as categorias de receitas"
          />
        </div>
      </div>

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
