import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { useCategoriasEstoque } from '@/hooks/useCategoriasEstoque';
import { Plus, Edit, Trash2, Info, Search, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

export default function TiposInsumosOutros() {
  const { toast } = useToast();
  const { categorias, loading: loadingCategorias } = useCategoriasEstoque();
  const [tipos, setTipos] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [descricao, setDescricao] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [unidadeId, setUnidadeId] = useState('');
  const [categoriaEstoqueId, setCategoriaEstoqueId] = useState('');
  const [controlarEstoque, setControlarEstoque] = useState(false);

  useEffect(() => {
    fetchTipos();
    fetchUnidades();
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
          categoria_estoque_id,
          controlar_estoque,
          unidade_medida:unidades_medida (
            id,
            nome,
            sigla
          )
        `)
        .eq('usuario_id', user.id)
        .eq('tipo', 'outros')
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

  const handleAbrirModal = (tipo?: any) => {
    if (tipo) {
      setEditando(tipo);
      setDescricao(tipo.descricao);
      setQuantidade(tipo.quantidade_embalagem?.toString() || '');
      setUnidadeId(tipo.unidade_medida?.id || '');
      setCategoriaEstoqueId(tipo.categoria_estoque_id || '');
      setControlarEstoque(tipo.controlar_estoque || false);
    } else {
      setEditando(null);
      setDescricao('');
      setQuantidade('');
      setUnidadeId('');
      setCategoriaEstoqueId('');
      setControlarEstoque(false);
    }
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    try {
      if (!descricao || !quantidade || !unidadeId) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Preencha todos os campos obrigatórios',
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dadosTipo = {
        usuario_id: user.id,
        tipo: 'outros',
        descricao,
        quantidade_embalagem: parseFloat(quantidade),
        unidade_medida_id: unidadeId,
        categoria_estoque_id: categoriaEstoqueId || null,
        controlar_estoque: controlarEstoque,
      };

      let error;

      if (editando) {
        const result = await supabase
          .from('tipos_insumos')
          .update(dadosTipo)
          .eq('id', editando.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('tipos_insumos')
          .insert(dadosTipo);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: editando ? 'Item atualizado com sucesso!' : 'Item cadastrado com sucesso!',
      });

      setModalAberto(false);
      fetchTipos();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error.message,
      });
    }
  };

  const handleExcluir = async (id: string) => {
    try {
      // Verificar se o tipo está sendo usado em algum item ou ingrediente
      const { data: itensUsando, error: errorItens } = await supabase
        .from('itens')
        .select('id')
        .eq('tipo', 'outros')
        .limit(1);

      if (errorItens) throw errorItens;

      if (itensUsando && itensUsando.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Não é possível excluir',
          description: 'Este item está sendo usado no estoque.',
        });
        return;
      }

      // Confirmar exclusão
      if (!confirm('Tem certeza que deseja excluir este item?')) {
        return;
      }

      const { error } = await supabase
        .from('tipos_insumos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Item excluído com sucesso!',
      });

      fetchTipos();
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: error.message,
      });
    }
  };

  const handleExportarExcel = () => {
    const dadosExportar = tiposFiltrados.map(tipo => ({
      'Descrição': tipo.descricao,
      'Quantidade por Embalagem': tipo.quantidade_embalagem,
      'Unidade': tipo.unidade_medida?.sigla || '',
      'Categoria': categorias.find(c => c.id === tipo.categoria_estoque_id)?.nome || 'Sem categoria',
      'Controlar Estoque': tipo.controlar_estoque ? 'Sim' : 'Não',
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Outros');
    XLSX.writeFile(wb, 'outros.xlsx');

    toast({
      title: 'Sucesso',
      description: 'Dados exportados com sucesso!',
    });
  };

  const tiposFiltrados = tipos.filter(tipo =>
    tipo.descricao?.toLowerCase().includes(busca.toLowerCase())
  );

  if (loading || loadingCategorias) {
    return <LoadingState message="Carregando tipos de outros insumos..." />;
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Como funcionam os Outros Insumos?</AlertTitle>
        <AlertDescription>
          Aqui você cadastra os tipos base de outros insumos (ex: Papel Toalha 1 rolo, Saco de Lixo 100un).
          Depois, você pode adicionar marcas e preços diferentes deste mesmo tipo na Precificação.
        </AlertDescription>
      </Alert>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={() => handleAbrirModal()} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Outro Insumo
        </Button>
        <Button onClick={handleExportarExcel} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Excel
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Qtd. por Embalagem</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Controlar Estoque</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiposFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum item cadastrado
                </TableCell>
              </TableRow>
            ) : (
              tiposFiltrados.map((tipo) => (
                <TableRow key={tipo.id}>
                  <TableCell className="font-medium">{tipo.descricao}</TableCell>
                  <TableCell>{tipo.quantidade_embalagem}</TableCell>
                  <TableCell>{tipo.unidade_medida?.sigla}</TableCell>
                  <TableCell>
                    {categorias.find(c => c.id === tipo.categoria_estoque_id)?.nome || 'Sem categoria'}
                  </TableCell>
                  <TableCell>
                    {tipo.controlar_estoque ? 'Sim' : 'Não'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
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
                        onClick={() => handleExcluir(tipo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
            <DialogTitle>
              {editando ? 'Editar Outro Insumo' : 'Novo Outro Insumo'}
            </DialogTitle>
            <DialogDescription>
              Cadastre os tipos base de outros insumos (ex: Papel Toalha 1 rolo).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="descricao">
                Descrição <span className="text-destructive">*</span>
              </Label>
              <Input
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Papel Toalha 1 rolo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantidade">
                  Quantidade <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quantidade"
                  type="number"
                  step="0.01"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  placeholder="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unidade">
                  Unidade de Medida <span className="text-destructive">*</span>
                </Label>
                <Select value={unidadeId} onValueChange={setUnidadeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria de Estoque</Label>
              <Select value={categoriaEstoqueId} onValueChange={setCategoriaEstoqueId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="controlar"
                checked={controlarEstoque}
                onCheckedChange={(checked) => setControlarEstoque(checked as boolean)}
              />
              <Label htmlFor="controlar" className="cursor-pointer">
                Controlar estoque deste item
              </Label>
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
