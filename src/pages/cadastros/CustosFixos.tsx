import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ArrowLeft, Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CustoFixo {
  id: string;
  nome: string;
  valor: number;
}

export default function CustosFixos() {
  const navigate = useNavigate();
  const [custos, setCustos] = useLocalStorage<CustoFixo[]>("custosFixos", []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCusto, setEditingCusto] = useState<CustoFixo | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim() || !valor) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (editingCusto) {
      setCustos(custos.map(c => 
        c.id === editingCusto.id 
          ? { ...c, nome: nome.trim(), valor: parseFloat(valor) }
          : c
      ));
      toast.success("Custo atualizado com sucesso!");
    } else {
      const novoCusto: CustoFixo = {
        id: Date.now().toString(),
        nome: nome.trim(),
        valor: parseFloat(valor),
      };
      setCustos([...custos, novoCusto]);
      toast.success("Custo adicionado com sucesso!");
    }

    resetForm();
  };

  const resetForm = () => {
    setNome("");
    setValor("");
    setEditingCusto(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (custo: CustoFixo) => {
    setEditingCusto(custo);
    setNome(custo.nome);
    setValor(custo.valor.toString());
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setCustos(custos.filter(c => c.id !== id));
    setDeletingId(null);
    toast.success("Custo removido com sucesso!");
  };

  const totalCustos = custos.reduce((acc, custo) => acc + custo.valor, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custos Fixos"
        description="Gerencie suas despesas mensais fixas"
        actions={
          <Button variant="outline" onClick={() => navigate("/cadastros")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        }
      />

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Mantenha estas informações sempre atualizadas para garantir cálculos precisos de custos.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Total Mensal</h2>
          <p className="text-3xl font-bold text-primary mt-1">
            R$ {totalCustos.toFixed(2)}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Custo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCusto ? "Editar Custo Fixo" : "Novo Custo Fixo"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Descrição</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Água, Luz, Internet..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor">Valor Mensal (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingCusto ? "Atualizar" : "Adicionar"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {custos.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="Nenhum custo cadastrado"
          description="Comece adicionando seus custos fixos mensais para ter um melhor controle financeiro."
          actionLabel="Adicionar Primeiro Custo"
          onAction={() => setIsDialogOpen(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {custos.map((custo) => (
            <Card key={custo.id}>
              <CardHeader>
                <CardTitle className="text-lg">{custo.nome}</CardTitle>
                <CardDescription className="text-2xl font-bold text-primary">
                  R$ {custo.valor.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(custo)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setDeletingId(custo.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        onConfirm={() => deletingId && handleDelete(deletingId)}
        title="Excluir custo fixo?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
      />
    </div>
  );
}
