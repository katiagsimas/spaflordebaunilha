import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getActiveGroupId } from '@/lib/activeGroup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingState } from '@/components/LoadingState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Info, Search, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from '@/lib/xlsxShim';

export default function TiposInsumosEmbalagens() {
  const { toast } = useToast();
  const [tipos, setTipos] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [descricao, setDescricao] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [unidadeId, setUnidadeId] = useState('');
  

  useEffect(() => {
    fetchTipos();
    fetchUnidades();

    // Listener para atualizar quando um novo item for criado
    const handleAtualizar = (e: CustomEvent) => {
      if (e.detail?.tipo === 'embalagem') {
        fetchTipos();
      }
    };

    window.addEventListener('tipos-insumos-atualizado' as any, handleAtualizar);
    
    return () => {
      window.removeEventListener('tipos-insumos-atualizado' as any, handleAtualizar);
    };
  }, []);

  const fetchTipos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tipos_insumos')
        .select(`
          id,
          descricao,
          quantidade_embalagem,
          unidade_medida:unidades_medida (
            id,
            nome,
            sigla
          )
        `)
        .eq('usuario_id', user.id)
        .eq('tipo', 'embalagem')
        .order('descricao');

      if (error) throw error;
      setTipos(data || []);
    } catch (error) {
      console.error('Erro ao buscar tipos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnidades = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('unidades_medida')
        .select('id, nome, sigla')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setUnidades(data || []);
    } catch (error) {
      console.error('Erro ao buscar unidades:', error);
    }
  };

  const handleAbrirModal = (tipo: any = null) => {
    if (tipo) {
      setEditando(tipo);
      setDescricao(tipo.descricao);
      setQuantidade(tipo.quantidade_embalagem.toString());
      setUnidadeId(tipo.unidade_medida.id);
      
    } else {
      setEditando(null);
      setDescricao('');
      setQuantidade('');
      setUnidadeId('');
      
    }
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    try {
      if (!descricao.trim() || !quantidade || !unidadeId) {
        toast({
          title: 'Erro',
          description: 'Preencha todos os campos obrigatórios!',
          variant: 'destructive',
        });
        return;
      }

      const qtd = parseFloat(quantidade.replace(',', '.'));
      if (qtd <= 0) {
        toast({
          title: 'Erro',
          description: 'Quantidade deve ser maior que zero!',
          variant: 'destructive',
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const dadosEmbalagem = {
        descricao: descricao.trim(),
        quantidade_embalagem: qtd,
        unidade_medida_id: unidadeId,
      };

      if (editando) {
        const { error } = await supabase
          .from('tipos_insumos')
          .update(dadosEmbalagem)
          .eq('id', editando.id);

        if (error) throw error;

        toast({
          title: '✅ Atualizado',
          description: 'Embalagem atualizada com sucesso!',
        });
      } else {
        const { error } = await supabase
          .from('tipos_insumos')
          .insert({
            ...dadosEmbalagem,
            usuario_id: user.id,
        owner_group_id: await getActiveGroupId(user.id),
            tipo: 'embalagem',
          });

        if (error) {
          if (error.code === '23505') {
            throw new Error('Esta embalagem já foi cadastrada!');
          }
          throw error;
        }

        toast({
          title: '✅ Cadastrado',
          description: 'Embalagem cadastrada com sucesso!',
        });
      }

      setModalAberto(false);
      fetchTipos();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleExcluir = async (id: string, descricao: string) => {
    try {
      const { data: emUso, error: erroVerificacao } = await supabase
        .from('embalagens')
        .select('id')
        .eq('tipo_insumo_id', id);

      if (erroVerificacao) throw erroVerificacao;

      if (emUso && emUso.length > 0) {
        alert(
          `⚠️ EXCLUSÃO BLOQUEADA!\n\n` +
          `O tipo "${descricao}" está sendo usado em ${emUso.length} embalagem(ns).\n\n` +
          `Para excluir, primeiro remova todas as embalagens que usam este tipo em:\n` +
          `Precificação > Embalagens`
        );
        return;
      }

      const confirmacao = window.confirm(
        `⚠️ EXCLUSÃO PERMANENTE\n\n` +
        `Confirma a exclusão de:\n"${descricao}"\n\n` +
        `Esta ação NÃO pode ser desfeita!`
      );

      if (!confirmacao) return;

      const { error } = await supabase
        .from('tipos_insumos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: '✅ Excluído',
        description: 'Tipo removido com sucesso!',
      });

      fetchTipos();
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleExportarExcel = () => {
    if (tiposFiltrados.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Não há dados para exportar.',
        variant: 'destructive',
      });
      return;
    }

    const dadosExport = tiposFiltrados.map((tipo) => ({
      'Descrição': tipo.descricao,
      'Quantidade': tipo.quantidade_embalagem,
      'Unidade': tipo.unidade_medida?.nome,
      
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Embalagens');
    XLSX.writeFile(wb, `tipos_embalagens_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: '✅ Exportado',
      description: 'Dados exportados com sucesso!',
    });
  };

  if (loading) return <LoadingState message="Carregando Tipos de Embalagens" submessage="Organizando categorias..." />;

  const tiposFiltrados = tipos.filter((tipo) =>
    tipo.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle>ℹ️ Como funciona</AlertTitle>
        <AlertDescription>
          Cadastre os tipos base (ex: Caixa de Papelão 1 unidade). Depois use em Precificação para adicionar marca e preço.
          Só é possível excluir tipos que não estão sendo usados.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => handleAbrirModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Embalagem
        </Button>
        <Button variant="outline" onClick={handleExportarExcel}>
          <Download className="mr-2 h-4 w-4" />
          Exportar para Excel
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Unidade</TableHead>
              
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiposFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {busca ? 'Nenhum tipo encontrado.' : 'Nenhum tipo cadastrado. Clique em "Novo Tipo" para começar.'}
                </TableCell>
              </TableRow>
            ) : (
              tiposFiltrados.map((tipo) => (
                <TableRow key={tipo.id}>
                  <TableCell className="font-medium">{tipo.descricao}</TableCell>
                  <TableCell>{tipo.quantidade_embalagem.toLocaleString('pt-BR')}</TableCell>
                  <TableCell>{tipo.unidade_medida?.nome}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAbrirModal(tipo)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExcluir(tipo.id, tipo.descricao)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Embalagem' : 'Nova Embalagem'}</DialogTitle>
            <DialogDescription>
              Cadastre o tipo base da embalagem com sua quantidade padrão
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="descricao">Nome da Embalagem *</Label>
              <Input
                id="descricao"
                placeholder="Ex: Caixa de Papelão"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantidade">Qtde na Embalagem *</Label>
                <Input
                  id="quantidade"
                  type="text"
                  placeholder="Ex: 1"
                  value={quantidade}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/[^\d,]/g, '');
                    setQuantidade(valor);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unidade">Unidade de Medida *</Label>
                <Select value={unidadeId} onValueChange={setUnidadeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map((unidade) => (
                      <SelectItem key={unidade.id} value={unidade.id}>
                        {unidade.nome} ({unidade.sigla})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar}>
              {editando ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
