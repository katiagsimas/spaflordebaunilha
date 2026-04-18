import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calculator, Plus, Edit2, Trash2, Star, History } from "lucide-react";
import { useMaoObraPerfis } from "@/hooks/useMaoObraPerfis";
import { useMaoObraHistorico } from "@/hooks/useMaoObraHistorico";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useGlobalLoading } from "@/contexts/GlobalLoadingContext";

export default function MaoDeObra() {
  const { showLoading, hideLoading } = useGlobalLoading();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile, loading: profileLoading, refetch: refetchProfile } = useUserProfile();
  const { perfis, isLoading: perfisLoading, createPerfil, updatePerfil, deletePerfil } = useMaoObraPerfis();
  const [valorHora, setValorHora] = useState<string>("");
  const [saving, setSaving] = useState(false);
  
  // Estados para o diálogo de perfil
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPerfil, setEditingPerfil] = useState<any>(null);
  const [perfilNome, setPerfilNome] = useState("");
  const [perfilValor, setPerfilValor] = useState("");
  const [perfilAtivo, setPerfilAtivo] = useState(true);
  const [perfilPadrao, setPerfilPadrao] = useState(false);
  
  // Estados para exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [perfilToDelete, setPerfilToDelete] = useState<string | null>(null);

  // Estados para filtros de histórico
  const [filtroPerfilId, setFiltroPerfilId] = useState<string>("all");
  const [filtroDataInicial, setFiltroDataInicial] = useState<string>("");
  const [filtroDataFinal, setFiltroDataFinal] = useState<string>("");

  const { historico, isLoading: historicoLoading } = useMaoObraHistorico(
    filtroPerfilId === "all" ? undefined : filtroPerfilId,
    filtroDataInicial || undefined,
    filtroDataFinal || undefined
  );

  useEffect(() => {
    if (profileLoading || perfisLoading) {
      showLoading("Carregando mão de obra...");
    } else {
      hideLoading();
    }
  }, [profileLoading, perfisLoading, showLoading, hideLoading]);

  useEffect(() => {
    if (profile?.valor_hora) {
      setValorHora(profile.valor_hora.toFixed(2));
    }
  }, [profile]);

  if (profileLoading || perfisLoading) return null;

  const handleSave = async () => {
    if (!profile?.id) {
      toast.error("Perfil não encontrado");
      return;
    }

    const valor = parseFloat(valorHora);
    
    if (isNaN(valor) || valor < 0) {
      toast.error("Valor inválido");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ valor_hora: valor })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("Valor de mão de obra salvo com sucesso!");

      // Recarrega profile local e invalida queries do onboarding para destravar redirect
      await refetchProfile();
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
      await queryClient.invalidateQueries({ queryKey: ["mao_obra_perfis"] });

      // Se ainda não houver backup, segue o fluxo de onboarding
      if (user) {
        const { count } = await supabase
          .from("backups" as any)
          .select("id", { count: "exact", head: true })
          .eq("usuario_id", user.id) as any;
        if ((count ?? 0) === 0) {
          navigate("/configuracoes/backup", { replace: true });
        }
      }
    } catch (error) {
      console.error("Erro ao salvar valor de mão de obra:", error);
      toast.error("Erro ao salvar valor de mão de obra");
    } finally {
      setSaving(false);
    }
  };
  
  const handleOpenPerfilDialog = (perfil?: any) => {
    if (perfil) {
      setEditingPerfil(perfil);
      setPerfilNome(perfil.nome);
      setPerfilValor(perfil.valor_hora.toString());
      setPerfilAtivo(perfil.ativo);
      setPerfilPadrao(perfil.padrao);
    } else {
      setEditingPerfil(null);
      setPerfilNome("");
      setPerfilValor("");
      setPerfilAtivo(true);
      setPerfilPadrao(false);
    }
    setDialogOpen(true);
  };
  
  const handleSavePerfil = () => {
    const valor = parseFloat(perfilValor);
    
    if (!perfilNome.trim()) {
      toast.error("Nome do perfil é obrigatório");
      return;
    }
    
    if (isNaN(valor) || valor < 0) {
      toast.error("Valor inválido");
      return;
    }
    
    if (editingPerfil) {
      updatePerfil({
        id: editingPerfil.id,
        nome: perfilNome,
        valor_hora: valor,
        ativo: perfilAtivo,
        padrao: perfilPadrao,
      });
    } else {
      createPerfil({
        nome: perfilNome,
        valor_hora: valor,
        ativo: perfilAtivo,
        padrao: perfilPadrao,
      });
    }
    
    setDialogOpen(false);
  };
  
  const handleDeletePerfil = () => {
    if (perfilToDelete) {
      deletePerfil(perfilToDelete);
      setDeleteDialogOpen(false);
      setPerfilToDelete(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getAcaoLabel = (acao: string) => {
    const labels: Record<string, string> = {
      'criacao': 'Criação',
      'atualizacao_valor': 'Alteração de valor',
      'ativacao': 'Ativação',
      'desativacao': 'Desativação',
      'definir_padrao': 'Definido como padrão',
      'remover_padrao': 'Removido como padrão',
    };
    return labels[acao] || acao;
  };

  if (profileLoading || perfisLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Mão de Obra"
        description="Configure o valor-hora e perfis de mão de obra"
        backButton={<BackButton to="/configuracoes/precificacao" />}
      />
      
      <div className="p-4 md:p-6 space-y-6">
        {/* Seção A - Valor Hora Padrão */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <CardTitle>Valor Hora Padrão</CardTitle>
            </div>
            <CardDescription>
              Se você trabalha sozinha, use apenas este valor-hora. As fichas técnicas usam este valor por padrão.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="valorHora">Valor por Hora (R$)</Label>
                <Input
                  id="valorHora"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={valorHora}
                  onChange={(e) => setValorHora(e.target.value)}
                />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Valor-Hora"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Seção B - Perfis de Mão de Obra Avançados */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  <CardTitle>Perfis de Mão de Obra Avançados</CardTitle>
                </div>
                <CardDescription>
                  Crie perfis personalizados para diferentes tipos de trabalho
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenPerfilDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Perfil
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingPerfil ? "Editar Perfil" : "Novo Perfil de Mão de Obra"}
                    </DialogTitle>
                    <DialogDescription>
                      Configure um perfil de mão de obra personalizado
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="perfilNome">Nome do Perfil</Label>
                      <Input
                        id="perfilNome"
                        placeholder="Ex: Decoração Avançada"
                        value={perfilNome}
                        onChange={(e) => setPerfilNome(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="perfilValor">Valor por Hora (R$)</Label>
                      <Input
                        id="perfilValor"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={perfilValor}
                        onChange={(e) => setPerfilValor(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="perfilAtivo">Perfil Ativo</Label>
                      <Switch
                        id="perfilAtivo"
                        checked={perfilAtivo}
                        onCheckedChange={setPerfilAtivo}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="perfilPadrao">Perfil Padrão</Label>
                        <p className="text-xs text-muted-foreground">
                          Será usado automaticamente nas novas receitas
                        </p>
                      </div>
                      <Switch
                        id="perfilPadrao"
                        checked={perfilPadrao}
                        onCheckedChange={setPerfilPadrao}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSavePerfil}>
                      {editingPerfil ? "Salvar Alterações" : "Criar Perfil"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {perfis.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum perfil de mão de obra criado ainda.</p>
                <p className="text-sm">Clique em "Novo Perfil" para começar.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Valor/Hora</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perfis.map((perfil) => (
                      <TableRow key={perfil.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {perfil.nome}
                            {perfil.padrao && (
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                <Star className="h-3 w-3 mr-1" />
                                Padrão
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(perfil.valor_hora)}</TableCell>
                        <TableCell>
                          {perfil.ativo ? (
                            <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Ativo</Badge>
                          ) : (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenPerfilDialog(perfil)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setPerfilToDelete(perfil.id);
                                setDeleteDialogOpen(true);
                              }}
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
            )}
          </CardContent>
        </Card>

        {/* Seção C - Histórico de Alterações */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <CardTitle>Histórico de Alterações</CardTitle>
            </div>
            <CardDescription>
              Acompanhe todas as mudanças nos perfis de mão de obra
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Filtros */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Perfil</Label>
                  <Select value={filtroPerfilId} onValueChange={setFiltroPerfilId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os perfis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os perfis</SelectItem>
                      {perfis.map((perfil) => (
                        <SelectItem key={perfil.id} value={perfil.id}>
                          {perfil.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="dataInicial">Data Inicial</Label>
                  <Input
                    id="dataInicial"
                    type="date"
                    value={filtroDataInicial}
                    onChange={(e) => setFiltroDataInicial(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="dataFinal">Data Final</Label>
                  <Input
                    id="dataFinal"
                    type="date"
                    value={filtroDataFinal}
                    onChange={(e) => setFiltroDataFinal(e.target.value)}
                  />
                </div>
              </div>

              {/* Tabela de Histórico */}
              {historicoLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </div>
              ) : historico.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma alteração registrada até o momento.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Perfil</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Valor Antigo</TableHead>
                        <TableHead>Valor Novo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historico.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-xs">
                            {formatDate(item.registrado_em)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.perfil_nome}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getAcaoLabel(item.acao)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.valor_antigo !== null ? formatCurrency(item.valor_antigo) : '-'}
                          </TableCell>
                          <TableCell>
                            {item.valor_novo !== null ? formatCurrency(item.valor_novo) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este perfil de mão de obra? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePerfil} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
