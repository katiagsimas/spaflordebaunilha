import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Ban, CheckCircle } from "lucide-react";
import { useTiposEmbalagens, TipoEmbalagem } from "@/hooks/useTiposEmbalagens";
import { useUnidadesMedida } from "@/hooks/useUnidadesMedida";
import { BackButton } from "@/components/BackButton";
import { formatarNumero } from "@/lib/utils";
import { validarDuplicataTipoInsumo } from "@/utils/validacaoDuplicatas";
import { toast } from "sonner";

type FormData = {
  descricao: string;
  quantidade_embalagem: string;
  unidade_medida_id: string;
};

export default function TiposInsumosEmbalagens() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativos' | 'inativos'>('ativos');

  const [formData, setFormData] = useState<FormData>({
    descricao: "",
    quantidade_embalagem: "",
    unidade_medida_id: "",
  });

  const { tiposEmbalagens, isLoading, createTipoEmbalagem, updateTipoEmbalagem, toggleAtivo } = useTiposEmbalagens();
  const { unidades: unidadesMedida } = useUnidadesMedida();

  // Filtrar apenas unidades ativas
  const unidadesAtivas = unidadesMedida.filter(u => u.ativo !== false);

  const resetForm = () => {
    setFormData({
      descricao: "",
      quantidade_embalagem: "",
      unidade_medida_id: "",
    });
    setEditandoId(null);
    setDialogOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.descricao.trim() || !formData.quantidade_embalagem || !formData.unidade_medida_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const quantidadeNum = parseFloat(formData.quantidade_embalagem);
    if (quantidadeNum <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }

    try {
      // Validar duplicata INTELIGENTE (combinação completa)
      await validarDuplicataTipoInsumo({
        tabela: 'tipos_embalagens',
        descricao: formData.descricao,
        quantidade_embalagem: quantidadeNum,
        unidade_medida_id: formData.unidade_medida_id,
        idAtual: editandoId || undefined,
      });

      const data = {
        descricao: formData.descricao.trim(),
        quantidade_embalagem: quantidadeNum,
        unidade_medida_id: formData.unidade_medida_id,
      };

      if (editandoId) {
        updateTipoEmbalagem.mutate({ id: editandoId, ...data }, {
          onSuccess: resetForm,
        });
      } else {
        const qtdFormatada = quantidadeNum.toLocaleString('pt-BR');
        createTipoEmbalagem.mutate(data, {
          onSuccess: () => {
            toast.success(`"${formData.descricao}" (${qtdFormatada}) cadastrado!`);
            resetForm();
          },
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar tipo de embalagem', {
        duration: 6000,
      });
    }
  };

  const handleEdit = (item: TipoEmbalagem) => {
    setFormData({
      descricao: item.descricao,
      quantidade_embalagem: item.quantidade_embalagem.toString(),
      unidade_medida_id: item.unidade_medida_id,
    });
    setEditandoId(item.id);
    setDialogOpen(true);
  };

  const handleToggleAtivo = (item: TipoEmbalagem) => {
    const novoStatus = !item.ativo;
    
    if (!novoStatus) {
      if (!confirm(`Desabilitar "${item.descricao}"?\n\nEste tipo não poderá mais ser selecionado em novos cadastros.`)) {
        return;
      }
    } else {
      if (!confirm(`Reativar "${item.descricao}"?`)) {
        return;
      }
    }

    toggleAtivo.mutate({ id: item.id, ativo: novoStatus });
  };

  const dadosFiltrados = tiposEmbalagens.filter(item => {
    if (filtroStatus === 'ativos') return item.ativo !== false;
    if (filtroStatus === 'inativos') return item.ativo === false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton to="/configuracoes/tipos-insumos" />
        <div className="flex-1">
          <PageHeader
            title="Tipos de Embalagens"
            description="Configure os tipos padrão de embalagens"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 flex-1">
              <CardTitle>Tipos de Embalagens</CardTitle>
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
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Qtd. Embalagem</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : dadosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {filtroStatus === 'inativos' ? 'Nenhum tipo inativo' : 'Nenhum registro encontrado'}
                  </TableCell>
                </TableRow>
              ) : (
                dadosFiltrados.map((item) => {
                  const unidade = unidadesMedida.find((u) => u.id === item.unidade_medida_id);
                  return (
                    <TableRow 
                      key={item.id}
                      className={item.ativo === false ? 'opacity-50 bg-muted/30' : ''}
                    >
                      <TableCell>{item.descricao}</TableCell>
                      <TableCell>{formatarNumero(item.quantidade_embalagem)}</TableCell>
                      <TableCell>{unidade?.sigla || "-"}</TableCell>
                      <TableCell>
                        {item.ativo !== false ? (
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {item.ativo !== false ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleAtivo(item)}
                            title="Desabilitar"
                          >
                            <Ban className="h-4 w-4 text-orange-500" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleAtivo(item)}
                            title="Reativar"
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editandoId ? "Editar" : "Novo"} Tipo de Embalagem
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  placeholder="Ex: Caixa de Bolo"
                  required
                />
              </div>
              <div>
                <Label htmlFor="quantidade">Quantidade na Embalagem *</Label>
                <Input
                  id="quantidade"
                  type="number"
                  step="0.001"
                  value={formData.quantidade_embalagem}
                  onChange={(e) =>
                    setFormData({ ...formData, quantidade_embalagem: e.target.value })
                  }
                  placeholder="Ex: 1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="unidade">Unidade de Medida *</Label>
                <Select
                  value={formData.unidade_medida_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, unidade_medida_id: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unidadesAtivas.map((unidade) => (
                      <SelectItem key={unidade.id} value={unidade.id}>
                        {unidade.nome} ({unidade.sigla})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit">
                {editandoId ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
