import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useToast } from '@/hooks/use-toast';
import { Info, Power, PowerOff, Search, Download, Filter, Plus, Edit, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { BackButton } from '@/components/BackButton';
import * as XLSX from 'xlsx';

interface Categoria {
  id: string;
  codigo: string;
  descricao: string;
  indicador: 'Credito' | 'Debito';
  faixa_dre: string;
  ativo: boolean;
  ordem: number;
  e_padrao: boolean;
}

export default function CategoriasPlanoContas() {
  const { toast } = useToast();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroIndicador, setFiltroIndicador] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroFaixaDRE, setFiltroFaixaDRE] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  // Modal criar/editar
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [codigoSugerido, setCodigoSugerido] = useState('');
  const [descricao, setDescricao] = useState('');
  const [indicador, setIndicador] = useState('');
  const [faixaDRE, setFaixaDRE] = useState('');

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verificar se usuário já tem categorias
      const { data: categoriasExistentes, error: erroVerificacao } = await supabase
        .from('categorias_plano_contas')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (erroVerificacao) throw erroVerificacao;

      // Se não tem categorias, criar as padrão
      if (!categoriasExistentes || categoriasExistentes.length === 0) {
        console.log('Criando categorias padrão...');
        const { error: erroCriar } = await supabase.rpc('criar_categorias_plano_padrao', {
          p_user_id: user.id
        });

        if (erroCriar) {
          console.error('Erro ao criar categorias padrão:', erroCriar);
        }
      }

      // Buscar todas as categorias
      const { data, error } = await supabase
        .from('categorias_plano_contas')
        .select('*')
        .eq('user_id', user.id)
        .order('ordem');

      if (error) throw error;
      setCategorias((data || []) as Categoria[]);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as categorias.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  const categoriasFiltradas = useMemo(() => {
    let resultado = [...categorias];

    // Filtro de busca (código ou descrição)
    if (termoBusca.trim()) {
      const termo = termoBusca.toLowerCase();
      resultado = resultado.filter(cat => 
        cat.codigo.toLowerCase().includes(termo) ||
        cat.descricao.toLowerCase().includes(termo)
      );
    }

    // Filtro de indicador
    if (filtroIndicador !== 'todos') {
      resultado = resultado.filter(cat => cat.indicador === filtroIndicador);
    }

    // Filtro de status
    if (filtroStatus !== 'todos') {
      const ativo = filtroStatus === 'ativo';
      resultado = resultado.filter(cat => cat.ativo === ativo);
    }

    // Filtro de faixa DRE
    if (filtroFaixaDRE !== 'todos') {
      resultado = resultado.filter(cat => cat.faixa_dre === filtroFaixaDRE);
    }

    // Filtro de tipo (padrão/customizada)
    if (filtroTipo !== 'todos') {
      const ePadrao = filtroTipo === 'padrao';
      resultado = resultado.filter(cat => cat.e_padrao === ePadrao);
    }

    return resultado;
  }, [categorias, termoBusca, filtroIndicador, filtroStatus, filtroFaixaDRE, filtroTipo]);

  // Extrair faixas DRE únicas para o filtro
  const faixasDRE = useMemo(() => {
    const faixas = [...new Set(categorias.map(cat => cat.faixa_dre))];
    return faixas.sort();
  }, [categorias]);

  const handleAbrirModal = async (categoria: Categoria | null = null) => {
    if (categoria) {
      // Editar
      if (categoria.e_padrao) {
        toast({
          title: 'Não editável',
          description: 'Categorias padrão não podem ser editadas.',
          variant: 'destructive',
        });
        return;
      }

      setEditando(categoria);
      setDescricao(categoria.descricao);
      setIndicador(categoria.indicador);
      setFaixaDRE(categoria.faixa_dre);
      setCodigoSugerido('');
    } else {
      // Criar nova - gerar código automaticamente
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase.rpc('gerar_proximo_codigo_categoria', {
          p_user_id: user.id
        });

        if (error) {
          console.error('Erro ao gerar código:', error);
          setCodigoSugerido('200'); // Fallback
        } else {
          setCodigoSugerido(data);
        }
      } catch (error) {
        console.error('Erro:', error);
        setCodigoSugerido('200');
      }

      setEditando(null);
      setDescricao('');
      setIndicador('');
      setFaixaDRE('');
    }
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    try {
      // Validações
      if (!descricao.trim()) {
        toast({
          title: 'Erro',
          description: 'Informe a descrição da categoria!',
          variant: 'destructive',
        });
        return;
      }

      if (!indicador) {
        toast({
          title: 'Erro',
          description: 'Selecione o indicador (Crédito ou Débito)!',
          variant: 'destructive',
        });
        return;
      }

      if (!faixaDRE) {
        toast({
          title: 'Erro',
          description: 'Selecione a faixa no DRE!',
          variant: 'destructive',
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      if (editando) {
        // Atualizar categoria customizada
        const { error } = await supabase
          .from('categorias_plano_contas')
          .update({
            descricao: descricao.trim(),
            indicador,
            faixa_dre: faixaDRE,
          })
          .eq('id', editando.id)
          .eq('e_padrao', false);

        if (error) throw error;

        toast({
          title: '✅ Atualizado',
          description: 'Categoria atualizada com sucesso!',
        });
      } else {
        // Criar nova categoria com código gerado
        const codigoFinal = codigoSugerido;

        // Verificar se código já existe (segurança extra)
        const { data: existente } = await supabase
          .from('categorias_plano_contas')
          .select('id')
          .eq('user_id', user.id)
          .eq('codigo', codigoFinal)
          .maybeSingle();

        if (existente) {
          throw new Error('Código já existe. Por favor, tente novamente.');
        }

        // Pegar maior ordem e adicionar 1
        const maxOrdem = Math.max(...categorias.map(c => c.ordem), 0);

        const { error } = await supabase
          .from('categorias_plano_contas')
          .insert({
            user_id: user.id,
            codigo: codigoFinal,
            descricao: descricao.trim(),
            indicador,
            faixa_dre: faixaDRE,
            e_padrao: false,
            ativo: true,
            ordem: maxOrdem + 1,
          });

        if (error) {
          if (error.code === '23505') {
            throw new Error('Código já existe. Por favor, tente novamente.');
          }
          throw error;
        }

        toast({
          title: '✅ Cadastrado',
          description: `Categoria criada com código ${codigoFinal}!`,
        });
      }

      setModalAberto(false);
      fetchCategorias();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleAtivo = async (id: string, ativoAtual: boolean) => {
    try {
      const novoStatus = !ativoAtual;

      const { error } = await supabase
        .from('categorias_plano_contas')
        .update({ ativo: novoStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: novoStatus ? '✅ Categoria ativada' : '⚠️ Categoria desativada',
        description: novoStatus 
          ? 'Categoria reativada com sucesso!' 
          : 'Categoria desativada. Não aparecerá mais nas opções.',
      });

      fetchCategorias();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status.',
        variant: 'destructive',
      });
    }
  };

  const handleDeletar = async (id: string, ePadrao: boolean) => {
    try {
      if (ePadrao) {
        toast({
          title: 'Não permitido',
          description: 'Categorias padrão não podem ser deletadas. Apenas desative-as.',
          variant: 'destructive',
        });
        return;
      }

      if (!confirm('Tem certeza que deseja deletar esta categoria? Esta ação não pode ser desfeita.')) {
        return;
      }

      const { error } = await supabase
        .from('categorias_plano_contas')
        .delete()
        .eq('id', id)
        .eq('e_padrao', false); // Garantir que não deleta padrão

      if (error) {
        if (error.code === '23503') {
          throw new Error('Esta categoria está sendo usada e não pode ser deletada. Desative-a ao invés disso.');
        }
        throw error;
      }

      toast({
        title: '✅ Deletado',
        description: 'Categoria deletada com sucesso!',
      });

      fetchCategorias();
    } catch (error: any) {
      console.error('Erro ao deletar:', error);
      toast({
        title: 'Erro ao deletar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleExportarExcel = () => {
    try {
      const dadosExport = categoriasFiltradas.map(categoria => ({
        'Tipo': categoria.e_padrao ? 'Padrão' : 'Customizada',
        'Código': categoria.codigo,
        'Descrição': categoria.descricao,
        'Indicador': categoria.indicador,
        'Faixa no DRE': categoria.faixa_dre,
        'Status': categoria.ativo ? 'Ativo' : 'Inativo',
      }));

      const ws = XLSX.utils.json_to_sheet(dadosExport);
      
      // Ajustar largura das colunas
      const colWidths = [
        { wch: 12 },  // Tipo
        { wch: 10 },  // Código
        { wch: 35 },  // Descrição
        { wch: 12 },  // Indicador
        { wch: 30 },  // Faixa DRE
        { wch: 10 },  // Status
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Categorias');
      
      const hoje = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Categorias_Plano_Contas_${hoje}.xlsx`);

      toast({
        title: '✅ Exportado',
        description: 'Planilha de categorias exportada com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar a planilha.',
        variant: 'destructive',
      });
    }
  };

  const handleLimparFiltros = () => {
    setTermoBusca('');
    setFiltroIndicador('todos');
    setFiltroStatus('todos');
    setFiltroFaixaDRE('todos');
    setFiltroTipo('todos');
  };

  const getBadgeIndicador = (indicador: 'Credito' | 'Debito') => {
    if (indicador === 'Credito') {
      return <Badge className="bg-green-100 text-green-700 border-green-300">Crédito</Badge>;
    }
    return <Badge className="bg-red-100 text-red-700 border-red-300">Débito</Badge>;
  };

  // Contar filtros ativos
  const filtrosAtivos = [
    termoBusca.trim() !== '',
    filtroIndicador !== 'todos',
    filtroStatus !== 'todos',
    filtroFaixaDRE !== 'todos',
    filtroTipo !== 'todos',
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Categorias do Plano de Contas"
        description="Categorias para classificação de receitas e despesas no DRE"
        backButton={<BackButton to="/configuracoes" />}
      />

      {/* Alertas */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          O sistema possui 17 categorias padrão. Você pode criar categorias personalizadas 
          conforme sua necessidade e editar apenas as customizadas.
        </AlertDescription>
      </Alert>

      {/* Botão Criar Nova Categoria */}
      <div className="flex justify-center">
        <Button onClick={() => handleAbrirModal()} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Criar Nova Categoria
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

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Busca */}
          <div className="space-y-2">
            <Label htmlFor="busca">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="busca"
                placeholder="Código ou descrição..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtro Tipo */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="padrao">Padrão</SelectItem>
                <SelectItem value="customizada">Customizadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro Indicador */}
          <div className="space-y-2">
            <Label>Indicador</Label>
            <Select value={filtroIndicador} onValueChange={setFiltroIndicador}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="Credito">Crédito</SelectItem>
                <SelectItem value="Debito">Débito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro Status */}
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

          {/* Filtro Faixa DRE */}
          <div className="space-y-2">
            <Label>Faixa no DRE</Label>
            <Select value={filtroFaixaDRE} onValueChange={setFiltroFaixaDRE}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                {faixasDRE.map(faixa => (
                  <SelectItem key={faixa} value={faixa}>
                    {faixa}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Mostrando <strong>{categoriasFiltradas.length}</strong> de <strong>{categorias.length}</strong> categoria(s)
          </div>
          <Button onClick={handleExportarExcel} variant="outline" size="sm">
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
              <TableHead className="w-32">Tipo</TableHead>
              <TableHead className="w-24">Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-32">Indicador</TableHead>
              <TableHead>Faixa no DRE</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="text-right w-40">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categoriasFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {termoBusca || filtrosAtivos > 0 
                    ? 'Nenhuma categoria encontrada com esses filtros.' 
                    : 'Nenhuma categoria encontrada.'}
                </TableCell>
              </TableRow>
            ) : (
              categoriasFiltradas.map(categoria => (
                <TableRow 
                  key={categoria.id}
                  className={!categoria.ativo ? 'opacity-50 bg-muted/50' : ''}
                >
                  <TableCell>
                    {categoria.e_padrao ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                        Padrão
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                        Customizada
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono font-bold">{categoria.codigo}</TableCell>
                  <TableCell className="font-medium">{categoria.descricao}</TableCell>
                  <TableCell>{getBadgeIndicador(categoria.indicador)}</TableCell>
                  <TableCell className="text-sm">{categoria.faixa_dre}</TableCell>
                  <TableCell>
                    {categoria.ativo ? (
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
                      {!categoria.e_padrao && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAbrirModal(categoria)}
                            title="Editar categoria"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletar(categoria.id, categoria.e_padrao)}
                            title="Deletar categoria"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAtivo(categoria.id, categoria.ativo)}
                        title={categoria.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {categoria.ativo ? (
                          <PowerOff className="h-4 w-4 text-red-600" />
                        ) : (
                          <Power className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Criar/Editar */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editando ? 'Editar Categoria' : 'Criar Nova Categoria'}
            </DialogTitle>
            <DialogDescription>
              {editando 
                ? 'Edite os dados da categoria customizada' 
                : 'Crie uma categoria personalizada para suas necessidades'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Mostrar código gerado (somente ao criar) */}
            {!editando && codigoSugerido && (
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <strong>Código gerado automaticamente:</strong> {codigoSugerido}
                </AlertDescription>
              </Alert>
            )}

            {/* Mostrar código atual (somente ao editar) */}
            {editando && (
              <div className="p-3 bg-muted rounded-lg">
                <Label className="text-xs text-muted-foreground">Código</Label>
                <p className="font-mono font-bold text-lg">{editando.codigo}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  O código não pode ser alterado
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                placeholder="Ex: Marketing Digital"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Indicador *</Label>
              <Select value={indicador} onValueChange={setIndicador}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Credito">Crédito (Receitas)</SelectItem>
                  <SelectItem value="Debito">Débito (Despesas)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Faixa no DRE *</Label>
              <Select value={faixaDRE} onValueChange={setFaixaDRE}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Receitas">Receitas</SelectItem>
                  <SelectItem value="Deduções sobre vendas">Deduções sobre vendas</SelectItem>
                  <SelectItem value="Custos variáveis">Custos variáveis</SelectItem>
                  <SelectItem value="Custos fixos">Custos fixos</SelectItem>
                  <SelectItem value="Resultado operacional">Resultado operacional</SelectItem>
                  <SelectItem value="Resultado não operacional">Resultado não operacional</SelectItem>
                  <SelectItem value="Resultado financeiro">Resultado financeiro</SelectItem>
                  <SelectItem value="Investimento">Investimento</SelectItem>
                  <SelectItem value="Não listar no DRE">Não listar no DRE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar}>
              {editando ? 'Atualizar' : 'Criar Categoria'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alerta informativo */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Dica:</strong> Categorias padrão não podem ser editadas ou deletadas. 
          Crie categorias customizadas para suas necessidades específicas.
        </AlertDescription>
      </Alert>
    </div>
  );
}
