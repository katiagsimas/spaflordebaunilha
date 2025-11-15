import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calculator, Plus, Edit2, Trash2, Star } from "lucide-react";
import { useMaoObraPerfis } from "@/hooks/useMaoObraPerfis";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function MaoDeObra() {
  const { profile, loading: profileLoading } = useUserProfile();
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

  useEffect(() => {
    if (profile?.valor_hora) {
      setValorHora(profile.valor_hora.toFixed(2));
    }
  }, [profile]);

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

  if (profileLoading || perfisLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Valores de Mão de Obra"
        description="Configure o valor/hora para cálculo automático nas receitas"
        backButton={<BackButton to="/configuracoes/precificacao" />}
      />
      
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        {/* BLOCO A — Configuração Rápida (Valor Padrão) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <CardTitle>Valor Padrão de Mão de Obra</CardTitle>
            </div>
            <CardDescription>
              Se você trabalha sozinha, use apenas este valor-hora. Ele será aplicado a todas as receitas que não tiverem um perfil específico.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="valor-hora">Valor por Hora (R$)</Label>
              <Input
                id="valor-hora"
                type="number"
                min="0"
                step="0.01"
                value={valorHora}
                onChange={(e) => setValorHora(e.target.value)}
                placeholder="0.00"
                className="max-w-xs"
              />
            </div>

            <Button 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Valor Padrão"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* BLOCO B — Perfis Avançados de Mão de Obra */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Perfis Avançados de Mão de Obra</CardTitle>
                <CardDescription>
                  Configure diferentes perfis com valores/hora específicos para cada tipo de trabalho
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenPerfilDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Perfil
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingPerfil ? "Editar Perfil" : "Novo Perfil de Mão de Obra"}
                    </DialogTitle>
                    <DialogDescription>
                      Configure um perfil personalizado com valor/hora específico
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="perfil-nome">Nome do Perfil</Label>
                      <Input
                        id="perfil-nome"
                        placeholder="Ex: Confeiteira, Cake Designer"
                        value={perfilNome}
                        onChange={(e) => setPerfilNome(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="perfil-valor">Valor/Hora (R$)</Label>
                      <Input
                        id="perfil-valor"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={perfilValor}
                        onChange={(e) => setPerfilValor(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="perfil-ativo">Ativo</Label>
                      <Switch
                        id="perfil-ativo"
                        checked={perfilAtivo}
                        onCheckedChange={setPerfilAtivo}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="perfil-padrao">Definir como padrão</Label>
                      <Switch
                        id="perfil-padrao"
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
                      {editingPerfil ? "Atualizar" : "Criar"} Perfil
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {perfis.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum perfil avançado cadastrado.</p>
                <p className="text-sm mt-1">Use o valor padrão ou crie perfis personalizados.</p>
              </div>
            ) : (
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
                            <Badge variant="secondary" className="gap-1">
                              <Star className="h-3 w-3" />
                              Padrão
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>R$ {perfil.valor_hora.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={perfil.ativo ? "default" : "secondary"}>
                          {perfil.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Card com Exemplo */}
        {valorHora && parseFloat(valorHora) > 0 && (
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
            <CardHeader>
              <CardTitle className="text-base">Exemplo de Cálculo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Valor/Hora:</span> R$ {parseFloat(valorHora).toFixed(2)}
                </p>
                <p>
                  <span className="font-medium">Receita com 2 horas de preparo:</span> R$ {(parseFloat(valorHora) * 2).toFixed(2)}
                </p>
                <p>
                  <span className="font-medium">Receita com 30 minutos (0,5h):</span> R$ {(parseFloat(valorHora) * 0.5).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este perfil? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePerfil}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
