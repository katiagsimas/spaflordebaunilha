import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Info, Power, PowerOff, Search, Download, Filter, Plus, Edit, Trash2, MoreVertical, ArrowRight, ArrowLeft } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import * as XLSX from '@/lib/xlsxShim';
import { BackButton } from '@/components/BackButton';
import { PageHeader } from '@/components/PageHeader';
import { CategoriaPlanoContasAutocomplete } from '@/components/CategoriaPlanoContasAutocomplete';

export default function PlanoContas() {
  const navigate = useNavigate();
  const [planos, setPlanos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [resultadosPorPagina, setResultadosPorPagina] = useState('todos');

  // Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [categoriaId, setCategoriaId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [codigoSugerido, setCodigoSugerido] = useState('');
  const [codigoEstruturadoSugerido, setCodigoEstruturadoSugerido] = useState('');
  
  // Confirm Dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [contaParaExcluir, setContaParaExcluir] = useState(null);

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar categorias ativas
      const { data: dataCategorias, error: errorCat } = await supabase
        .from('categorias_plano_contas')
        .select('*')
        .eq('user_id', user.id)
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
        
        const { error: errorCriar } = await supabase.rpc('criar_planos_contas_padrao', {
          p_user_id: user.id
        });

        if (errorCriar) {
          console.error('Erro ao criar planos padrão:', errorCriar);
        }
      }

      // Buscar planos
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
        .eq('user_id', user.id)
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

  // Aplicar limite de resultados por página
  const planosPaginados = useMemo(() => {
    if (resultadosPorPagina === 'todos') {
      return planosFiltrados;
    }
    const limite = parseInt(resultadosPorPagina);
    return planosFiltrados.slice(0, limite);
  }, [planosFiltrados, resultadosPorPagina]);

  const handleAbrirModal = async (plano = null) => {
    if (plano) {
      // Editar (permite edição de planos padrão)
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

  const verificarUsoPlano = async (planoId) => {
    try {
      // Verificar em contas_receber
      const { data: contasReceber, error: errorReceber } = await supabase
        .from('contas_receber')
        .select('id')
        .eq('plano_conta_id', planoId)
        .limit(1);

      if (errorReceber) throw errorReceber;
      if (contasReceber && contasReceber.length > 0) {
        return { emUso: true, modulo: 'Contas a Receber' };
      }

      // Verificar em contas_pagar
      const { data: contasPagar, error: errorPagar } = await supabase
        .from('contas_pagar')
        .select('id')
        .eq('plano_contas_id', planoId)
        .limit(1);

      if (errorPagar) throw errorPagar;
      if (contasPagar && contasPagar.length > 0) {
        return { emUso: true, modulo: 'Contas a Pagar' };
      }

      return { emUso: false, modulo: null };
    } catch (error) {
      console.error('Erro ao verificar uso:', error);
      throw error;
    }
  };

  const handleSolicitarExclusao = (plano) => {
    setContaParaExcluir(plano);
    setConfirmOpen(true);
  };

  const handleConfirmarExclusao = async () => {
    if (!contaParaExcluir) return;

    try {
      // Verificar se está em uso
      const { emUso, modulo } = await verificarUsoPlano(contaParaExcluir.id);

      if (emUso) {
        toast.error(
          `Esta conta está sendo utilizada no módulo "${modulo}". Para removê-la, desabilite-a ao invés de excluí-la.`,
          { duration: 5000 }
        );
        setConfirmOpen(false);
        return;
      }

      // Se não está em uso, pode excluir
      const { error } = await supabase
        .from('plano_contas')
        .delete()
        .eq('id', contaParaExcluir.id);

      if (error) throw error;

      toast.success('Plano deletado com sucesso!');
      fetchDados();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Não foi possível excluir o plano de contas.');
    } finally {
      setConfirmOpen(false);
      setContaParaExcluir(null);
    }
  };

  const handleExportar = () => {
    try {
      const dados = planosFiltrados.map(p => ({
        'Tipo': p.e_padrao ? 'Padrão' : 'Customizado',
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
      {/* Navegação superior */}
      <div className="flex items-center justify-between">
        <BackButton to="/financeiro/cadastros" />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate('/financeiro/cadastros/categorias-plano-contas')}
            className="gap-2 text-muted-foreground hover:text-foreground font-body"
          >
            <ArrowLeft className="h-4 w-4" />
            Categorias Planos de Contas
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/financeiro/cadastros/juros')}
            className="gap-2 text-muted-foreground hover:text-foreground font-body"
          >
            Juros
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <PageHeader
        title="Plano de Contas"
        description="Contas detalhadas para classificação de lançamentos financeiros"
      />

      {/* Alert */}
      <Alert className="bg-cda-creme border-2 border-cda-dourado">
        <Info className="h-4 w-4 text-cda-vinho" />
        <AlertDescription className="text-cda-preto">
          O sistema criou automaticamente {planos.filter(p => p.e_padrao).length} planos de contas padrão 
          para confeitaria. Você pode criar planos personalizados conforme sua necessidade.
        </AlertDescription>
      </Alert>

      {/* Botões */}
      <div className="flex justify-between items-center gap-2">
        <Button onClick={() => handleAbrirModal()} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Adicionar Plano de Contas
        </Button>
        <Button onClick={handleExportar} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Exportar Excel
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

        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Mostrando <strong>{planosPaginados.length}</strong> de <strong>{planosFiltrados.length}</strong> plano(s)
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Resultados por página:</Label>
            <Select value={resultadosPorPagina} onValueChange={setResultadosPorPagina}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
            {planosPaginados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {termoBusca || filtrosAtivos > 0 
                    ? 'Nenhum plano encontrado.' 
                    : 'Nenhum plano cadastrado.'}
                </TableCell>
              </TableRow>
            ) : (
              planosPaginados.map(plano => (
                <TableRow 
                  key={plano.id}
                  className={!plano.ativo ? 'opacity-50 bg-muted/50' : ''}
                >
                  <TableCell>
                    {plano.e_padrao ? (
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
                  <TableCell className="font-medium">{plano.descricao}</TableCell>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleAbrirModal(plano)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleSolicitarExclusao(plano)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleAtivo(plano.id, plano.ativo)}>
                          {plano.ativo ? (
                            <>
                              <PowerOff className="mr-2 h-4 w-4" />
                              Desabilitar
                            </>
                          ) : (
                            <>
                              <Power className="mr-2 h-4 w-4" />
                              Habilitar
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirmarExclusao}
        title="Confirmar Exclusão"
        description={`Deseja realmente excluir o plano "${contaParaExcluir?.codigo_estruturado} - ${contaParaExcluir?.descricao}"?`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
      />
    </div>
  );
}
