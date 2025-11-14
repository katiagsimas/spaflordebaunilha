import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMaoObra, type MaoDeObra } from "@/hooks/useMaoObra";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const coresDisponiveis = [
  { value: "blue", label: "Azul", class: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300" },
  { value: "purple", label: "Roxo", class: "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-300" },
  { value: "pink", label: "Rosa", class: "bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-300" },
  { value: "green", label: "Verde", class: "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-300" },
  { value: "amber", label: "Âmbar", class: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300" },
  { value: "red", label: "Vermelho", class: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300" },
];

export default function MaoDeObra() {
  const navigate = useNavigate();
  const { valores, isLoading, historico, createMaoObra, updateMaoObra, deleteMaoObra, toggleAtivo } = useMaoObra();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<MaoDeObra | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [historicoOpen, setHistoricoOpen] = useState(false);
  const [valorSelecionado, setValorSelecionado] = useState<MaoDeObra | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    valor_hora: "",
    descricao: "",
    cor: "blue",
    ativo: true,
    padrao: false,
  });

  const verificarSeEstaEmUso = async (maoObraId: string): Promise<boolean> => {
    try {
      const { data: receitas, error: receitasError } = await supabase
        .from('receitas')
        .select('id')
        .contains('mao_obra_ids', [maoObraId])
        .limit(1);

      if (receitasError) throw receitasError;

      const { data: subReceitas, error: subReceitasError } = await supabase
        .from('sub_receitas')
        .select('id')
        .contains('mao_obra_ids', [maoObraId])
        .limit(1);

      if (subReceitasError) throw subReceitasError;

      return (receitas && receitas.length > 0) || (subReceitas && subReceitas.length > 0);
    } catch (error) {
      console.error('Erro ao verificar uso:', error);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!formData.nome || !formData.valor_hora) {
      return;
    }

    const data = {
      nome: formData.nome,
      valor_hora: parseFloat(formData.valor_hora),
      descricao: formData.descricao || undefined,
      cor: formData.cor,
      ativo: formData.ativo,
      padrao: formData.padrao,
    };

    if (editando) {
      updateMaoObra({ id: editando.id, ...data });
    } else {
      createMaoObra(data);
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (valor: MaoDeObra) => {
    setEditando(valor);
    setFormData({
      nome: valor.nome,
      valor_hora: valor.valor_hora.toString(),
      descricao: valor.descricao || "",
      cor: valor.cor || "blue",
      ativo: valor.ativo ?? true,
      padrao: valor.padrao ?? false,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const emUso = await verificarSeEstaEmUso(id);
    
    if (emUso) {
      toast.error("Não é possível excluir", {
        description: "Este valor de mão de obra está sendo utilizado no módulo de Precificação e não pode ser excluído.",
      });
      setDeleteDialog(null);
      return;
    }
    
    deleteMaoObra(id);
    setDeleteDialog(null);
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      valor_hora: "",
      descricao: "",
      cor: "blue",
      ativo: true,
      padrao: false,
    });
    setEditando(null);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const verHistorico = (valor: MaoDeObra) => {
    setValorSelecionado(valor);
    setHistoricoOpen(true);
  };

  const historicoFiltrado = valorSelecionado
    ? historico.filter(h => h.mao_obra_id === valorSelecionado.id)
    : [];

  const formatarDataHora = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const valoresSorted = [...(valores || [])].sort((a, b) => {
    if (a.padrao && !b.padrao) return -1;
    if (!a.padrao && b.padrao) return 1;
    if (a.ativo && !b.ativo) return -1;
    if (!a.ativo && b.ativo) return 1;
    return a.nome.localeCompare(b.nome);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Valores de Mão de Obra"
        description="Configure os valores de hora de trabalho para usar na precificação"
        actions={
          <div className="flex gap-2">
            <BackButton to="/configuracoes/precificacao" />
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Valor
            </Button>
          </div>
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Como usar os Valores de Mão de Obra</CardTitle>
          <CardDescription>
            Configure diferentes valores de hora de mão de obra para usar nas suas receitas e precificações.
            Você pode criar valores diferentes para tipos de trabalho ou níveis de complexidade.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor/Hora</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Padrão</TableHead>
              <TableHead className="text-center">Última Atualização</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {valoresSorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum valor de mão de obra cadastrado
                </TableCell>
              </TableRow>
            ) : (
              valoresSorted.map((valor) => (
                <TableRow key={valor.id} className={!valor.ativo ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{valor.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{valor.descricao || "-"}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(valor.valor_hora)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      valor.ativo 
                        ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                    }`}>
                      {valor.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {valor.padrao && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        Sim
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {valor.updated_at 
                      ? new Date(valor.updated_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(valor)}>
                          Alterar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => verHistorico(valor)}>
                          Ver histórico das alterações
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteDialog(valor.id)}
                          className="text-destructive"
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar Valor de Mão de Obra" : "Adicionar Valor de Mão de Obra"}
            </DialogTitle>
            <DialogDescription>
              Configure o valor por hora de trabalho
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Confeiteiro Junior"
                disabled={!!editando}
              />
              {editando && (
                <p className="text-xs text-muted-foreground">
                  O nome não pode ser alterado após a criação
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_hora">Valor por Hora (R$) *</Label>
              <Input
                id="valor_hora"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_hora}
                onChange={(e) => setFormData({ ...formData, valor_hora: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o tipo de mão de obra..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="grid grid-cols-6 gap-2">
                {coresDisponiveis.map((cor) => (
                  <button
                    key={cor.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, cor: cor.value })}
                    className={`h-10 rounded-md ${cor.class} ${
                      formData.cor === cor.value ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                    title={cor.label}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="ativo">Ativo</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="padrao"
                  checked={formData.padrao}
                  onCheckedChange={(checked) => setFormData({ ...formData, padrao: checked })}
                />
                <Label htmlFor="padrao">Padrão</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => handleDialogClose(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editando ? "Salvar Alterações" : "Adicionar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este valor de mão de obra? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={historicoOpen} onOpenChange={setHistoricoOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Alterações</DialogTitle>
            <DialogDescription>
              {valorSelecionado?.nome}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {historicoFiltrado.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma alteração registrada
              </p>
            ) : (
              historicoFiltrado.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">
                        {item.tipo_alteracao === 'criacao' && 'Criação'}
                        {item.tipo_alteracao === 'edicao' && 'Edição'}
                        {item.tipo_alteracao === 'exclusao' && 'Exclusão'}
                      </CardTitle>
                      <Badge variant="outline">
                        {formatarDataHora(item.data_alteracao || item.created_at || '')}
                      </Badge>
                    </div>
                    {item.descricao_alteracao && (
                      <CardDescription>{item.descricao_alteracao}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {item.nome_anterior && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-muted-foreground">Nome anterior:</span>
                            <p className="font-medium">{item.nome_anterior}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Nome novo:</span>
                            <p className="font-medium">{item.nome_novo}</p>
                          </div>
                        </div>
                      )}
                      {item.valor_anterior !== null && item.valor_anterior !== undefined && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-muted-foreground">Valor anterior:</span>
                            <p className="font-medium">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(item.valor_anterior)}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Valor novo:</span>
                            <p className="font-medium">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(item.valor_novo)}
                            </p>
                          </div>
                        </div>
                      )}
                      {item.descricao_anterior && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-muted-foreground">Descrição anterior:</span>
                            <p className="font-medium">{item.descricao_anterior}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Descrição nova:</span>
                            <p className="font-medium">{item.descricao_novo || "-"}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
