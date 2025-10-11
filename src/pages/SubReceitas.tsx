import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface SubReceita {
  id: string;
  nome: string;
  tempoPreparo: number;
}

export default function SubReceitas() {
  const [subReceitas, setSubReceitas] = useLocalStorage<SubReceita[]>("subReceitas", []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSubReceita, setEditingSubReceita] = useState<SubReceita | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    tempoPreparo: "",
  });

  const handleOpenDialog = (subReceita?: SubReceita) => {
    if (subReceita) {
      setEditingSubReceita(subReceita);
      setFormData({
        nome: subReceita.nome,
        tempoPreparo: subReceita.tempoPreparo.toString(),
      });
    } else {
      setEditingSubReceita(null);
      setFormData({ nome: "", tempoPreparo: "" });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSubReceita(null);
    setFormData({ nome: "", tempoPreparo: "" });
  };

  const handleSave = () => {
    if (!formData.nome.trim()) {
      toast.error("Por favor, informe o nome da sub-receita");
      return;
    }

    if (!formData.tempoPreparo || Number(formData.tempoPreparo) <= 0) {
      toast.error("Por favor, informe um tempo de preparo válido");
      return;
    }

    if (editingSubReceita) {
      setSubReceitas(
        subReceitas.map((item) =>
          item.id === editingSubReceita.id
            ? { ...item, nome: formData.nome, tempoPreparo: Number(formData.tempoPreparo) }
            : item
        )
      );
      toast.success("Sub-receita atualizada com sucesso!");
    } else {
      const novaSubReceita: SubReceita = {
        id: Date.now().toString(),
        nome: formData.nome,
        tempoPreparo: Number(formData.tempoPreparo),
      };
      setSubReceitas([...subReceitas, novaSubReceita]);
      toast.success("Sub-receita criada com sucesso!");
    }

    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingId) {
      setSubReceitas(subReceitas.filter((item) => item.id !== deletingId));
      toast.success("Sub-receita excluída com sucesso!");
    }
    setIsDeleteDialogOpen(false);
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sub-Receitas"
        description="Gerencie suas sub-receitas e componentes"
      />

      <div className="flex justify-end">
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Criar nova sub-receita
        </Button>
      </div>

      {subReceitas.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="Nenhuma sub-receita cadastrada"
          description="Comece criando sua primeira sub-receita"
          actionLabel="Criar nova sub-receita"
          onAction={() => handleOpenDialog()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subReceitas.map((subReceita) => (
            <Card key={subReceita.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{subReceita.nome}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(subReceita)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(subReceita.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Tempo de Preparo: {subReceita.tempoPreparo} minutos
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSubReceita ? "Editar Sub-Receita" : "Nova Sub-Receita"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados da sub-receita
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome da Sub-Receita</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Recheio de Brigadeiro"
              />
            </div>
            <div>
              <Label htmlFor="tempoPreparo">Tempo de Preparo (minutos)</Label>
              <Input
                id="tempoPreparo"
                type="number"
                min="1"
                value={formData.tempoPreparo}
                onChange={(e) => setFormData({ ...formData, tempoPreparo: e.target.value })}
                placeholder="Ex: 30"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Excluir sub-receita"
        description="Tem certeza que deseja excluir esta sub-receita? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
      />
    </div>
  );
}
