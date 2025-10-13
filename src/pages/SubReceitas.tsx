import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ArrowLeft, ChefHat } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Ingrediente {
  id: string;
  nome: string;
  marca: string;
  quantidade: number;
  unidadeMedida: string;
  preco: number;
  dataAtualizacao: string;
}

interface IngredienteReceita {
  id: string;
  ingredienteId: string;
  ingrediente: string;
  marca: string;
  qtdeEmbalagem: number;
  unidadeMedida: string;
  precoEmbalagem: number;
  quantidadeUtilizada: number;
  custoUnitario: number;
  custoReceita: number;
}

interface SubReceita {
  id: string;
  nome: string;
  tempoPreparo: number;
  unidadeTempo: "minutos" | "horas";
  rendimento: number;
  unidadeRendimento: "gramas" | "unidades";
  ingredientes: IngredienteReceita[];
  custoTotal: number;
}

export default function SubReceitas() {
  const navigate = useNavigate();
  const [subReceitas, setSubReceitas] = useLocalStorage<SubReceita[]>("subReceitas", []);
  const [ingredientesCadastrados, setIngredientesCadastrados] = useLocalStorage<Ingrediente[]>("ingredientes", []);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Migração automática: converter sub-receitas existentes em ingredientes
  useEffect(() => {
    let houveMigracao = false;
    const novosIngredientes = [...ingredientesCadastrados];

    subReceitas.forEach((subReceita) => {
      const ingredienteId = `sub-receita-${subReceita.id}`;
      const ingredienteExiste = ingredientesCadastrados.some(ing => ing.id === ingredienteId);

      if (!ingredienteExiste) {
        const ingredienteSubReceita: Ingrediente = {
          id: ingredienteId,
          nome: subReceita.nome,
          marca: "Sub-Receita",
          quantidade: subReceita.rendimento,
          unidadeMedida: subReceita.unidadeRendimento === "gramas" ? "g" : "un",
          preco: subReceita.custoTotal,
          dataAtualizacao: new Date().toISOString().split('T')[0],
        };
        novosIngredientes.push(ingredienteSubReceita);
        houveMigracao = true;
      }
    });

    if (houveMigracao) {
      setIngredientesCadastrados(novosIngredientes);
      toast.success("Sub-receitas migradas para ingredientes com sucesso!");
    }
  }, []); // Executa apenas uma vez ao carregar

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

  const handleCreateNew = () => {
    navigate("/sub-receitas/nova");
  };

  const handleEdit = (id: string) => {
    navigate(`/sub-receitas/editar/${id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sub-Receitas"
        description="Gerencie suas sub-receitas e componentes"
      />

      <div className="flex justify-end">
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Criar nova sub-receita
        </Button>
      </div>

      {subReceitas.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="Nenhuma sub-receita cadastrada"
          description="Comece criando sua primeira sub-receita"
          actionLabel="Criar nova sub-receita"
          onAction={handleCreateNew}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subReceitas.map((subReceita) => (
            <Card key={subReceita.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{subReceita.nome}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(subReceita.id)}
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
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Tempo: {subReceita.tempoPreparo} {subReceita.unidadeTempo}
                </p>
                <p className="text-sm text-muted-foreground">
                  Rendimento: {subReceita.rendimento} {subReceita.unidadeRendimento}
                </p>
                <p className="text-sm text-muted-foreground">
                  Ingredientes: {subReceita.ingredientes.length}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  Custo Total: R$ {subReceita.custoTotal.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
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
