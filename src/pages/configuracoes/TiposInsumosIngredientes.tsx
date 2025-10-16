import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Edit, Ban, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import { useTiposInsumos, TipoInsumo } from "@/hooks/useTiposInsumos";
import { useUnidadesMedida } from "@/hooks/useUnidadesMedida";
import { BackButton } from "@/components/BackButton";
import { formatarNumero } from "@/lib/utils";
import { reorganizarCodigos, verificarBuracosSequencia } from "@/utils/reorganizarCodigos";
import { toast } from "sonner";

type FormData = {
  descricao: string;
  quantidade_embalagem: string;
  unidade_medida_id: string;
};

export default function TiposInsumosIngredientes() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativos' | 'inativos'>('ativos');
  const [verificando, setVerificando] = useState(false);
  const [reorganizando, setReorganizando] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    descricao: "",
    quantidade_embalagem: "",
    unidade_medida_id: "",
  });

  const { tiposInsumos, isLoading, createTipoInsumo, updateTipoInsumo, toggleAtivo } = useTiposInsumos();
  const { unidades: unidadesMedida } = useUnidadesMedida();

  // Filtrar apenas unidades ativas
  const unidadesAtivas = unidadesMedida.filter(u => u.ativo !== false);

  // Verificação automática ao carregar
  useEffect(() => {
    if (!isLoading) {
      verificarEReorganizarSeNecessario();
    }
  }, [isLoading]);

  const verificarEReorganizarSeNecessario = async () => {
    setVerificando(true);
    
    try {
      const temBuracos = await verificarBuracosSequencia('tipos_insumos');
      
      if (temBuracos) {
        console.log('⚠️ Sequência com buracos detectada. Reorganizando...');
        
        const resultado = await reorganizarCodigos('tipos_insumos', 'descricao');
        
        if (resultado.sucesso) {
          toast.success('✅ Sequência de códigos corrigida automaticamente.');
        }
      }
    } catch (error) {
      console.error('Erro na verificação:', error);
    } finally {
      setVerificando(false);
    }
  };

  const handleReorganizarManualmente = async () => {
    const confirmou = confirm(
      'Reorganizar códigos?\n\n' +
      'Todos os códigos serão reorganizados sequencialmente (001, 002, 003...) ' +
      'eliminando "buracos" de itens deletados.\n\n' +
      'A reorganização será feita em ordem alfabética por descrição.'
    );
    
    if (!confirmou) return;
    
    setReorganizando(true);
    
    try {
      const resultado = await reorganizarCodigos('tipos_insumos', 'descricao');
      
      if (resultado.sucesso) {
        toast.success(`✅ ${resultado.mensagem}`);
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Não foi possível reorganizar.');
    } finally {
      setReorganizando(false);
    }
  };

  const resetForm = () => {
    setFormData({
      descricao: "",
      quantidade_embalagem: "",
      unidade_medida_id: "",
    });
    setEditandoId(null);
    setDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      descricao: formData.descricao,
      quantidade_embalagem: parseFloat(formData.quantidade_embalagem),
      unidade_medida_id: formData.unidade_medida_id,
    };

    if (editandoId) {
      updateTipoInsumo.mutate({ id: editandoId, ...data }, {
        onSuccess: resetForm,
      });
    } else {
      createTipoInsumo.mutate(data, {
        onSuccess: resetForm,
      });
    }
  };

  const handleEdit = (item: TipoInsumo) => {
    setFormData({
      descricao: item.descricao,
      quantidade_embalagem: item.quantidade_embalagem.toString(),
      unidade_medida_id: item.unidade_medida_id,
    });
    setEditandoId(item.id);
    setDialogOpen(true);
  };

  const handleToggleAtivo = (item: TipoInsumo) => {
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

  const dadosFiltrados = tiposInsumos.filter(item => {
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
            title="Tipos de Ingredientes"
            description="Configure os tipos padrão de ingredientes"
          />
        </div>
      </div>

      {verificando && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle>Verificando códigos...</AlertTitle>
          <AlertDescription>
            Aguarde enquanto verificamos a integridade dos códigos.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 flex-1">
              <CardTitle>Tipos de Ingredientes</CardTitle>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReorganizarManualmente}
                disabled={reorganizando || verificando}
                title="Reorganizar códigos em ordem alfabética"
              >
                <RefreshCw className={`h-4 w-4 ${reorganizando ? 'animate-spin' : ''}`} />
              </Button>
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
                <TableHead>Código</TableHead>
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
                  <TableCell colSpan={6} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : dadosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
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
                      <TableCell className="font-mono">{item.codigo}</TableCell>
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
              {editandoId ? "Editar" : "Novo"} Tipo de Ingrediente
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
                  placeholder="Ex: Farinha de Trigo"
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
                  placeholder="Ex: 1000"
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
