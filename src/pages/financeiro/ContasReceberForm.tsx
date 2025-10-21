import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  const [tipoLancamento, setTipoLancamento] = useState('unico');

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

      if (!bancoId) {
        toast({
          title: 'Erro',
          description: 'Selecione o banco!',
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

      if (!primeiroVencimento) {
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
          banco_id: bancoId,
          descricao: descricao.trim() || null,
          valor: valor,
          data_vencimento: primeiroVencimento,
          numero_parcelas: parcelas,
          tipo_lancamento: tipoLancamento,
          e_recorrente: tipoLancamento === 'recorrente',
        })
        .select()
        .single();

      if (errorConta) throw errorConta;

      const parcelas_data = [];
      const dataBase = new Date(primeiroVencimento + 'T00:00:00');

      if (tipoLancamento === 'parcelado' || tipoLancamento === 'unico') {
        const valorParcela = valor / parcelas;

        for (let i = 0; i < parcelas; i++) {
          const dataVenc = new Date(dataBase);
          dataVenc.setDate(dataVenc.getDate() + (i * 30));

          parcelas_data.push({
            conta_receber_id: conta.id,
            numero_parcela: i + 1,
            data_emissao: dataEmissao,
            data_vencimento: dataVenc.toISOString().split('T')[0],
            valor_total: valor,
            valor_parcela: valorParcela,
            status: 'aberto',
          });
        }
      } else {
        for (let i = 0; i < parcelas; i++) {
          const dataVenc = new Date(dataBase);
          dataVenc.setDate(dataVenc.getDate() + (i * 30));

          const dataEmissaoParcela = new Date(dataVenc);
          dataEmissaoParcela.setDate(1);

          parcelas_data.push({
            conta_receber_id: conta.id,
            numero_parcela: i + 1,
            data_emissao: dataEmissaoParcela.toISOString().split('T')[0],
            data_vencimento: dataVenc.toISOString().split('T')[0],
            valor_total: valor,
            valor_parcela: valor,
            status: 'aberto',
          });
        }
      }

      const { error: errorParcelas } = await supabase
        .from('contas_receber_parcelas')
        .insert(parcelas_data);

      if (errorParcelas) throw errorParcelas;

      toast({
        title: '✅ Conta cadastrada',
        description: `${parcelas} parcela(s) criada(s) com sucesso!`,
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
          <strong>Parcelado:</strong> Divide o valor total em X parcelas. Emissão = mesma data.<br />
          <strong>Recorrente:</strong> Repete o valor total em cada parcela. Emissão = dia 01 de cada mês.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="data-emissao">Data de Emissão *</Label>
            <Input
              id="data-emissao"
              type="date"
              value={dataEmissao}
              onChange={(e) => setDataEmissao(e.target.value)}
              className="max-w-xs"
            />
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
            <Label>Banco *</Label>
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
              placeholder="Informações adicionais..."
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor Total *</Label>
            <Input
              id="valor"
              placeholder="Ex: 1000,00"
              value={valorTotal}
              onChange={(e) => {
                const valor = e.target.value.replace(/[^\d,]/g, '');
                setValorTotal(valor);
              }}
              className="max-w-xs"
            />
          </div>

          <div className="space-y-3">
            <Label>Tipo de Lançamento *</Label>
            <RadioGroup value={tipoLancamento} onValueChange={setTipoLancamento}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unico" id="unico" />
                <Label htmlFor="unico" className="cursor-pointer">
                  Único (1 parcela)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="parcelado" id="parcelado" />
                <Label htmlFor="parcelado" className="cursor-pointer">
                  Parcelado (divide valor total)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="recorrente" id="recorrente" />
                <Label htmlFor="recorrente" className="cursor-pointer">
                  Recorrente (repete valor total)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parcelas">
                {tipoLancamento === 'unico' ? 'Parcelas (fixo)' : 'Número de Parcelas *'}
              </Label>
              <Input
                id="parcelas"
                type="number"
                min="1"
                value={numeroParcelas}
                onChange={(e) => setNumeroParcelas(e.target.value)}
                disabled={tipoLancamento === 'unico'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vencimento">Primeiro Vencimento *</Label>
              <Input
                id="vencimento"
                type="date"
                value={primeiroVencimento}
                onChange={(e) => setPrimeiroVencimento(e.target.value)}
              />
            </div>
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
