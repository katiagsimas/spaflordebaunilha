import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/LoadingState';
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
import { Info, Search, Ban, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { BackButton } from '@/components/BackButton';
import { PageHeader } from '@/components/PageHeader';

interface TipoDocumento {
  id: string;
  usuario_id: string;
  codigo: number;
  descricao: string;
  e_padrao?: boolean;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function TiposDocumentos() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tipos, setTipos] = useState<TipoDocumento[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca e filtros
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativos' | 'inativos'>('ativos');

  useEffect(() => {
    if (user) {
      fetchTipos();
    }
  }, [user]);

  const fetchTipos = async () => {
    try {
      if (!user) return;

      // Verificar se já tem tipos
      const { data: tiposExistentes, error: errorVerif } = await supabase
        .from('tipos_documento')
        .select('id')
        .eq('usuario_id', user.id)
        .limit(1);

      if (errorVerif) throw errorVerif;

      // Se não tem, criar padrão
      if (!tiposExistentes || tiposExistentes.length === 0) {
        console.log('Criando tipos de documentos padrão...');
        const { error: errorCriar } = await supabase.rpc('criar_tipos_documentos_padrao', {
          p_user_id: user.id
        });

        if (errorCriar) {
          console.error('Erro ao criar tipos padrão:', errorCriar);
        }
      }

      // Buscar tipos ordenados alfabeticamente
      const { data, error } = await supabase
        .from('tipos_documento')
        .select('*')
        .eq('usuario_id', user.id)
        .order('descricao');

      if (error) throw error;
      setTipos(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar tipos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os tipos de documentos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar por busca e status
  const tiposFiltrados = useMemo(() => {
    let resultado = tipos;

    // Filtro de status
    if (filtroStatus === 'ativos') {
      resultado = resultado.filter(t => t.ativo !== false);
    } else if (filtroStatus === 'inativos') {
      resultado = resultado.filter(t => t.ativo === false);
    }

    // Filtro de busca
    if (termoBusca.trim()) {
      const termo = termoBusca.toLowerCase();
      resultado = resultado.filter(t => 
        t.descricao.toLowerCase().includes(termo) ||
        t.codigo.toString().includes(termo)
      );
    }

    return resultado;
  }, [tipos, termoBusca, filtroStatus]);

  const handleToggleAtivo = async (tipo: TipoDocumento) => {
    try {
      const novoStatus = !tipo.ativo;
      
      const { error } = await supabase
        .from('tipos_documento')
        .update({ ativo: novoStatus })
        .eq('id', tipo.id);

      if (error) throw error;

      toast({
        title: novoStatus ? '✅ Habilitado' : '🚫 Desabilitado',
        description: `Tipo de documento ${novoStatus ? 'habilitado' : 'desabilitado'} com sucesso!`,
      });

      fetchTipos();
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status.',
        variant: 'destructive',
      });
    }
  };

  if (loading) return <LoadingState message="Carregando Tipos de Documentos" submessage="Buscando seus documentos..." />;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Tipos de Documentos"
        description="Visualize e gerencie os tipos de documentos do sistema"
        backButton={<BackButton to="/configuracoes/financeiro" />}
      />

      {/* Alert */}
      <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
        <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          <strong>🔒 Apenas visualização:</strong> Os tipos de documentos são fixos e fornecidos pelo sistema. 
          Você pode apenas habilitar ou desabilitar os tipos que não estão sendo utilizados.
        </AlertDescription>
      </Alert>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código ou descrição..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filtroStatus === 'todos' ? 'default' : 'outline'}
            onClick={() => setFiltroStatus('todos')}
            size="sm"
          >
            Todos
          </Button>
          <Button
            variant={filtroStatus === 'ativos' ? 'default' : 'outline'}
            onClick={() => setFiltroStatus('ativos')}
            size="sm"
          >
            Ativos
          </Button>
          <Button
            variant={filtroStatus === 'inativos' ? 'default' : 'outline'}
            onClick={() => setFiltroStatus('inativos')}
            size="sm"
          >
            Inativos
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-32">Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-center w-32">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiposFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  {termoBusca 
                    ? 'Nenhum tipo encontrado.' 
                    : 'Nenhum tipo cadastrado.'}
                </TableCell>
              </TableRow>
            ) : (
              tiposFiltrados.map(tipo => (
                <TableRow key={tipo.id}>
                  <TableCell>
                    {tipo.ativo !== false ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-950 dark:text-gray-400">
                        Inativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono font-bold">
                    {tipo.codigo}
                  </TableCell>
                  <TableCell className="font-medium">{tipo.descricao}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleAtivo(tipo)}
                      title={tipo.ativo !== false ? 'Desabilitar' : 'Habilitar'}
                    >
                      {tipo.ativo !== false ? (
                        <Ban className="h-4 w-4 text-red-600" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

    </div>
  );
}
