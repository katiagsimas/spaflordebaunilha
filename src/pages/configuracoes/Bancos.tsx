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
import { Info, Search, Download, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { BackButton } from '@/components/BackButton';

interface Banco {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  e_banco_oficial?: boolean;
  e_customizado?: boolean;
}

export default function Bancos() {
  const { toast } = useToast();
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [termoBusca, setTermoBusca] = useState('');

  // Modal criar/editar
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Banco | null>(null);
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetchBancos();
  }, []);

  const fetchBancos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar bancos
      const { data, error } = await supabase
        .from('bancos')
        .select('id, codigo, nome, tipo')
        .eq('usuario_id', user.id)
        .order('codigo');

      if (error) throw error;
      
      const bancosFormatados = (data || []).map(b => ({
        id: b.id,
        codigo: b.codigo,
        nome: b.nome,
        tipo: b.tipo,
        e_banco_oficial: false,
        e_customizado: false,
      }));
      
      setBancos(bancosFormatados);
    } catch (error) {
      console.error('Erro ao buscar bancos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os bancos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar bancos
  const bancosFiltrados = useMemo(() => {
    if (!termoBusca.trim()) return bancos;

    const termo = termoBusca.toLowerCase();
    return bancos.filter(b => 
      b.codigo.toLowerCase().includes(termo) ||
      b.nome.toLowerCase().includes(termo)
    );
  }, [bancos, termoBusca]);

  const handleAbrirModal = (banco: Banco | null = null) => {
    if (banco) {
      setEditando(banco);
      setCodigo(banco.codigo);
      setNome(banco.nome);
    } else {
      setEditando(null);
      setCodigo('');
      setNome('');
    }
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    try {
      if (!codigo.trim()) {
        toast({
          title: 'Erro',
          description: 'Informe o código do banco!',
          variant: 'destructive',
        });
        return;
      }

      if (!nome.trim()) {
        toast({
          title: 'Erro',
          description: 'Informe o nome do banco!',
          variant: 'destructive',
        });
        return;
      }

      setSalvando(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      if (editando) {
        // Atualizar
        const { error } = await supabase
          .from('bancos')
          .update({
            nome: nome.trim(),
            codigo: codigo.trim(),
          })
          .eq('id', editando.id);

        if (error) throw error;

        toast({
          title: '✅ Atualizado',
          description: 'Banco atualizado com sucesso!',
        });
      } else {
        // Verificar se já existe
        const checkResult = await supabase
          .from('bancos')
          .select('id')
          .eq('usuario_id', user.id)
          .eq('codigo', codigo.trim())
          .limit(1);
        
        const existe = checkResult.data && checkResult.data.length > 0;

        if (existe) {
          toast({
            title: 'Erro',
            description: 'Você já cadastrou um banco com este código!',
            variant: 'destructive',
          });
          return;
        }

        // Criar
        const { error } = await supabase
          .from('bancos')
          .insert({
            usuario_id: user.id,
            codigo: codigo.trim(),
            nome: nome.trim(),
            tipo: 'Conta Corrente',
            saldo_inicial: 0,
            e_banco_oficial: false,
            e_customizado: false,
          });

        if (error) {
          if (error.code === '23505') {
            throw new Error('Este banco já foi cadastrado!');
          }
          throw error;
        }

        toast({
          title: '✅ Cadastrado',
          description: 'Banco cadastrado com sucesso!',
        });
      }

      setModalAberto(false);
      fetchBancos();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletar = async (id: string) => {
    try {
      if (!confirm('Deletar este banco?')) return;

      const { error } = await supabase
        .from('bancos')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === '23503') {
          throw new Error('Este banco está sendo usado e não pode ser deletado.');
        }
        throw error;
      }

      toast({
        title: '✅ Deletado',
        description: 'Banco deletado com sucesso!',
      });

      fetchBancos();
    } catch (error: any) {
      console.error('Erro:', error);
      toast({
        title: 'Erro ao deletar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleExportar = () => {
    try {
      const dados = bancosFiltrados.map(b => ({
        'Código': b.codigo,
        'Nome': b.nome,
        'Tipo': b.tipo,
      }));

      const ws = XLSX.utils.json_to_sheet(dados);
      ws['!cols'] = [{ wch: 10 }, { wch: 50 }, { wch: 20 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Bancos');
      
      const hoje = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Bancos_${hoje}.xlsx`);

      toast({
        title: '✅ Exportado',
        description: 'Planilha exportada com sucesso!',
      });
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <BackButton to="/configuracoes" />
        <div>
          <h1 className="text-3xl font-bold">Bancos</h1>
          <p className="text-muted-foreground">Cadastre os bancos que você utiliza</p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button onClick={handleExportar} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar Excel
        </Button>
        <Button onClick={() => handleAbrirModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Banco
        </Button>
      </div>

      {/* Alert */}
      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <strong>Dica:</strong> Cadastre os bancos que você utiliza para melhor controle financeiro.
          Use códigos de 3 dígitos conforme padrão bancário brasileiro.
        </AlertDescription>
      </Alert>

      {/* Busca */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código ou nome..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Código</TableHead>
              <TableHead>Nome do Banco</TableHead>
              <TableHead className="w-40">Tipo</TableHead>
              <TableHead className="text-right w-32">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bancosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  {termoBusca 
                    ? 'Nenhum banco encontrado.' 
                    : 'Nenhum banco cadastrado. Clique em "Adicionar Banco" para começar.'}
                </TableCell>
              </TableRow>
            ) : (
              bancosFiltrados.map(banco => (
                <TableRow key={banco.id}>
                  <TableCell className="font-mono font-bold">
                    {banco.codigo}
                  </TableCell>
                  <TableCell className="font-medium">{banco.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {banco.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAbrirModal(banco)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletar(banco.id)}
                        title="Deletar"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
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

      {/* Modal Criar/Editar */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editando ? 'Editar Banco' : 'Adicionar Banco'}
            </DialogTitle>
            <DialogDescription>
              {editando 
                ? 'Edite as informações do banco' 
                : 'Informe o código e nome do banco'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Código */}
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                placeholder="Ex: 001, 237, 341"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                Use o código oficial do banco (geralmente 3 dígitos)
              </p>
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Banco *</Label>
              <Input
                id="nome"
                placeholder="Ex: Banco do Brasil, Itaú, Nubank"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setModalAberto(false)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={salvando}>
              {salvando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                editando ? 'Atualizar' : 'Adicionar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
