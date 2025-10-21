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
import { Info, Power, PowerOff, Search, Download, Filter, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import * as XLSX from 'xlsx';

interface Categoria {
  id: string;
  codigo: string;
  descricao: string;
  indicador: 'Credito' | 'Debito';
  faixa_dre: string;
  ativo: boolean;
  ordem: number;
}

export default function CategoriasPlanoContas() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroIndicador, setFiltroIndicador] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroFaixaDRE, setFiltroFaixaDRE] = useState('todos');

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

    return resultado;
  }, [categorias, termoBusca, filtroIndicador, filtroStatus, filtroFaixaDRE]);

  // Extrair faixas DRE únicas para o filtro
  const faixasDRE = useMemo(() => {
    const faixas = [...new Set(categorias.map(cat => cat.faixa_dre))];
    return faixas.sort();
  }, [categorias]);

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

  const handleExportarExcel = () => {
    try {
      const dadosExport = categoriasFiltradas.map(categoria => ({
        'Código': categoria.codigo,
        'Descrição': categoria.descricao,
        'Indicador': categoria.indicador,
        'Faixa no DRE': categoria.faixa_dre,
        'Status': categoria.ativo ? 'Ativo' : 'Inativo',
      }));

      const ws = XLSX.utils.json_to_sheet(dadosExport);
      
      // Ajustar largura das colunas
      const colWidths = [
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
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/configuracoes')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <PageHeader
            title="Categorias do Plano de Contas"
            description="Categorias para classificação de receitas e despesas no DRE"
          />
        </div>
        <Button onClick={handleExportarExcel} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar Excel
        </Button>
      </div>

      {/* Alertas */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          Estas categorias são usadas para organizar o Plano de Contas e gerar relatórios contábeis. 
          Você pode desativar categorias que não utiliza.
        </AlertDescription>
      </Alert>

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
        <div className="text-sm text-muted-foreground">
          Mostrando <strong>{categoriasFiltradas.length}</strong> de <strong>{categorias.length}</strong> categoria(s)
        </div>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-32">Indicador</TableHead>
              <TableHead>Faixa no DRE</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="text-right w-32">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categoriasFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleAtivo(categoria.id, categoria.ativo)}
                      title={categoria.ativo ? 'Desativar categoria' : 'Ativar categoria'}
                    >
                      {categoria.ativo ? (
                        <PowerOff className="h-4 w-4 text-red-600" />
                      ) : (
                        <Power className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Alerta informativo */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Dica:</strong> Use os filtros acima para encontrar categorias específicas. 
          Categorias inativas não aparecem ao cadastrar contas no Plano de Contas.
        </AlertDescription>
      </Alert>
    </div>
  );
}
