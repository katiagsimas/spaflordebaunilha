import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/LoadingState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Info, Power, PowerOff, Search, Download, Filter, Plus, Edit, Trash2, Lock } from 'lucide-react';
import * as XLSX from 'xlsx';
import { BackButton } from '@/components/BackButton';
import { PageHeader } from '@/components/PageHeader';
import { CategoriaPlanoContasAutocomplete } from '@/components/CategoriaPlanoContasAutocomplete';

export default function PlanoContas() {
  const [planos, setPlanos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  // Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [categoriaId, setCategoriaId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [codigoSugerido, setCodigoSugerido] = useState('');
  const [codigoEstruturadoSugerido, setCodigoEstruturadoSugerido] = useState('');

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar categorias ativas (do usuário OU padrão do sistema)
      const { data: dataCategorias, error: errorCat } = await supabase
        .from('categorias_plano_contas')
        .select('*')
        .or(`user_id.eq.${user.id},padrao_sistema.eq.true`)
        .eq('ativo', true)
        .order('ordem');

      if (errorCat) throw errorCat;
      setCategorias(dataCategorias || []);

      // Verificar se já tem planos
      const { data: planosExistentes, error: errorVerif } = await supabase
        .from('plano_contas')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (errorVerif) throw errorVerif;

      // Se não tem, criar padrão
      if (!planosExistentes || planosExistentes.length === 0) {
        console.log('Criando planos padrão...');
        const { error: errorCriar } = await supabase.rpc('criar_planos_contas_padrao', {
          p_user_id: user.id
        });

        if (errorCriar) {
          console.error('Erro ao criar planos padrão:', errorCriar);
        }
      }

      // Buscar planos (do usuário OU padrão do sistema)
      const { data: dataPlanos, error: errorPlanos } = await supabase
        .from('plano_contas')
        .select(`
          *,
          categoria:categorias_plano_contas (
            id,
            codigo,
            descricao,
            indicador,
            faixa_dre
          )
        `)
        .or(`user_id.eq.${user.id},padrao_sistema.eq.true`)
        .order('codigo_estruturado');

      if (errorPlanos) throw errorPlanos;
      setPlanos(dataPlanos || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar planos
  const planosFiltrados = useMemo(() => {
    let resultado = [...planos];

    // Busca
    if (termoBusca.trim()) {
      const termo = termoBusca.toLowerCase();
      resultado = resultado.filter(p => 
        p.codigo_estruturado.toLowerCase().includes(termo) ||
        p.descricao.toLowerCase().includes(termo) ||
        p.categoria?.descricao.toLowerCase().includes(termo)
      );
    }

    // Categoria
    if (filtroCategoria !== 'todos') {
      resultado = resultado.filter(p => p.categoria_id === filtroCategoria);
    }

    // Status
    if (filtroStatus !== 'todos') {
      const ativo = filtroStatus === 'ativo';
      resultado = resultado.filter(p => p.ativo === ativo);
    }

    // Tipo
    if (filtroTipo !== 'todos') {
      const ePadrao = filtroTipo === 'padrao';
      resultado = resultado.filter(p => p.e_padrao === ePadrao);
    }

    // Ordenar numericamente por código estruturado (ex: 1.01, 1.02, 2.01, 10.01)
    resultado.sort((a, b) => {
      const [catA, seqA] = a.codigo_estruturado.split('.').map(Number);
      const [catB, seqB] = b.codigo_estruturado.split('.').map(Number);
      
      // Primeiro compara categoria
      if (catA !== catB) return catA - catB;
      
      // Depois compara sequencial
      return seqA - seqB;
    });

    return resultado;
  }, [planos, termoBusca, filtroCategoria, filtroStatus, filtroTipo]);

  const handleAbrirModal = async (plano = null) => {
    if (plano) {
      // Bloquear edição de contas padrão do sistema
      if (plano.padrao_sistema) {
        toast.error('Contas padrão do sistema não podem ser editadas. Use o botão de ativar/desativar.');
        return;
      }
      // Editar
      setEditando(plano);
      setCategoriaId(plano.categoria_id);
      setDescricao(plano.descricao);
      setCodigoSugerido('');
      setCodigoEstruturadoSugerido('');
    } else {
      // Criar novo
      setEditando(null);
      setCategoriaId('');
      setDescricao('');
      setCodigoSugerido('');
      setCodigoEstruturadoSugerido('');
    }
    setModalAberto(true);
  };

  const handleCategoriaChange = async (catId) => {
    setCategoriaId(catId);

    // Gerar códigos tanto para novo quanto para edição (se categoria mudou)
    if (catId && (!editando || editando.categoria_id !== catId)) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Gerar código simples (apenas para novos)
        if (!editando) {
          const { data: codigo } = await supabase.rpc('gerar_proximo_codigo_plano', {
            p_user_id: user.id
          });
          setCodigoSugerido(codigo?.toString() || '');
        }

        // Gerar código estruturado (para novo e edição)
        const { data: codigoEst } = await supabase.rpc('gerar_proximo_codigo_estruturado', {
          p_user_id: user.id,
          p_categoria_id: catId
        });

        setCodigoEstruturadoSugerido(codigoEst || '');
      } catch (error) {
        console.error('Erro ao gerar códigos:', error);
      }
    }
  };

  const handleSalvar = async () => {
    try {
      if (!descricao.trim()) {
        toast.error('Informe a descrição!');
        return;
      }

      if (!categoriaId) {
        toast.error('Selecione a categoria!');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      if (editando) {
        // Atualizar
        const updateData: any = {
          descricao: descricao.trim(),
          categoria_id: categoriaId,
        };

        // Se categoria mudou e há código estruturado sugerido, atualizar também
        if (editando.categoria_id !== categoriaId && codigoEstruturadoSugerido) {
          // Verificar se o novo código já existe
          const { data: existente } = await supabase
            .from('plano_contas')
            .select('id')
            .eq('user_id', user.id)
            .eq('codigo_estruturado', codigoEstruturadoSugerido)
            .neq('id', editando.id)
            .maybeSingle();

          if (existente) {
            throw new Error('O código estruturado gerado já existe. Tente novamente.');
          }

          updateData.codigo_estruturado = codigoEstruturadoSugerido;
        }

        const { error } = await supabase
          .from('plano_contas')
          .update(updateData)
          .eq('id', editando.id);

        if (error) throw error;

        toast.success(editando.categoria_id !== categoriaId 
          ? `Plano atualizado! Novo código: ${codigoEstruturadoSugerido}`
          : 'Plano de contas atualizado!');
      } else {
        // Criar novo
        const { error } = await supabase
          .from('plano_contas')
          .insert({
            user_id: user.id,
            categoria_id: categoriaId,
            codigo: parseInt(codigoSugerido),
            codigo_estruturado: codigoEstruturadoSugerido,
            descricao: descricao.trim(),
            e_padrao: false,
            ativo: true,
          });

        if (error) {
          if (error.code === '23505') {
            throw new Error('Já existe um plano com este código!');
          }
          throw error;
        }

        toast.success(`Plano criado: ${codigoEstruturadoSugerido}`);
      }

      setModalAberto(false);
      fetchDados();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error(error.message);
    }
  };

  const handleToggleAtivo = async (id, ativoAtual) => {
    try {
      const novoStatus = !ativoAtual;

      const { error } = await supabase
        .from('plano_contas')
        .update({ ativo: novoStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(novoStatus ? 'Plano reativado!' : 'Plano desativado.');
      fetchDados();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Não foi possível alterar o status.');
    }
  };

  const handleDeletar = async (id, ePadrao, padraoSistema) => {
    try {
      if (ePadrao || padraoSistema) {
        toast.error('Planos padrão do sistema não podem ser deletados. Use o botão de ativar/desativar.');
        return;
      }

      if (!confirm('Deletar este plano de contas?')) return;

      const { error } = await supabase
        .from('plano_contas')
        .delete()
        .eq('id', id)
        .eq('e_padrao', false)
        .eq('padrao_sistema', false);

      if (error) {
        if (error.code === '23503') {
          throw new Error('Este plano está sendo usado e não pode ser deletado.');
        }
        throw error;
      }

      toast.success('Plano deletado com sucesso!');
      fetchDados();
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error.message);
    }
  };

  const handleExportar = () => {
    try {
      const dados = planosFiltrados.map(p => ({
        'Tipo': p.padrao_sistema ? 'Sistema' : (p.e_padrao ? 'Padrão' : 'Customizado'),
        'Código': p.codigo,
        'Código Estruturado': p.codigo_estruturado,
        'Descrição': p.descricao,
        'Categoria': p.categoria?.descricao || '',
        'Indicador': p.categoria?.indicador || '',
        'Faixa DRE': p.categoria?.faixa_dre || '',
        'Status': p.ativo ? 'Ativo' : 'Inativo',
      }));

      const ws = XLSX.utils.json_to_sheet(dados);
      ws['!cols'] = [
        { wch: 12 }, { wch: 10 }, { wch: 18 }, 
        { wch: 35 }, { wch: 30 }, { wch: 12 }, 
        { wch: 25 }, { wch: 10 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Plano de Contas');
      
      const hoje = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Plano_Contas_${hoje}.xlsx`);

      toast.success('Planilha exportada com sucesso!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Não foi possível exportar.');
    }
  };

  const handleLimparFiltros = () => {
    setTermoBusca('');
    setFiltroCategoria('todos');
    setFiltroStatus('todos');
    setFiltroTipo('todos');
  };

  const getBadgeIndicador = (indicador) => {
    if (indicador === 'Credito') {
      return <Badge className="bg-green-100 text-green-700 border-green-300">Crédito</Badge>;
    }
    return <Badge className="bg-red-100 text-red-700 border-red-300">Débito</Badge>;
  };

  const filtrosAtivos = [
    termoBusca.trim() !== '',
    filtroCategoria !== 'todos',
    filtroStatus !== 'todos',
    filtroTipo !== 'todos',
  ].filter(Boolean).length;

  if (loading) return <LoadingState message="Carregando Plano de Contas" submessage="Organizando suas contas..." />;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Plano de Contas"
        description="Contas detalhadas para classificação de lançamentos financeiros"
        backButton={<BackButton to="/configuracoes/financeiro" />}
      />

      {/* Alerts */}
      <div className="space-y-3">
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            O sistema criou automaticamente {planos.filter(p => p.e_padrao).length} planos de contas padrão 
            para confeitaria. Você pode criar planos personalizados conforme sua necessidade.
          </AlertDescription>
        </Alert>

        {planos.filter(p => p.padrao_sistema).length > 0 && (
          <Alert className="bg-amber-50 border-amber-200">
            <Lock className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              <strong>{planos.filter(p => p.padrao_sistema).length} contas do sistema</strong> estão disponíveis para todos os usuários. 
              Essas contas são protegidas e só podem ser habilitadas ou desabilitadas.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Botão Criar */}
      <div className="flex justify-center">
        <Button onClick={() => handleAbrirModal()} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Adicionar Plano de Contas
        </Button>
      </div>

      {/* Filtros */}
      <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Filtros</h3>
            {filtrosAtivos > 0 && (
              <Badge variant="secondary">{filtrosAtivos} ativo(s)</Badge>
            )}
          </div>
          {filtrosAtivos > 0 && (
            <Button variant="ghost" size="sm" onClick={handleLimparFiltros}>
              Limpar Filtros
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Busca */}
          <div className="space-y-2">
            <Label>Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Código ou descrição..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="padrao">Padrão</SelectItem>
                <SelectItem value="customizado">Customizados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                {categorias.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.codigo} - {cat.descricao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Mostrando <strong>{planosFiltrados.length}</strong> de <strong>{planos.length}</strong> plano(s)
          </div>
          <Button onClick={handleExportar} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Tipo</TableHead>
              <TableHead className="w-28">Código Estrut.</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="w-28">Indicador</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="text-right w-40">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {planosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {termoBusca || filtrosAtivos > 0 
                    ? 'Nenhum plano encontrado.' 
                    : 'Nenhum plano cadastrado.'}
                </TableCell>
              </TableRow>
            ) : (
              planosFiltrados.map(plano => (
                <TableRow 
                  key={plano.id}
                  className={!plano.ativo ? 'opacity-50 bg-muted/50' : ''}
                >
                  <TableCell>
                    {plano.padrao_sistema ? (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                        Sistema
                      </Badge>
                    ) : plano.e_padrao ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                        Padrão
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                        Custom
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono font-bold">
                    {plano.codigo_estruturado}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{plano.descricao}</span>
                      {plano.padrao_sistema && (
                        <Badge variant="secondary" className="text-xs">
                          🔒 Protegido
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {plano.categoria?.codigo} - {plano.categoria?.descricao}
                  </TableCell>
                  <TableCell>{getBadgeIndicador(plano.categoria?.indicador)}</TableCell>
                  <TableCell>
                    {plano.ativo ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
                        Inativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {plano.padrao_sistema ? (
                        // Apenas toggle ativo/inativo para contas padrão do sistema
                        <Button
                          variant={plano.ativo ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleToggleAtivo(plano.id, plano.ativo)}
                          title={plano.ativo ? 'Desativar conta' : 'Ativar conta'}
                          className="gap-2"
                        >
                          {plano.ativo ? (
                            <>
                              <PowerOff className="h-4 w-4" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <Power className="h-4 w-4" />
                              Ativar
                            </>
                          )}
                        </Button>
                      ) : (
                        // Menu completo para contas personalizadas
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAbrirModal(plano)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!plano.e_padrao && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletar(plano.id, plano.e_padrao, plano.padrao_sistema)}
                              title="Deletar"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleAtivo(plano.id, plano.ativo)}
                            title={plano.ativo ? 'Desativar' : 'Ativar'}
                          >
                            {plano.ativo ? (
                              <PowerOff className="h-4 w-4 text-red-600" />
                            ) : (
                              <Power className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editando ? 'Editar Plano de Contas' : 'Adicionar Plano de Contas'}
            </DialogTitle>
            <DialogDescription>
              {editando 
                ? 'Edite os dados do plano' 
                : 'Crie um plano personalizado'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!editando && codigoEstruturadoSugerido && (
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <strong>Código gerado:</strong> {codigoEstruturadoSugerido}
                </AlertDescription>
              </Alert>
            )}

            {editando && (
              <div className="p-3 bg-muted rounded-lg">
                <Label className="text-xs text-muted-foreground">Código Estruturado Atual</Label>
                <p className="font-mono font-bold text-lg">{editando.codigo_estruturado}</p>
                {codigoEstruturadoSugerido && codigoEstruturadoSugerido !== editando.codigo_estruturado && (
                  <div className="mt-2 pt-2 border-t">
                    <Label className="text-xs text-muted-foreground">Novo Código (após mudar categoria)</Label>
                    <p className="font-mono font-bold text-lg text-blue-600">{codigoEstruturadoSugerido}</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Categoria *</Label>
              <CategoriaPlanoContasAutocomplete
                value={categoriaId}
                categorias={categorias}
                onSelect={handleCategoriaChange}
                placeholder="Selecione uma categoria..."
              />
              {editando && (
                <p className="text-xs text-muted-foreground">
                  💡 Ao alterar a categoria, o código estruturado será recalculado automaticamente
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input
                placeholder="Ex: Vendas Online"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar}>
              {editando ? 'Atualizar' : 'Criar Plano'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
