import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustosFixos } from "@/hooks/useCustosFixos";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Plus, Pencil, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CustoFixo {
  id: string;
  nome: string;
  valor: number;
}

export default function CustosFixos() {
  const { 
    custosFixos, 
    loading: loadingCustos, 
    createCustoFixo, 
    updateCustoFixo, 
    deleteCustoFixo,
    refetch: refetchCustos 
  } = useCustosFixos();

  const { 
    profile, 
    loading: loadingProfile, 
    updateProfile 
  } = useUserProfile();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCusto, setEditingCusto] = useState<CustoFixo | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");

  const categoriasCustos = [
    "Aluguel",
    "Energia elétrica",
    "Água",
    "Internet",
    "Telefone",
    "Salários",
    "Encargos trabalhistas",
    "Contador",
    "Taxas e impostos (MEI, Simples Nacional, etc.)",
    "Assinaturas de softwares (Canva, ChatGPT, Freepik, etc.)",
    "Manutenção de site",
    "Domínio e hospedagem",
    "Maquininha de cartão",
    "Seguros",
    "Pró-labore"
  ];
  
  // Estados locais para dias e horas (para edição)
  const [diasTrabalho, setDiasTrabalho] = useState(22);
  const [horasDiarias, setHorasDiarias] = useState(8);
  const [migrationDone, setMigrationDone] = useState(false);

  // Sincronizar com profile quando carregar
  useEffect(() => {
    if (profile) {
      setDiasTrabalho(profile.dias_trabalho_mes || 22);
      setHorasDiarias(profile.horas_diaria_trabalho || 8);
    }
  }, [profile]);

  // Migração automática de dados antigos do localStorage
  useEffect(() => {
    const migrateOldData = async () => {
      if (migrationDone || loadingCustos || loadingProfile || !profile) return;

      try {
        // Verificar se há dados no localStorage
        const oldCustos = localStorage.getItem('custosFixos');
        const oldDias = localStorage.getItem('diasTrabalhoMes');
        const oldHoras = localStorage.getItem('horasDiariaTrabalho');
        
        if (!oldCustos && !oldDias && !oldHoras) {
          setMigrationDone(true);
          return; // Nada pra migrar
        }

        console.log('🔄 Migrando dados antigos de Custos Fixos...');
        let migratedCount = 0;

        // Migrar custos fixos
        if (oldCustos) {
          try {
            const custosArray = JSON.parse(oldCustos);
            if (Array.isArray(custosArray) && custosArray.length > 0) {
              for (const custo of custosArray) {
                // Verificar se já não existe no Supabase
                const jaExiste = custosFixos.some(c => 
                  c.nome === custo.nome && c.valor === custo.valor
                );
                if (!jaExiste) {
                  await createCustoFixo({
                    nome: custo.nome,
                    valor: custo.valor
                  });
                  migratedCount++;
                }
              }
              if (migratedCount > 0) {
                console.log(`✅ ${migratedCount} custos fixos migrados`);
              }
            }
          } catch (e) {
            console.error('Erro ao parsear custos do localStorage:', e);
          }
        }

        // Migrar configurações de trabalho
        if (oldDias || oldHoras) {
          const dias = oldDias ? parseInt(oldDias) : 22;
          const horas = oldHoras ? parseInt(oldHoras) : 8;
          
          // Só migrar se for diferente do padrão atual
          if (dias !== profile.dias_trabalho_mes || horas !== profile.horas_diaria_trabalho) {
            await updateProfile({
              dias_trabalho_mes: dias,
              horas_diaria_trabalho: horas
            });
            console.log(`✅ Configurações de trabalho migradas: ${dias} dias, ${horas} horas`);
          }
        }

        // Limpar localStorage após migração bem-sucedida
        localStorage.removeItem('custosFixos');
        localStorage.removeItem('diasTrabalhoMes');
        localStorage.removeItem('horasDiariaTrabalho');
        
        if (migratedCount > 0 || oldDias || oldHoras) {
          toast.success('✅ Dados migrados para a nuvem!');
          // Recarregar dados
          refetchCustos();
        }
        
        setMigrationDone(true);
      } catch (error) {
        console.error('❌ Erro na migração:', error);
        setMigrationDone(true);
        // Não mostrar erro pro usuário, apenas logar
      }
    };

    migrateOldData();
  }, [loadingCustos, loadingProfile, custosFixos, profile, migrationDone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim() || !valor) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      if (editingCusto) {
        await updateCustoFixo(editingCusto.id, {
          nome: nome.trim(),
          valor: parseFloat(valor)
        });
      } else {
        await createCustoFixo({
          nome: nome.trim(),
          valor: parseFloat(valor)
        });
      }
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar custo:', error);
    }
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

  const handleDelete = async (id: string) => {
    try {
      await deleteCustoFixo(id);
      setDeletingId(null);
    } catch (error) {
      console.error('Erro ao excluir custo:', error);
    }
  };

  const handleSaveConfigTrabalho = async () => {
    if (diasTrabalho <= 0 || horasDiarias <= 0) {
      toast.error('Dias e horas devem ser maiores que zero.');
      return;
    }

    await updateProfile({
      dias_trabalho_mes: diasTrabalho,
      horas_diaria_trabalho: horasDiarias,
    });
  };

  const loading = loadingCustos || loadingProfile;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Carregando custos fixos...</span>
      </div>
    );
  }

  const totalCustos = custosFixos.reduce((acc, custo) => acc + custo.valor, 0);
  const horasMes = diasTrabalho * horasDiarias;
  const custoPorHora = horasMes > 0 ? totalCustos / horasMes : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custos Fixos"
        description="Gerencie suas despesas mensais fixas"
        backButton={<BackButton to="/configuracoes/precificacao" />}
      />

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
                onBlur={handleSaveConfigTrabalho}
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
                onBlur={handleSaveConfigTrabalho}
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
                <Label htmlFor="categoria">Categoria</Label>
                <Select value={nome} onValueChange={setNome}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasCustos.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

      {custosFixos.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="Nenhum custo cadastrado"
          description="Comece adicionando seus custos fixos mensais para ter um melhor controle financeiro."
          actionLabel="Adicionar Primeiro Custo"
          onAction={() => setIsDialogOpen(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {custosFixos.map((custo) => (
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
