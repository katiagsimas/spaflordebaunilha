import React, { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Plus, Pencil, Trash2, History, CheckCircle2, Info, Filter } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useMaoObraPerfis } from "@/hooks/useMaoObraPerfis";
import { useMaoObraHistorico } from "@/hooks/useMaoObraHistorico";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MaoDeObra() {
  const { profile, loading: loadingProfile, updateProfile } = useUserProfile();
  const { perfis, isLoading: loadingPerfis, createPerfil, updatePerfil, deletePerfil } = useMaoObraPerfis();
  const [valorHoraPadrao, setValorHoraPadrao] = useState("");
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPerfilId, setEditingPerfilId] = useState<string | null>(null);
  const [perfilNome, setPerfilNome] = useState("");
  const [perfilValor, setPerfilValor] = useState("");
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [perfilToDelete, setPerfilToDelete] = useState<string | null>(null);
  
  const [filtroPerfilId, setFiltroPerfilId] = useState("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const { historico, isLoading: loadingHistorico } = useMaoObraHistorico(filtroPerfilId, dataInicio, dataFim);

  React.useEffect(() => {
    if (profile?.valor_hora) {
      setValorHoraPadrao(profile.valor_hora.toString());
    }
  }, [profile]);

  const handleSaveValorPadrao = async () => {
    const valor = parseFloat(valorHoraPadrao);
    if (isNaN(valor) || valor <= 0) {
      toast.error("Digite um valor válido");
      return;
    }
    try {
      await updateProfile({ valor_hora: valor });
      toast.success("Valor-hora padrão atualizado!");
    } catch (error) {
      toast.error("Erro ao atualizar valor-hora");
    }
  };

  const handleOpenPerfilDialog = (perfil?: any) => {
    if (perfil) {
      setEditingPerfilId(perfil.id);
      setPerfilNome(perfil.nome);
      setPerfilValor(perfil.valor_hora.toString());
    } else {
      setEditingPerfilId(null);
      setPerfilNome("");
      setPerfilValor("");
    }
    setDialogOpen(true);
  };

  const handleSavePerfil = async () => {
    const valor = parseFloat(perfilValor);
    if (!perfilNome.trim() || isNaN(valor) || valor <= 0) {
      toast.error("Preencha todos os campos corretamente");
      return;
    }
    try {
      if (editingPerfilId) {
        updatePerfil({ id: editingPerfilId, nome: perfilNome, valor_hora: valor });
      } else {
        createPerfil({ nome: perfilNome, valor_hora: valor, ativo: true, padrao: perfis.length === 0 });
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error("Erro ao salvar perfil");
    }
  };

  const handleDeletePerfil = (id: string) => {
    setPerfilToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (perfilToDelete) {
      deletePerfil(perfilToDelete);
      setDeleteDialogOpen(false);
      setPerfilToDelete(null);
    }
  };

  const getAcaoLabel = (acao: string) => {
    const labels: Record<string, string> = {
      criado: "Criado", alterado: "Valor Alterado", desativado: "Desativado",
      reativado: "Reativado", definido_padrao: "Definido como Padrão"
    };
    return labels[acao] || acao;
  };

  const getAcaoBadge = (acao: string) => {
    const variants: Record<string, any> = {
      criado: "default", alterado: "secondary", desativado: "destructive",
      reativado: "default", definido_padrao: "default"
    };
    return variants[acao] || "secondary";
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Mão de Obra" description="Configure valores-hora para calcular custos de produção" backButton={<BackButton to="/configuracoes" />} />

      {loadingProfile || loadingPerfis ? (
        <Card><CardContent className="p-6"><p className="text-muted-foreground text-center">Carregando...</p></CardContent></Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2"><Clock className="h-5 w-5 text-cyan-600" /><CardTitle>Valor-Hora Padrão</CardTitle></div>
              <CardDescription>Se você trabalha sozinha, use apenas este valor-hora. As fichas técnicas usam este valor por padrão.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-4">
                <div className="flex-1"><Label htmlFor="valor-padrao">Valor por hora (R$)</Label><Input id="valor-padrao" type="number" step="0.01" min="0" value={valorHoraPadrao} onChange={(e) => setValorHoraPadrao(e.target.value)} placeholder="0.00" /></div>
                <Button onClick={handleSaveValorPadrao}>Salvar valor-hora</Button>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Exemplo de cálculo</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Se uma receita leva 2 horas e seu valor-hora é R$ {valorHoraPadrao || "0,00"}, o custo será: R$ {(parseFloat(valorHoraPadrao || "0") * 2).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Perfis de Mão de Obra (Avançado)</CardTitle><CardDescription>Configure diferentes valores-hora para colaboradores</CardDescription></div>
                <Button onClick={() => handleOpenPerfilDialog()}><Plus className="h-4 w-4 mr-2" />Novo Perfil</Button>
              </div>
            </CardHeader>
            <CardContent>
              {perfis.length === 0 ? (<p className="text-muted-foreground text-center py-8">Nenhum perfil cadastrado.</p>) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Valor/Hora</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {perfis.map((perfil) => (
                      <TableRow key={perfil.id}>
                        <TableCell className="font-medium">{perfil.nome}{perfil.padrao && <Badge variant="secondary" className="ml-2">Padrão</Badge>}</TableCell>
                        <TableCell>R$ {perfil.valor_hora.toFixed(2)}</TableCell>
                        <TableCell><Switch checked={perfil.ativo} onCheckedChange={() => updatePerfil({ id: perfil.id, ativo: !perfil.ativo })} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!perfil.padrao && <Button variant="outline" size="sm" onClick={() => updatePerfil({ id: perfil.id, padrao: true })}><CheckCircle2 className="h-4 w-4" /></Button>}
                            <Button variant="ghost" size="sm" onClick={() => handleOpenPerfilDialog(perfil)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeletePerfil(perfil.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2"><History className="h-5 w-5 text-purple-600" /><CardTitle>Histórico de Alterações</CardTitle></div>
              <CardDescription>Todas as mudanças nos perfis ficam registradas aqui</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div><Label htmlFor="filtro-perfil" className="text-xs">Perfil</Label><Select value={filtroPerfilId} onValueChange={setFiltroPerfilId}><SelectTrigger id="filtro-perfil"><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos os perfis</SelectItem>{perfis.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label htmlFor="data-inicio" className="text-xs">Data Início</Label><Input id="data-inicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} /></div>
                  <div><Label htmlFor="data-fim" className="text-xs">Data Fim</Label><Input id="data-fim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} /></div>
                </div>
              </div>

              {loadingHistorico ? (<p className="text-muted-foreground text-center py-8">Carregando histórico...</p>) : historico.length === 0 ? (<p className="text-muted-foreground text-center py-8">Nenhuma alteração registrada.</p>) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Data/Hora</TableHead><TableHead>Perfil</TableHead><TableHead>Ação</TableHead><TableHead>Valor Antigo</TableHead><TableHead>Valor Novo</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {historico.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{format(new Date(item.registrado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                        <TableCell className="font-medium">{item.perfil_nome}</TableCell>
                        <TableCell><Badge variant={getAcaoBadge(item.acao)}>{getAcaoLabel(item.acao)}</Badge></TableCell>
                        <TableCell>{item.valor_antigo ? `R$ ${item.valor_antigo.toFixed(2)}` : "—"}</TableCell>
                        <TableCell>{item.valor_novo ? `R$ ${item.valor_novo.toFixed(2)}` : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingPerfilId ? "Editar Perfil" : "Novo Perfil de Mão de Obra"}</DialogTitle><DialogDescription>Configure um perfil com nome e valor-hora específico</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label htmlFor="perfil-nome">Nome do Perfil</Label><Input id="perfil-nome" value={perfilNome} onChange={(e) => setPerfilNome(e.target.value)} placeholder="Ex: Confeiteiro Sênior" /></div>
            <div><Label htmlFor="perfil-valor">Valor por Hora (R$)</Label><Input id="perfil-valor" type="number" step="0.01" min="0" value={perfilValor} onChange={(e) => setPerfilValor(e.target.value)} placeholder="0.00" /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSavePerfil}>{editingPerfilId ? "Salvar" : "Criar"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir este perfil?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDelete}>Confirmar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
