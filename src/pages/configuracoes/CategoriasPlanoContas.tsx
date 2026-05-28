import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingStateFullScreen } from '@/components/LoadingState';
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
import { Info, Search, Download, Filter } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { BackButton } from '@/components/BackButton';
import * as XLSX from '@/lib/xlsxShim';

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
  const [filtroFaixaDRE, setFiltroFaixaDRE] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');

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
        .order('codigo');

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

    // Filtro de faixa DRE
    if (filtroFaixaDRE !== 'todos') {
      resultado = resultado.filter(cat => cat.faixa_dre === filtroFaixaDRE);
    }

    // Filtro de tipo (padrão/customizada)
    if (filtroTipo !== 'todos') {
      const ePadrao = filtroTipo === 'padrao';
      resultado = resultado.filter(cat => cat.e_padrao === ePadrao);
    }

    // Ordenar numericamente por código
    resultado.sort((a, b) => {
      const codigoA = parseInt(a.codigo);
      const codigoB = parseInt(b.codigo);
      return codigoA - codigoB;
    });

    return resultado;
  }, [categorias, termoBusca, filtroIndicador, filtroFaixaDRE, filtroTipo]);

  // Extrair faixas DRE únicas para o filtro
  const faixasDRE = useMemo(() => {
    const faixas = [...new Set(categorias.map(cat => cat.faixa_dre))];
    return faixas.sort();
  }, [categorias]);

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
    filtroFaixaDRE !== 'todos',
    filtroTipo !== 'todos',
  ].filter(Boolean).length;

  if (loading) {
    return <LoadingStateFullScreen message="Carregando Categorias" submessage="Organizando seu plano de contas..." />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Categorias do Plano de Contas"
        description="Categorias para classificação de receitas e despesas no DRE"
        backButton={<BackButton to="/financeiro/cadastros" />}
      />

      {/* Alertas */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          Esta página é apenas para visualização. O sistema possui 17 categorias padrão para classificação de receitas e despesas no DRE.
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Informativo rodapé */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Dica:</strong> Use os filtros para encontrar categorias específicas. 
          Exporte para Excel para análise externa.
        </AlertDescription>
      </Alert>
    </div>
  );
}
