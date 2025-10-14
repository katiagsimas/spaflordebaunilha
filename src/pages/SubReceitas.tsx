import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ArrowLeft, ChefHat, Copy } from "lucide-react";
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

  const handleDuplicate = (id: string) => {
    const subReceitaOriginal = subReceitas.find(sr => sr.id === id);
    if (!subReceitaOriginal) return;

    const novaSubReceita: SubReceita = {
      ...subReceitaOriginal,
      id: `${Date.now()}`,
      nome: `Cópia de ${subReceitaOriginal.nome}`,
      ingredientes: subReceitaOriginal.ingredientes.map(ing => ({
        ...ing,
        id: `${Date.now()}-${Math.random()}`
      }))
    };

    setSubReceitas([...subReceitas, novaSubReceita]);
    toast.success("Sub-receita duplicada com sucesso!");
    
    // Navega para edição da cópia
    navigate(`/sub-receitas/editar/${novaSubReceita.id}`);
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
          title="Nenhuma sub-receita cadastrada"
          description="Comece criando sua primeira sub-receita"
          actionLabel="Criar nova sub-receita"
          onAction={handleCreateNew}
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Nome</TableHead>
                    <TableHead className="text-center">Rendimento</TableHead>
                    <TableHead className="text-center">Unidade</TableHead>
                    <TableHead className="text-center">Custos de Produção</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subReceitas
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((subReceita) => (
                      <TableRow key={subReceita.id}>
                        <TableCell className="font-medium">{subReceita.nome}</TableCell>
                        <TableCell>{subReceita.rendimento}</TableCell>
                        <TableCell>
                          {subReceita.unidadeRendimento === "gramas" ? "Gramas" : "Unidades"}
                        </TableCell>
                        <TableCell className="font-semibold">
                          R$ {subReceita.custoTotal.toFixed(2)}
                        </TableCell>
                         <TableCell className="text-right">
                          <div className="flex justify-end gap-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEdit(subReceita.id)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleDuplicate(subReceita.id)}
                              title="Duplicar"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleDelete(subReceita.id)}
                              title="Excluir"
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
