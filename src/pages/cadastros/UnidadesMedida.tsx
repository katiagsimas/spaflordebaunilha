import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Plus, Pencil, Trash2, Ruler } from "lucide-react";
import { toast } from "sonner";

interface UnidadeMedida {
  id: string;
  nome: string;
  sigla: string;
}

export default function UnidadesMedida() {
  const [unidades, setUnidades] = useLocalStorage<UnidadeMedida[]>("unidadesMedida", [
    { id: "1", nome: "Unidades", sigla: "un" },
    { id: "2", nome: "Gramas", sigla: "g" },
    { id: "3", nome: "Quilogramas", sigla: "kg" },
    { id: "4", nome: "Mililitros", sigla: "ml" },
    { id: "5", nome: "Litros", sigla: "l" },
    { id: "6", nome: "Centímetros", sigla: "cm" },
    { id: "7", nome: "Metros", sigla: "m" },
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnidade, setEditingUnidade] = useState<UnidadeMedida | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    sigla: "",
  });

  useEffect(() => {
    if (editingUnidade) {
      setFormData(editingUnidade);
      setIsDialogOpen(true);
    }
  }, [editingUnidade]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUnidade) {
      setUnidades(unidades.map(u => u.id === editingUnidade.id ? { ...formData, id: u.id } : u));
      toast.success("Unidade atualizada com sucesso!");
    } else {
      const newUnidade: UnidadeMedida = {
        ...formData,
        id: Date.now().toString(),
      };
      setUnidades([...unidades, newUnidade]);
      toast.success("Unidade cadastrada com sucesso!");
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      sigla: "",
    });
    setEditingUnidade(null);
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setUnidades(unidades.filter(u => u.id !== id));
    setDeleteId(null);
    toast.success("Unidade excluída com sucesso!");
  };

  const handleEdit = (unidade: UnidadeMedida) => {
    setEditingUnidade(unidade);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Unidades de Medidas"
        description="Gerencie as unidades de medida"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lista de Unidades de Medida</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingUnidade(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Unidade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUnidade ? "Editar Unidade" : "Nova Unidade"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Gramas, Litros, Unidades"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sigla">Sigla *</Label>
                  <Input
                    id="sigla"
                    value={formData.sigla}
                    onChange={(e) => setFormData({ ...formData, sigla: e.target.value })}
                    placeholder="Ex: g, l, un"
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingUnidade ? "Atualizar" : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {unidades.length === 0 ? (
            <EmptyState
              icon={Ruler}
              title="Nenhuma unidade cadastrada"
              description="Comece adicionando sua primeira unidade de medida"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Sigla</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unidades.map((unidade) => (
                    <TableRow key={unidade.id}>
                      <TableCell className="font-medium">{unidade.nome}</TableCell>
                      <TableCell>{unidade.sigla}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(unidade)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(unidade.id)}
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
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Excluir Unidade"
        description="Tem certeza que deseja excluir esta unidade? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
