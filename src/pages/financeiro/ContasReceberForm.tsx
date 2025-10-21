import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Check, ChevronsUpDown, Info, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ContasReceberForm() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().split('T')[0]);
  const [clienteId, setClienteId] = useState('');
  const [tipoDocumentoId, setTipoDocumentoId] = useState('');
  const [planoContasId, setPlanoContasId] = useState('');
  const [bancoId, setBancoId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [numeroParcelas, setNumeroParcelas] = useState('1');
  const [primeiroVencimento, setPrimeiroVencimento] = useState('');
  const [eRecorrente, setERecorrente] = useState(false);
  const [diaVencimentoRecorrente, setDiaVencimentoRecorrente] = useState('');

  const [clientes, setClientes] = useState<any[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<any[]>([]);
  const [planosContas, setPlanosContas] = useState<any[]>([]);
  const [bancos, setBancos] = useState<any[]>([]);

  const [popoverClienteAberto, setPopoverClienteAberto] = useState(false);
  const [buscaCliente, setBuscaCliente] = useState('');

  const [modalClienteAberto, setModalClienteAberto] = useState(false);
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [novoClienteEmail, setNovoClienteEmail] = useState('');
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: dataClientes } = await supabase
        .from('clientes')
        .select('id, nome')
        .eq('usuario_id', user.id)
        .order('nome');

      setClientes(dataClientes || []);

      const { data: dataTipos } = await supabase
        .from('tipos_documento')
        .select('id, descricao')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('descricao');

      setTiposDocumento(dataTipos || []);

      const { data: dataPlanos } = await supabase
        .from('plano_contas')
        .select(`
          id,
          codigo_estruturado,
          descricao,
          categoria:categorias_plano_contas (
            indicador
          )
        `)
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('codigo_estruturado');

      const planosCredito = (dataPlanos || []).filter(
        (p: any) => p.categoria?.indicador === 'Credito'
      );
      setPlanosContas(planosCredito);

      const { data: dataBancos } = await supabase
        .from('bancos')
        .select('id, codigo, nome')
        .eq('usuario_id', user.id)
        .order('nome');

      setBancos(dataBancos || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  const handleAbrirModalCliente = () => {
    setNovoClienteNome(buscaCliente);
    setNovoClienteEmail('');
    setNovoClienteTelefone('');
    setModalClienteAberto(true);
    setPopoverClienteAberto(false);
  };

  const handleCriarCliente = async () => {
    try {
      if (!novoClienteNome.trim()) {
        toast({
          title: 'Erro',
          description: 'Informe o nome do cliente!',
          variant: 'destructive',
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('clientes')
        .insert({
          usuario_id: user.id,
          nome: novoClienteNome.trim(),
          email: novoClienteEmail.trim() || null,
          telefone: novoClienteTelefone.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '✅ Cliente criado',
        description: 'Cliente cadastrado com sucesso!',
      });

      setClientes([...clientes, data]);
      setClienteId(data.id);
      setModalClienteAberto(false);
      
      fetchDados();
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o cliente.',
        variant: 'destructive',
      });
    }
  };

  const handleSalvar = async () => {
    try {
      if (!dataEmissao) {
        toast({
          title: 'Erro',
          description: 'Informe a data de emissão!',
          variant: 'destructive',
        });
        return;
      }

      if (!clienteId) {
        toast({
          title: 'Erro',
          description: 'Selecione o cliente!',
          variant: 'destructive',
        });
        return;
      }

      if (!tipoDocumentoId) {
        toast({
          title: 'Erro',
          description: 'Selecione o tipo de documento!',
          variant: 'destructive',
        });
        return;
      }

      if (!planoContasId) {
        toast({
          title: 'Erro',
          description: 'Selecione o plano de contas!',
          variant: 'destructive',
        });
        return;
      }

      const valor = parseFloat(valorTotal.replace(',', '.'));
      if (!valor || valor <= 0) {
        toast({
          title: 'Erro',
          description: 'Informe um valor válido!',
          variant: 'destructive',
        });
        return;
      }

      const parcelas = parseInt(numeroParcelas);
      if (!parcelas || parcelas < 1) {
        toast({
          title: 'Erro',
          description: 'Número de parcelas inválido!',
          variant: 'destructive',
        });
        return;
      }

      if (eRecorrente && parcelas > 1) {
        toast({
          title: 'Erro',
          description: 'Contas recorrentes não podem ser parceladas!',
          variant: 'destructive',
        });
        return;
      }

      if (eRecorrente && !diaVencimentoRecorrente) {
        toast({
          title: 'Erro',
          description: 'Informe o dia do vencimento para contas recorrentes!',
          variant: 'destructive',
        });
        return;
      }

      if (!eRecorrente && !primeiroVencimento) {
        toast({
          title: 'Erro',
          description: 'Informe a data do primeiro vencimento!',
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data: conta, error: errorConta } = await supabase
        .from('contas_receber')
        .insert({
          usuario_id: user.id,
          cliente_id: clienteId,
          data_emissao: dataEmissao,
          tipo_documento_id: tipoDocumentoId,
          plano_conta_id: planoContasId,
          banco_id: bancoId || null,
          descricao: descricao.trim() || null,
          valor: valor,
          data_vencimento: primeiroVencimento || dataEmissao,
          numero_parcelas: parcelas,
          e_recorrente: eRecorrente,
          dia_vencimento_recorrente: eRecorrente ? parseInt(diaVencimentoRecorrente) : null,
          status: 'pendente',
        })
        .select()
        .single();

      if (errorConta) throw errorConta;

      const parcelas_data = [];
      const valorParcela = valor / parcelas;

      if (eRecorrente) {
        const diaVenc = parseInt(diaVencimentoRecorrente);
        for (let i = 0; i < 12; i++) {
          const dataVenc = new Date(dataEmissao);
          dataVenc.setMonth(dataVenc.getMonth() + i);
          dataVenc.setDate(diaVenc);

          parcelas_data.push({
            conta_receber_id: conta.id,
            numero_parcela: i + 1,
            data_vencimento: dataVenc.toISOString().split('T')[0],
            valor_parcela: valor,
          });
        }
      } else {
        const dataBase = new Date(primeiroVencimento + 'T00:00:00');
        for (let i = 0; i < parcelas; i++) {
          const dataVenc = new Date(dataBase);
          dataVenc.setMonth(dataVenc.getMonth() + i);

          parcelas_data.push({
            conta_receber_id: conta.id,
            numero_parcela: i + 1,
            data_vencimento: dataVenc.toISOString().split('T')[0],
            valor_parcela: valorParcela,
          });
        }
      }

      const { error: errorParcelas } = await supabase
        .from('contas_receber_parcelas')
        .insert(parcelas_data);

      if (errorParcelas) throw errorParcelas;

      toast({
        title: '✅ Conta cadastrada',
        description: eRecorrente 
          ? 'Conta recorrente criada com 12 primeiras parcelas!'
          : `Conta criada com ${parcelas} parcela(s)!`,
      });

      navigate('/financeiro/contas-receber');
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const clienteSelecionado = clientes.find(c => c.id === clienteId);
  const clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(buscaCliente.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/financeiro/contas-receber')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Conta a Receber</h1>
          <p className="text-muted-foreground">
            Cadastre uma nova conta a receber
          </p>
        </div>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <strong>Parcelado:</strong> Divide o valor em X parcelas com vencimentos mensais.<br />
          <strong>Recorrente:</strong> Gera lançamento mensal automático (não pode ser parcelado).
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data-emissao">Data de Emissão *</Label>
              <Input
                id="data-emissao"
                type="date"
                value={dataEmissao}
                onChange={(e) => setDataEmissao(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Popover open={popoverClienteAberto} onOpenChange={setPopoverClienteAberto}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {clienteSelecionado ? clienteSelecionado.nome : 'Selecione o cliente...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput 
                    placeholder="Buscar cliente..." 
                    value={buscaCliente}
                    onValueChange={setBuscaCliente}
                  />
                  <CommandEmpty>
                    <div className="p-4 text-center space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Cliente <strong>"{buscaCliente}"</strong> não encontrado.
                      </p>
                      <Button
                        size="sm"
                        onClick={handleAbrirModalCliente}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Criar Cliente "{buscaCliente}"
                      </Button>
                    </div>
                  </CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-auto">
                    {clientesFiltrados.map(cliente => (
                      <CommandItem
                        key={cliente.id}
                        value={cliente.id}
                        onSelect={() => {
                          setClienteId(cliente.id);
                          setPopoverClienteAberto(false);
                          setBuscaCliente('');
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            clienteId === cliente.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {cliente.nome}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Documento *</Label>
              <Select value={tipoDocumentoId} onValueChange={setTipoDocumentoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {tiposDocumento.map(tipo => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Plano de Contas *</Label>
              <Select value={planoContasId} onValueChange={setPlanoContasId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {planosContas.map(plano => (
                    <SelectItem key={plano.id} value={plano.id}>
                      {plano.codigo_estruturado} - {plano.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Banco (opcional)</Label>
            <Select value={bancoId} onValueChange={setBancoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {bancos.map(banco => (
                  <SelectItem key={banco.id} value={banco.id}>
                    {banco.codigo} - {banco.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Informações adicionais sobre esta conta..."
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor Total *</Label>
              <Input
                id="valor"
                placeholder="Ex: 1500,00"
                value={valorTotal}
                onChange={(e) => {
                  const valor = e.target.value.replace(/[^\d,]/g, '');
                  setValorTotal(valor);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parcelas">Número de Parcelas *</Label>
              <Input
                id="parcelas"
                type="number"
                min="1"
                value={numeroParcelas}
                onChange={(e) => setNumeroParcelas(e.target.value)}
                disabled={eRecorrente}
              />
            </div>
          </div>

          {!eRecorrente && (
            <div className="space-y-2">
              <Label htmlFor="vencimento">Data do Primeiro Vencimento *</Label>
              <Input
                id="vencimento"
                type="date"
                value={primeiroVencimento}
                onChange={(e) => setPrimeiroVencimento(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recorrente"
                checked={eRecorrente}
                onCheckedChange={(checked) => setERecorrente(checked as boolean)}
              />
              <Label htmlFor="recorrente" className="cursor-pointer">
                Conta Recorrente (mensal)
              </Label>
            </div>

            {eRecorrente && (
              <div className="pl-6 space-y-2">
                <Label htmlFor="dia-vencimento">Dia do Vencimento (1-31) *</Label>
                <Input
                  id="dia-vencimento"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Ex: 10"
                  value={diaVencimentoRecorrente}
                  onChange={(e) => setDiaVencimentoRecorrente(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  O sistema criará automaticamente as próximas 12 parcelas
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/financeiro/contas-receber')}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button onClick={handleSalvar} disabled={loading} className="flex-1">
          {loading ? 'Salvando...' : 'Cadastrar Conta a Receber'}
        </Button>
      </div>

      <Dialog open={modalClienteAberto} onOpenChange={setModalClienteAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Cliente</DialogTitle>
            <DialogDescription>
              Cadastre rapidamente um novo cliente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="novo-cliente-nome">Nome *</Label>
              <Input
                id="novo-cliente-nome"
                value={novoClienteNome}
                onChange={(e) => setNovoClienteNome(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="novo-cliente-email">E-mail</Label>
              <Input
                id="novo-cliente-email"
                type="email"
                value={novoClienteEmail}
                onChange={(e) => setNovoClienteEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="novo-cliente-telefone">Telefone</Label>
              <Input
                id="novo-cliente-telefone"
                value={novoClienteTelefone}
                onChange={(e) => setNovoClienteTelefone(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalClienteAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCriarCliente}>
              Criar Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
