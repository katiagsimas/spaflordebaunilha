import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUnidadesMedida, UnidadeMedida } from "@/hooks/useUnidadesMedida";
import { Plus, Pencil, Ban, CheckCircle, Ruler } from "lucide-react";
import { toast } from "sonner";
import { useGlobalLoading } from "@/contexts/GlobalLoadingContext";


export default function UnidadesMedida() {
  const { showLoading, hideLoading } = useGlobalLoading();
  const { unidades, loading, createUnidade, updateUnidade, toggleAtivo, refetch } = useUnidadesMedida();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnidade, setEditingUnidade] = useState<UnidadeMedida | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativos' | 'inativos'>('ativos');

  const [formData, setFormData] = useState({
    nome: "",
    sigla: "",
  });

  useEffect(() => {
    if (loading) {
      showLoading("Carregando unidades de medida...");
    } else {
      hideLoading();
    }
  }, [loading, showLoading, hideLoading]);

  useEffect(() => {
    if (editingUnidade) {
      setFormData({
        nome: editingUnidade.nome,
        sigla: editingUnidade.sigla,
      });
      setIsDialogOpen(true);
    }
  }, [editingUnidade]);

  if (loading) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim() || !formData.sigla.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (editingUnidade) {
        await updateUnidade(editingUnidade.id, {
          nome: formData.nome.trim(),
          sigla: formData.sigla.trim(),
        });
      } else {
        await createUnidade({
          nome: formData.nome.trim(),
          sigla: formData.sigla.trim(),
        });
      }
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar unidade');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      sigla: "",
    });
    setEditingUnidade(null);
    setIsDialogOpen(false);
  };

  const handleToggleAtivo = async (unidade: UnidadeMedida) => {
    // Impedir desabilitar unidades padrão
    if (unidade.e_padrao && unidade.ativo !== false) {
      toast.error('Não é possível desabilitar unidades padrão do sistema');
      return;
    }

    const novoStatus = !unidade.ativo;
    
    if (!novoStatus) {
      // Desabilitando - confirmar
      if (!confirm(`Desabilitar "${unidade.nome}"?\n\nEsta unidade não poderá mais ser selecionada em novos cadastros.`)) {
        return;
      }
    } else {
      // Reativando
      if (!confirm(`Reativar "${unidade.nome}"?`)) {
        return;
      }
    }

    try {
      await toggleAtivo(unidade.id, novoStatus);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar status');
    }
  };

  const handleEdit = (unidade: UnidadeMedida) => {
    setEditingUnidade(unidade);
  };

  const dadosFiltrados = unidades.filter(item => {
    if (filtroStatus === 'ativos') return item.ativo !== false;
    if (filtroStatus === 'inativos') return item.ativo === false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Unidades de Medidas"
        description="Gerencie as unidades de medida"
        backButton={<BackButton to="/configuracoes/precificacao" />}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <CardTitle>Lista de Unidades de Medida</CardTitle>
            <Select value={filtroStatus} onValueChange={(v: any) => setFiltroStatus(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativos">Ativos</SelectItem>
                <SelectItem value="inativos">Inativos</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingUnidade(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Unidade
                </Button>
              </DialogTrigger>
              <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUnidade ? "Editar Unidade" : "Nova Unidade"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Gramas, Litros, Unidades"
                    required
                    disabled={editingUnidade?.e_padrao}
                  />
                  {editingUnidade?.e_padrao && (
                    <p className="text-xs text-muted-foreground">
                      ⚠️ O nome de unidades padrão não pode ser alterado
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sigla">Sigla *</Label>
                  <Input
                    id="sigla"
                    value={formData.sigla}
                    onChange={(e) => setFormData({ ...formData, sigla: e.target.value })}
                    placeholder="Ex: g, l, un"
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingUnidade ? "Atualizar" : "Cadastrar"}
                  </Button>
                </div>
              </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {dadosFiltrados.length === 0 ? (
            <EmptyState
              icon={Ruler}
              title={filtroStatus === 'inativos' ? 'Nenhuma unidade inativa' : 'Nenhuma unidade cadastrada'}
              description={filtroStatus === 'inativos' ? 'Não há unidades desabilitadas' : 'Comece adicionando sua primeira unidade de medida'}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Abreviação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dadosFiltrados.map((unidade) => (
                    <TableRow 
                      key={unidade.id}
                      className={unidade.ativo === false ? 'opacity-50 bg-muted/30' : ''}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {unidade.nome}
                          {unidade.e_padrao && (
                            <Badge variant="secondary" className="text-xs">
                              ⭐ Padrão
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{unidade.sigla}</TableCell>
                      <TableCell>
                        {unidade.ativo !== false ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                            ✅ Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            ⚠️ Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(unidade)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {unidade.ativo !== false ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleAtivo(unidade)}
                              title={unidade.e_padrao ? "Unidades padrão não podem ser desabilitadas" : "Desabilitar"}
                              disabled={unidade.e_padrao}
                              className={unidade.e_padrao ? 'opacity-50 cursor-not-allowed' : ''}
                            >
                              <Ban className="h-4 w-4 text-orange-500" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleAtivo(unidade)}
                              title="Reativar"
                            >
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
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
    </div>
  );
}
