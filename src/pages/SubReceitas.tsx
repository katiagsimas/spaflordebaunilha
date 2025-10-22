import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ChefHat } from "lucide-react";
import { useSubReceitas } from "@/hooks/useSubReceitas";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function SubReceitas() {
  const navigate = useNavigate();
  const { subReceitas, deleteSubReceita, isLoading } = useSubReceitas();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingId) {
      await deleteSubReceita(deletingId);
    }
    setIsDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const handleCreateNew = () => {
    navigate("/precificacao/pre-preparo/nova");
  };

  const handleEdit = (id: string) => {
    navigate(`/precificacao/pre-preparo/editar/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton to="/precificacao" />
        <div className="flex-1">
          <PageHeader
            title="Pré-Preparo"
            description="Gerencie suas sub-receitas e pré-preparações"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Criar novo Pré-Preparo
        </Button>
      </div>

      {subReceitas.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="Nenhum pré-preparo cadastrado"
          description="Crie seus pré-preparos para otimizar a produção e calcular custos de forma precisa"
          actionLabel="Criar novo Pré-Preparo"
          onAction={handleCreateNew}
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Rendimento</TableHead>
                    <TableHead>Custos de Produção</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subReceitas
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((subReceita) => (
                      <TableRow key={subReceita.id}>
                        <TableCell className="font-medium">{subReceita.nome}</TableCell>
                        <TableCell>{subReceita.rendimento}</TableCell>
                        <TableCell className="font-semibold">
                          R$ {subReceita.custo_total.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(subReceita.id)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(subReceita.id)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

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
