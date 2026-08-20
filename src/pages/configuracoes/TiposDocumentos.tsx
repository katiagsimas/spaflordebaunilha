import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/LoadingState';
import { Switch } from '@/components/ui/switch';
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
import { Info, Search, Plus, Edit, Trash2, Filter, ArrowRight, ArrowLeft } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';
import { BackButton } from '@/components/BackButton';
import { PageHeader } from '@/components/PageHeader';

interface TipoDocumento {
  id: string;
  usuario_id: string;
  owner_group_id?: string;
  codigo: number;
  descricao: string;
  e_padrao?: boolean;
  habilitado?: boolean;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function TiposDocumentos() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeGroupId } = useGroup();
  const [tipos, setTipos] = useState<TipoDocumento[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca
  const [termoBusca, setTermoBusca] = useState('');
  
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'padrao' | 'custom'>('todos');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'habilitado' | 'desabilitado'>('todos');

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
      if (!user || !activeGroupId) return;


      // Buscar tipos ordenados: habilitados primeiro, depois padrão, depois alfabético
      const { data, error } = await supabase
        .from('tipos_documento')
        .select('*')
        .eq('owner_group_id', activeGroupId)
        .order('habilitado', { ascending: false })
        .order('e_padrao', { ascending: false })
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

  // Filtrar por busca, tipo e status
  const tiposFiltrados = useMemo(() => {
    let resultado = tipos;

    // Filtro de busca
    if (termoBusca.trim()) {
      const termo = termoBusca.toLowerCase();
      resultado = resultado.filter(t => 
        t.descricao.toLowerCase().includes(termo) ||
        t.codigo.toString().includes(termo)
      );
    }

    // Filtro de tipo (Padrão ou Custom)
    if (filtroTipo !== 'todos') {
      resultado = resultado.filter(t => 
        filtroTipo === 'padrao' ? t.e_padrao : !t.e_padrao
      );
    }

    // Filtro de status (Habilitado ou Desabilitado)
    if (filtroStatus !== 'todos') {
      const statusDesejado = filtroStatus === 'habilitado';
      resultado = resultado.filter(t => 
        (t.habilitado === statusDesejado) || (t.habilitado === undefined && statusDesejado === true)
      );
    }

    return resultado;
  }, [tipos, termoBusca, filtroTipo, filtroStatus]);

  const handleAbrirModal = async (tipo: TipoDocumento | null = null) => {
    if (tipo) {
      setEditando(tipo);
      setDescricao(tipo.descricao);
      setCodigoSugerido('');
    } else {
      // Gerar código
      try {
        if (!user || !activeGroupId) return;

        const { data: codigo, error } = await supabase.rpc('gerar_proximo_codigo_tipo_documento', {
          p_user_id: user.id,
          p_owner_group_id: activeGroupId
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

      if (!user || !activeGroupId) throw new Error('Não autenticado ou grupo não selecionado');

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
            owner_group_id: activeGroupId,
            codigo: parseInt(codigoSugerido),
            descricao: descricao.trim(),
            e_padrao: false,
            habilitado: true,
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

  const handleToggleHabilitado = async (tipo: TipoDocumento) => {
    try {
      const novoStatus = !tipo.habilitado;
      
      const { error } = await supabase
        .from('tipos_documento')
        .update({ habilitado: novoStatus })
        .eq('id', tipo.id);

      if (error) throw error;

      toast({
        title: '✅ Atualizado',
        description: `Tipo ${novoStatus ? 'habilitado' : 'desabilitado'} com sucesso!`,
      });

      fetchTipos();
    } catch (error: any) {
      console.error('Erro ao atualizar:', error);
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeletar = async (id: string, descricao: string) => {
    try {
      // Verificar se está em uso
      const { data: emUso, error: errorVerif } = await supabase
        .rpc('verificar_tipo_documento_em_uso', { p_tipo_documento_id: id });

      if (errorVerif) throw errorVerif;

      if (emUso) {
        toast({
          title: 'Não é possível deletar',
          description: `O tipo "${descricao}" está em uso. Você pode apenas desabilitá-lo.`,
          variant: 'destructive',
        });
        return;
      }

      if (!confirm(`Deletar o tipo "${descricao}"?`)) return;

      const { error } = await supabase
        .from('tipos_documento')
        .delete()
        .eq('id', id);

      if (error) throw error;

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

  if (loading) return <LoadingState message="Carregando Tipos de Documentos" submessage="Buscando seus documentos..." />;

  return (
    <div className="container mx-auto px-6 pt-1 pb-6 space-y-6">
      {/* Navegação superior */}
      <div className="flex items-center justify-between">
        <BackButton to="/financeiro/cadastros" />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate('/financeiro/cadastros/bancos')}
            className="gap-2 text-muted-foreground hover:text-foreground font-body"
          >
            <ArrowLeft className="h-4 w-4" />
            Bancos
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/financeiro/cadastros/categorias-plano-contas')}
            className="gap-2 text-muted-foreground hover:text-foreground font-body"
          >
            Categorias Planos de Contas
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <PageHeader
        title="Tipos de Documentos"
        description="Tipos de documentos para lançamentos financeiros"
      />


      {/* Botão Novo Tipo */}
      <div className="flex justify-start">
        <Button onClick={() => handleAbrirModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Criar Novo Tipo
        </Button>
      </div>

      {/* Busca e Filtros */}
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
        
        <Select value={filtroTipo} onValueChange={(value: any) => setFiltroTipo(value)}>
          <SelectTrigger className="w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Tipos</SelectItem>
            <SelectItem value="padrao">Padrão</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtroStatus} onValueChange={(value: any) => setFiltroStatus(value)}>
          <SelectTrigger className="w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="habilitado">Habilitado</SelectItem>
            <SelectItem value="desabilitado">Desabilitado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contador */}
      {(termoBusca || filtroTipo !== 'todos' || filtroStatus !== 'todos') && (
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
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="text-right w-40">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiposFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
                  <TableCell>
                    <Badge variant={tipo.habilitado ? "default" : "secondary"}>
                      {tipo.habilitado ? 'Habilitado' : 'Desabilitado'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 items-center">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`switch-${tipo.id}`} className="text-xs cursor-pointer">
                          {tipo.habilitado ? 'Habilitado' : 'Desabilitado'}
                        </Label>
                        <Switch
                          id={`switch-${tipo.id}`}
                          checked={tipo.habilitado ?? true}
                          onCheckedChange={() => handleToggleHabilitado(tipo)}
                        />
                      </div>
                      {!tipo.e_padrao && (
                        <>
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
                            onClick={() => handleDeletar(tipo.id, tipo.descricao)}
                            title="Deletar"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
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
          <strong>Importante:</strong> Tipos padrão podem apenas ser habilitados/desabilitados. 
          Tipos customizados podem ser editados e deletados (se não estiverem em uso).
        </AlertDescription>
      </Alert>
    </div>
  );
}
