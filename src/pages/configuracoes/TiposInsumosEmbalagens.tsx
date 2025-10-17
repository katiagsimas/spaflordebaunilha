import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Edit, Trash2, Info } from "lucide-react";
import { useTiposEmbalagens, TipoEmbalagem } from "@/hooks/useTiposEmbalagens";
import { useUnidadesMedida } from "@/hooks/useUnidadesMedida";
import { BackButton } from "@/components/BackButton";
import { formatarNumero } from "@/lib/utils";
import { validarDuplicataTipoInsumo } from "@/utils/validacaoDuplicatas";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type FormData = {
  descricao: string;
  quantidade_embalagem: string;
  unidade_medida_id: string;
};

export default function TiposInsumosEmbalagens() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    descricao: "",
    quantidade_embalagem: "",
    unidade_medida_id: "",
  });

  const { tiposEmbalagens, isLoading, createTipoEmbalagem, updateTipoEmbalagem, deleteTipoEmbalagem } = useTiposEmbalagens();
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

  const handleExcluir = async (id: string, descricao: string) => {
    try {
      // 1. Verificar se está em uso
      const { data: emUso, error: erroVerificacao } = await supabase
        .from('embalagens')
        .select('id')
        .eq('tipo_embalagem_id', id);

      if (erroVerificacao) throw erroVerificacao;

      // 2. Se está em uso, bloquear
      if (emUso && emUso.length > 0) {
        toast.error(
          `⚠️ Não é possível excluir\n\nO tipo "${descricao}" está sendo usado em ${emUso.length} embalagem(ns) cadastrada(s).\n\nPara excluir este tipo, primeiro remova todas as embalagens que o utilizam.`,
          { duration: 8000 }
        );
        return;
      }

      // 3. Confirmar exclusão
      const confirmacao = window.confirm(
        `Tem certeza que deseja excluir "${descricao}"?\n\nEsta ação é permanente e não pode ser desfeita.`
      );

      if (!confirmacao) return;

      // 4. Excluir permanentemente
      deleteTipoEmbalagem.mutate(id, {
        onSuccess: () => {
          toast.success(`✅ Tipo excluído: "${descricao}" foi removido com sucesso.`);
        }
      });

    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      toast.error(error.message || 'Não foi possível excluir o tipo.');
    }
  };

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

      <Alert className="bg-blue-50 border-blue-200 mb-4">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle>ℹ️ Como funciona a exclusão</AlertTitle>
        <AlertDescription>
          Você pode excluir tipos que <strong>não estão sendo usados</strong> em nenhuma embalagem.
          Se um tipo estiver em uso, o sistema bloqueará a exclusão até que você remova todas as receitas que o utilizam.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tipos de Embalagens</CardTitle>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Qtd. Embalagem</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : tiposEmbalagens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhum tipo cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                tiposEmbalagens.map((item) => {
                  const unidade = unidadesMedida.find((u) => u.id === item.unidade_medida_id);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.descricao}</TableCell>
                      <TableCell>{formatarNumero(item.quantidade_embalagem)}</TableCell>
                      <TableCell>{unidade?.sigla || "-"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExcluir(item.id, item.descricao)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
