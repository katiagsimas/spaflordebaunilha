import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
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
  const [custos, setCustos] = useLocalStorage<CustoFixo[]>("custosFixos", []);
  const [diasTrabalho, setDiasTrabalho] = useLocalStorage<number>("diasTrabalhoMes", 22);
  const [horasDiarias, setHorasDiarias] = useLocalStorage<number>("horasDiariaTrabalho", 8);
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
  const horasMes = diasTrabalho * horasDiarias;
  const custoPorHora = horasMes > 0 ? totalCustos / horasMes : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton to="/precificacao" />
        <div className="flex-1">
          <PageHeader
            title="Custos Fixos"
            description="Gerencie suas despesas mensais fixas"
          />
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Mantenha estas informações sempre atualizadas para garantir cálculos precisos de custos.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-xl">💰 Total Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">
              R$ {totalCustos.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="text-xl">⏱️ Valor do Custo Fixo por Hora</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">
              R$ {custoPorHora.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Baseado em {horasMes} horas/mês
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Configuração de Horas de Trabalho</CardTitle>
          <CardDescription>
            Defina sua jornada de trabalho para calcular o custo por hora
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="diasTrabalho">Dias de Trabalho/Mês</Label>
              <Input
                id="diasTrabalho"
                type="number"
                min="1"
                max="31"
                value={diasTrabalho}
                onChange={(e) => setDiasTrabalho(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horasDiarias">Horas Diárias de Trabalho</Label>
              <Input
                id="horasDiarias"
                type="number"
                min="1"
                max="24"
                step="0.5"
                value={horasDiarias}
                onChange={(e) => setHorasDiarias(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Total de Horas/Mês</Label>
              <div className="h-10 flex items-center px-4 rounded-lg bg-muted border-2 border-border">
                <p className="text-lg font-bold text-primary">
                  {horasMes} horas
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Seus Custos Fixos</h2>
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
