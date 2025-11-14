import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { LoadingStateFullScreen } from '@/components/LoadingState';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Banco {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  e_banco_oficial?: boolean;
  e_customizado?: boolean;
  habilitado?: boolean;
}

// Lista de bancos oficiais brasileiros com códigos BACEN
const BANCOS_OFICIAIS: Record<string, string> = {
  'banco do brasil': '001',
  'santander': '033',
  'caixa economica federal': '104',
  'caixa': '104',
  'bradesco': '237',
  'itau': '341',
  'itaú': '341',
  'itau unibanco': '341',
  'itaú unibanco': '341',
  'banco inter': '077',
  'inter': '077',
  'nubank': '260',
  'banco c6': '336',
  'c6 bank': '336',
  'c6': '336',
  'banco original': '212',
  'original': '212',
  'banco pan': '623',
  'pan': '623',
  'banco safra': '422',
  'safra': '422',
  'banrisul': '041',
  'sicredi': '748',
  'banco do nordeste': '004',
  'banese': '047',
  'mercado pago': '323',
  'picpay': '380',
  'banco neon': '735',
  'neon': '735',
  'bs2': '218',
  'banco bs2': '218',
  'banco bmg': '318',
  'bmg': '318',
  'btg pactual': '208',
  'banco btg pactual': '208',
  'banco votorantim': '655',
  'votorantim': '655',
  'bancoob': '756',
  'sicoob': '756',
  'crefisa': '069',
  'banco crefisa': '069',
  'banco pine': '643',
  'pine': '643',
  'banco daycoval': '707',
  'daycoval': '707',
  'unicred': '136',
  'banco cooperativo': '756',
};

