import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Info, Search, Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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

  // Busca
  const [termoBusca, setTermoBusca] = useState('');

  // Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<TipoDocumento | null>(null);
  const [descricao, setDescricao] = useState('');
  const [codigoSugerido, setCodigoSugerido] = useState('');

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

  // Filtrar por busca
  const tiposFiltrados = useMemo(() => {
    if (!termoBusca.trim()) return tipos;

    const termo = termoBusca.toLowerCase();
    return tipos.filter(t => 
      t.descricao.toLowerCase().includes(termo) ||
      t.codigo.toString().includes(termo)
    );
  }, [tipos, termoBusca]);

  const handleAbrirModal = async (tipo: TipoDocumento | null = null) => {
    if (tipo) {
      setEditando(tipo);
      setDescricao(tipo.descricao);
      setCodigoSugerido('');
    } else {
      // Gerar código
      try {
        if (!user) return;

        const { data: codigo, error } = await supabase.rpc('gerar_proximo_codigo_tipo_documento', {
          p_user_id: user.id
        });

        if (error) {
          console.error('Erro ao gerar código:', error);
          setCodigoSugerido('');
        } else {
          setCodigoSugerido(codigo?.toString() || '');
        }
      } catch (error) {
        console.error('Erro:', error);
        setCodigoSugerido('');
      }

      setEditando(null);
      setDescricao('');
    }
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    try {
      if (!descricao.trim()) {
        toast({
          title: 'Erro',
          description: 'Informe a descrição do tipo de documento!',
          variant: 'destructive',
        });
        return;
      }

      if (!user) throw new Error('Não autenticado');

      if (editando) {
        // Atualizar
        const { error } = await supabase
          .from('tipos_documento')
          .update({
            descricao: descricao.trim(),
          })
          .eq('id', editando.id);

        if (error) {
          if (error.code === '23505') {
            throw new Error('Já existe um tipo com esta descrição!');
          }
          throw error;
        }

        toast({
          title: '✅ Atualizado',
          description: 'Tipo de documento atualizado com sucesso!',
        });
      } else {
        // Criar
        const { error } = await supabase
          .from('tipos_documento')
          .insert({
            usuario_id: user.id,
            codigo: parseInt(codigoSugerido),
            descricao: descricao.trim(),
            e_padrao: false,
          });

        if (error) {
          if (error.code === '23505') {
            if (error.message.includes('descricao')) {
              throw new Error('Já existe um tipo com esta descrição!');
            }
            throw new Error('Já existe um tipo com este código!');
          }
          throw error;
        }

        toast({
          title: '✅ Cadastrado',
          description: `Tipo criado com código ${codigoSugerido}!`,
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

  const handleDeletar = async (id: string) => {
    try {
      if (!confirm('Deletar este tipo de documento?')) return;

      const { error } = await supabase
        .from('tipos_documento')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === '23503') {
          throw new Error('Este tipo está sendo usado e não pode ser deletado.');
        }
        throw error;
      }

      toast({
        title: '✅ Deletado',
        description: 'Tipo de documento deletado com sucesso!',
      });

      fetchTipos();
    } catch (error: any) {
      console.error('Erro ao deletar:', error);
      toast({
        title: 'Erro ao deletar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) return <div className="flex justify-center p-8">Carregando...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Tipos de Documentos</h1>
          <p className="text-muted-foreground">
            Tipos de documentos para lançamentos financeiros
          </p>
        </div>
        <Button onClick={() => handleAbrirModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Criar Novo Tipo
        </Button>
      </div>

      {/* Alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          O sistema já cadastrou 14 tipos de documentos mais comuns. 
          Você pode criar tipos personalizados conforme sua necessidade.
        </AlertDescription>
      </Alert>

      {/* Busca */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código ou descrição..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Contador */}
      {termoBusca && (
        <div className="text-sm text-muted-foreground">
          Mostrando <strong>{tiposFiltrados.length}</strong> de <strong>{tipos.length}</strong> tipo(s)
        </div>
      )}

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Tipo</TableHead>
              <TableHead className="w-32">Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right w-32">Ações</TableHead>
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
                    {tipo.e_padrao ? (
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
                    {tipo.codigo}
                  </TableCell>
                  <TableCell className="font-medium">{tipo.descricao}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAbrirModal(tipo)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletar(tipo.id)}
                        title="Deletar"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
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
              {editando ? 'Editar Tipo de Documento' : 'Criar Novo Tipo'}
            </DialogTitle>
            <DialogDescription>
              {editando 
                ? 'Edite a descrição do tipo' 
                : 'Crie um tipo de documento personalizado'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Código gerado */}
            {!editando && codigoSugerido && (
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <strong>Código gerado automaticamente:</strong> {codigoSugerido}
                </AlertDescription>
              </Alert>
            )}

            {/* Código atual (edição) */}
            {editando && (
              <div className="p-3 bg-muted rounded-lg">
                <Label className="text-xs text-muted-foreground">Código</Label>
                <p className="font-mono font-bold text-lg">{editando.codigo}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  O código não pode ser alterado
                </p>
              </div>
            )}

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                placeholder="Ex: Pagamento Digital"
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
              {editando ? 'Atualizar' : 'Criar Tipo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alerta informativo */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Dica:</strong> Tipos padrão e customizados podem ser editados ou deletados. 
          O código é gerado automaticamente e não pode ser alterado.
        </AlertDescription>
      </Alert>
    </div>
  );
}