export default function Bancos() {
  const { toast } = useToast();
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'habilitado' | 'desabilitado'>('todos');

  // Modal criar/editar
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Banco | null>(null);
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('Conta Corrente');
  const [salvando, setSalvando] = useState(false);
  const [mostrarAlertaCustomizado, setMostrarAlertaCustomizado] = useState(false);
  const [codigoOficialEncontrado, setCodigoOficialEncontrado] = useState(false);

  useEffect(() => {
    fetchBancos();
  }, []);

  const fetchBancos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verificar se usuário já tem bancos
      const { data: bancosExistentes, error: erroCheck } = await supabase
        .from('bancos')
        .select('id')
        .eq('usuario_id', user.id)
        .limit(1);

      if (erroCheck) throw erroCheck;

      // Se não tem bancos, criar os padrão
      if (!bancosExistentes || bancosExistentes.length === 0) {
        const { error: erroFuncao } = await supabase.rpc('criar_bancos_padrao_para_usuario', {
          p_usuario_id: user.id
        });
        
        if (erroFuncao) {
          console.error('Erro ao criar bancos padrão:', erroFuncao);
        }
      }

      // Buscar bancos - ordenar habilitados primeiro
      const { data, error } = await supabase
        .from('bancos')
        .select('id, codigo, nome, tipo, e_banco_oficial, e_customizado, habilitado')
        .eq('usuario_id', user.id)
        .order('habilitado', { ascending: false })
        .order('codigo');

      if (error) throw error;
      
      const bancosFormatados = (data || []).map(b => ({
        id: b.id,
        codigo: b.codigo,
        nome: b.nome,
        tipo: b.tipo,
        e_banco_oficial: b.e_banco_oficial || false,
        e_customizado: b.e_customizado || false,
        habilitado: b.habilitado || false,
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
    let resultado = bancos;

    // Filtro de status
    if (filtroStatus !== 'todos') {
      const statusDesejado = filtroStatus === 'habilitado';
      resultado = resultado.filter(b => b.habilitado === statusDesejado);
    }

    // Filtro de busca
    if (termoBusca.trim()) {
      const termo = termoBusca.toLowerCase();
      resultado = resultado.filter(b => 
        b.codigo.toLowerCase().includes(termo) ||
        b.nome.toLowerCase().includes(termo)
      );
    }

    return resultado;
  }, [bancos, termoBusca, filtroStatus]);

  const handleAbrirModal = (banco: Banco | null = null) => {
    if (banco) {
      setEditando(banco);
      setCodigo(banco.codigo);
      setNome(banco.nome);
      setTipo(banco.tipo);
      setCodigoOficialEncontrado(!!banco.e_banco_oficial);
    } else {
      setEditando(null);
      setCodigo('');
      setNome('');
      setTipo('Conta Corrente');
      setCodigoOficialEncontrado(false);
    }
    setMostrarAlertaCustomizado(false);
    setModalAberto(true);
  };

  // Buscar código oficial quando nome for digitado
  const handleNomeChange = (novoNome: string) => {
    setNome(novoNome);
    setMostrarAlertaCustomizado(false);
    
    if (!editando && novoNome.trim()) {
      const nomeNormalizado = novoNome.toLowerCase().trim();
      const codigoOficial = BANCOS_OFICIAIS[nomeNormalizado];
      
      if (codigoOficial) {
        setCodigo(codigoOficial);
        setCodigoOficialEncontrado(true);
      } else {
        // Verificar se é um nome parcial que pode ser encontrado
        const bancoEncontrado = Object.keys(BANCOS_OFICIAIS).find(key => 
          key.includes(nomeNormalizado) || nomeNormalizado.includes(key)
        );
        
        if (bancoEncontrado) {
          setCodigo(BANCOS_OFICIAIS[bancoEncontrado]);
          setCodigoOficialEncontrado(true);
        } else {
          setCodigo('');
          setCodigoOficialEncontrado(false);
          if (novoNome.length > 3) {
            setMostrarAlertaCustomizado(true);
          }
        }
      }
    }
  };

  const gerarCodigoCustomizado = async (userId: string): Promise<string> => {
    // Buscar o maior código customizado existente
    const { data } = await supabase
      .from('bancos')
      .select('codigo')
      .eq('usuario_id', userId)
      .ilike('codigo', 'C%')
      .order('codigo', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const ultimoCodigo = data[0].codigo;
      const numero = parseInt(ultimoCodigo.substring(1)) + 1;
      return `C${numero.toString().padStart(3, '0')}`;
    }
    
    return 'C001';
  };

  const handleSalvar = async (forcarCadastro = false) => {
    try {
      if (!nome.trim()) {
        toast({
          title: 'Erro',
          description: 'Informe o nome do banco!',
          variant: 'destructive',
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Se não tiver código e não for forçar cadastro, mostrar alerta
      if (!editando && !codigo.trim() && !forcarCadastro) {
        setMostrarAlertaCustomizado(true);
        return;
      }

      setSalvando(true);

      // Gerar código customizado se necessário
      let codigoFinal = codigo.trim();
      let eCustomizado = false;
      let eBancoOficial = codigoOficialEncontrado;

      if (!editando && (!codigoFinal || !codigoOficialEncontrado)) {
        codigoFinal = await gerarCodigoCustomizado(user.id);
        eCustomizado = true;
        eBancoOficial = false;
      }

      if (editando) {
        // Atualizar
        const { error } = await supabase
          .from('bancos')
          .update({
            nome: nome.trim(),
            codigo: codigoFinal,
            tipo: tipo,
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
          .eq('codigo', codigoFinal)
          .limit(1);
        
        const existe = checkResult.data && checkResult.data.length > 0;

        if (existe) {
          toast({
            title: 'Erro',
            description: 'Você já cadastrou um banco com este código!',
            variant: 'destructive',
          });
          setSalvando(false);
          return;
        }

        // Criar
        const { error } = await supabase
          .from('bancos')
          .insert({
            usuario_id: user.id,
            codigo: codigoFinal,
            nome: nome.trim(),
            tipo: tipo,
            saldo_inicial: 0,
            e_banco_oficial: eBancoOficial,
            e_customizado: eCustomizado,
            habilitado: false,
          });

        if (error) {
          if (error.code === '23505') {
            throw new Error('Este banco já foi cadastrado!');
          }
          throw error;
        }

        const mensagem = eCustomizado 
          ? `Banco customizado cadastrado com código ${codigoFinal}!`
          : 'Banco cadastrado com sucesso!';

        toast({
          title: '✅ Cadastrado',
          description: mensagem,
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

  const handleToggleHabilitado = async (id: string, habilitado: boolean) => {
    try {
      const { error } = await supabase
        .from('bancos')
        .update({ habilitado })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: habilitado ? '✅ Habilitado' : '⚠️ Desabilitado',
        description: `Banco ${habilitado ? 'habilitado' : 'desabilitado'} com sucesso!`,
      });

      fetchBancos();
    } catch (error: any) {
      console.error('Erro:', error);
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
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
    return <LoadingStateFullScreen message="Carregando Bancos" submessage="Buscando dados dos seus bancos..." />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <BackButton to="/configuracoes/financeiro" />
        <div>
          <h1 className="text-3xl font-bold">Bancos</h1>
          <p className="text-muted-foreground">Cadastre os bancos que você utiliza</p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button onClick={() => handleAbrirModal()} variant="default">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Novo Banco
        </Button>
        <Button onClick={handleExportar} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar Excel
        </Button>
      </div>

      {/* Alert */}
      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <strong>Dica:</strong> Habilite apenas os bancos que você utiliza para melhor organização.
          Os bancos desabilitados não aparecerão nas listagens de seleção.
        </AlertDescription>
      </Alert>

      {/* Busca e Filtros */}
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
        <Select value={filtroStatus} onValueChange={(value: any) => setFiltroStatus(value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="habilitado">Habilitados</SelectItem>
            <SelectItem value="desabilitado">Desabilitados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Código</TableHead>
              <TableHead>Nome do Banco</TableHead>
              <TableHead className="w-40">Tipo</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="text-right w-32">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bancosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {termoBusca 
                    ? 'Nenhum banco encontrado.' 
                    : 'Nenhum banco cadastrado.'}
                </TableCell>
              </TableRow>
            ) : (
              bancosFiltrados.map(banco => (
                <TableRow key={banco.id} className={!banco.habilitado ? 'opacity-50' : ''}>
                  <TableCell className="font-mono font-bold">
                    {banco.codigo}
                    {banco.e_banco_oficial && (
                      <Badge variant="secondary" className="ml-2 text-xs">Oficial</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{banco.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {banco.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {banco.habilitado ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        ✅ Habilitado
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        ⚠️ Desabilitado
                      </Badge>
                    )}
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
                        onClick={() => handleToggleHabilitado(banco.id, !banco.habilitado)}
                        title={banco.habilitado ? 'Desabilitar' : 'Habilitar'}
                        className={banco.habilitado ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950' : 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950'}
                      >
                        {banco.habilitado ? (
                          <Trash2 className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
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
              {editando ? 'Editar Banco' : 'Adicionar Banco'}
            </DialogTitle>
            <DialogDescription>
              {editando 
                ? 'Edite as informações do banco' 
                : 'Informe o código e nome do banco'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Banco *</Label>
              <Input
                id="nome"
                placeholder="Ex: Banco do Brasil, Itaú, Nubank"
                value={nome}
                onChange={(e) => handleNomeChange(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Digite o nome do banco para buscar o código oficial automaticamente
              </p>
            </div>

            {/* Código */}
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                placeholder="Código será preenchido automaticamente"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                maxLength={10}
                disabled={!editando && codigoOficialEncontrado}
              />
              {codigoOficialEncontrado && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  ✓ Código oficial BACEN encontrado
                </p>
              )}
              {!codigoOficialEncontrado && codigo && (
                <p className="text-xs text-muted-foreground">
                  Código customizado
                </p>
              )}
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Conta</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Conta Corrente">Conta Corrente</SelectItem>
                  <SelectItem value="Conta Poupança">Conta Poupança</SelectItem>
                  <SelectItem value="Investimento">Investimento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Alerta de banco não oficial */}
            {mostrarAlertaCustomizado && !codigoOficialEncontrado && (
              <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  <strong>Banco Inexistente:</strong> Este banco não consta na lista oficial BACEN.
                  Deseja cadastrar mesmo assim? Um código customizado será gerado automaticamente.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setModalAberto(false)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button onClick={() => handleSalvar(true)} disabled={salvando}>
              {salvando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                editando ? 'Atualizar' : (mostrarAlertaCustomizado ? 'Cadastrar Mesmo Assim' : 'Adicionar')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
