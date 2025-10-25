import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  const { id } = useParams();
  const { toast } = useToast();
  const isEditMode = !!id;

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

  const [openPlanoContas, setOpenPlanoContas] = useState(false);
  const [searchPlanoContas, setSearchPlanoContas] = useState('');

  const [modalClienteAberto, setModalClienteAberto] = useState(false);
  const [formDataCliente, setFormDataCliente] = useState({
    nome: '',
    tipo: 'PF',
    telefone: '',
    email: '',
    cpf_cnpj: '',
    data_aniversario: '',
    cep: '',
    endereco: '',
    numero: '',
    cidade: '',
    estado: '',
    observacoes: '',
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);

  useEffect(() => {
    fetchDados();
    if (isEditMode) {
      fetchContaReceber();
    }
  }, [id]);

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
          categoria:categorias_plano_contas!inner (
            indicador
          )
        `)
        .eq('user_id', user.id)
        .eq('ativo', true)
        .eq('categoria.indicador', 'Credito')
        .order('codigo_estruturado');

      setPlanosContas(dataPlanos || []);

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

  const fetchContaReceber = async () => {
    try {
      const { data, error } = await supabase
        .from('contas_receber')
        .select(`
          *,
          parcelas:contas_receber_parcelas (
            data_vencimento
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setDataEmissao(data.data_emissao);
      setClienteId(data.cliente_id);
      setTipoDocumentoId(data.tipo_documento_id);
      setPlanoContasId(data.plano_conta_id);
      setBancoId(data.banco_id);
      setDescricao(data.descricao || '');
      setValorTotal(data.valor.toString().replace('.', ','));
      setNumeroParcelas(data.numero_parcelas.toString());
      setTipoLancamento(data.tipo_lancamento);

      if (data.parcelas && data.parcelas.length > 0) {
        setPrimeiroVencimento(data.parcelas[0].data_vencimento);
      }

    } catch (error) {
      console.error('Erro ao buscar conta:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados da conta.',
        variant: 'destructive',
      });
      navigate('/financeiro/contas-receber');
    } finally {
      setLoadingData(false);
    }
  };

  const handleAbrirModalCliente = () => {
    setFormDataCliente({
      nome: buscaCliente,
      tipo: 'PF',
      telefone: '',
      email: '',
      cpf_cnpj: '',
      data_aniversario: '',
      cep: '',
      endereco: '',
      numero: '',
      cidade: '',
      estado: '',
      observacoes: '',
    });
    setModalClienteAberto(true);
    setPopoverClienteAberto(false);
  };

  const handleBuscarCEP = async () => {
    if (!formDataCliente.cep || formDataCliente.cep.length < 8) {
      toast({
        title: 'Erro',
        description: 'Informe um CEP válido!',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${formDataCliente.cep.replace(/\D/g, '')}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast({
          title: 'Erro',
          description: 'CEP não encontrado!',
          variant: 'destructive',
        });
        return;
      }

      setFormDataCliente({
        ...formDataCliente,
        endereco: data.logradouro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
      });

      toast({
        title: '✅ CEP encontrado',
        description: 'Endereço preenchido automaticamente!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao buscar CEP!',
        variant: 'destructive',
      });
    }
  };

  const handleCriarCliente = async () => {
    try {
      if (!formDataCliente.nome.trim() || !formDataCliente.telefone.trim()) {
        toast({
          title: 'Erro',
          description: 'Nome e telefone são obrigatórios!',
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
          nome: formDataCliente.nome.trim(),
          tipo: formDataCliente.tipo,
          telefone: formDataCliente.telefone.trim(),
          email: formDataCliente.email.trim() || null,
          cpf_cnpj: formDataCliente.cpf_cnpj.trim() || null,
          data_aniversario: formDataCliente.data_aniversario || null,
          cep: formDataCliente.cep.trim() || null,
          endereco: formDataCliente.endereco.trim() || null,
          numero: formDataCliente.numero.trim() || null,
          cidade: formDataCliente.cidade.trim() || null,
          estado: formDataCliente.estado.trim() || null,
          observacoes: formDataCliente.observacoes.trim() || null,
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

      const dadosConta = {
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
      };

      let contaId;

      if (isEditMode) {
        const { error: errorUpdate } = await supabase
          .from('contas_receber')
          .update(dadosConta)
          .eq('id', id);

        if (errorUpdate) throw errorUpdate;

        const { error: errorDeleteParcelas } = await supabase
          .from('contas_receber_parcelas')
          .delete()
          .eq('conta_receber_id', id);

        if (errorDeleteParcelas) throw errorDeleteParcelas;

        contaId = id;
      } else {
        const { data: conta, error: errorConta } = await supabase
          .from('contas_receber')
          .insert({
            usuario_id: user.id,
            ...dadosConta
          })
          .select()
          .single();

        if (errorConta) throw errorConta;
        contaId = conta.id;
      }

      const parcelas_data = [];
      const dataBase = new Date(primeiroVencimento + 'T00:00:00');

      if (tipoLancamento === 'parcelado' || tipoLancamento === 'unico') {
        const valorParcela = valor / parcelas;

        for (let i = 0; i < parcelas; i++) {
          const dataVenc = new Date(dataBase);
          dataVenc.setDate(dataVenc.getDate() + (i * 30));

          parcelas_data.push({
            conta_receber_id: contaId,
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
            conta_receber_id: contaId,
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
        title: isEditMode ? '✅ Conta atualizada' : '✅ Conta cadastrada',
        description: isEditMode 
          ? 'Conta atualizada e parcelas recalculadas!' 
          : `${parcelas} parcela(s) criada(s) com sucesso!`,
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

  if (loadingData) return <div className="flex justify-center p-8">Carregando dados...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/financeiro/contas-receber')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditMode ? 'Editar Conta a Receber' : 'Nova Conta a Receber'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? 'Edite a conta e as parcelas serão recalculadas' : 'Cadastre uma nova conta a receber'}
          </p>
        </div>
      </div>

      <Alert className={isEditMode ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"}>
        <Info className={isEditMode ? "h-4 w-4 text-amber-600" : "h-4 w-4 text-blue-600"} />
        <AlertDescription>
          {isEditMode ? (
            <>
              <strong>Atenção:</strong> Ao salvar, todas as parcelas serão recalculadas com base nos novos valores.
              Pagamentos já registrados serão perdidos.
            </>
          ) : (
            <>
              <strong>Parcelado:</strong> Divide o valor total em X parcelas. Emissão = mesma data.<br />
              <strong>Recorrente:</strong> Repete o valor total em cada parcela. Emissão = dia 01 de cada mês.
            </>
          )}
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
              <Popover open={openPlanoContas} onOpenChange={setOpenPlanoContas}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openPlanoContas}
                    className="w-full justify-between bg-popover"
                  >
                    {planoContasId
                      ? (() => {
                          const plano = planosContas.find((p: any) => p.id === planoContasId);
                          return plano ? `${plano.codigo_estruturado} - ${plano.descricao}` : 'Selecione...';
                        })()
                      : 'Selecione...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-popover z-50" align="start">
                  <Command className="bg-popover">
                    <CommandInput
                      placeholder="Buscar plano de contas..."
                      value={searchPlanoContas}
                      onValueChange={setSearchPlanoContas}
                    />
                    <CommandEmpty>Nenhum plano de contas encontrado.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {planosContas
                        .filter((plano: any) => {
                          const searchLower = searchPlanoContas.toLowerCase();
                          return (
                            plano.codigo_estruturado.toLowerCase().includes(searchLower) ||
                            plano.descricao.toLowerCase().includes(searchLower)
                          );
                        })
                        .map((plano: any) => (
                          <CommandItem
                            key={plano.id}
                            value={plano.id}
                            onSelect={() => {
                              setPlanoContasId(plano.id);
                              setOpenPlanoContas(false);
                              setSearchPlanoContas('');
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                planoContasId === plano.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {plano.codigo_estruturado} - {plano.descricao}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
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
          {loading ? 'Salvando...' : (isEditMode ? 'Atualizar Conta' : 'Cadastrar Conta a Receber')}
        </Button>
      </div>

      <Dialog open={modalClienteAberto} onOpenChange={setModalClienteAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo cliente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formDataCliente.nome}
                  onChange={(e) => setFormDataCliente({ ...formDataCliente, nome: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={formDataCliente.tipo}
                  onValueChange={(value) => setFormDataCliente({ ...formDataCliente, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PF">Pessoa Física</SelectItem>
                    <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
                <Input
                  id="telefone"
                  value={formDataCliente.telefone}
                  onChange={(e) => setFormDataCliente({ ...formDataCliente, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formDataCliente.email}
                  onChange={(e) => setFormDataCliente({ ...formDataCliente, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                <Input
                  id="cpf_cnpj"
                  value={formDataCliente.cpf_cnpj}
                  onChange={(e) => setFormDataCliente({ ...formDataCliente, cpf_cnpj: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_aniversario">Data de Aniversário</Label>
                <Input
                  id="data_aniversario"
                  type="date"
                  value={formDataCliente.data_aniversario}
                  onChange={(e) => setFormDataCliente({ ...formDataCliente, data_aniversario: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="flex gap-2">
                  <Input
                    id="cep"
                    value={formDataCliente.cep}
                    onChange={(e) => setFormDataCliente({ ...formDataCliente, cep: e.target.value })}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBuscarCEP}
                    disabled={!formDataCliente.cep}
                  >
                    Buscar
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formDataCliente.endereco}
                  onChange={(e) => setFormDataCliente({ ...formDataCliente, endereco: e.target.value })}
                  placeholder="Rua, Avenida"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={formDataCliente.numero}
                  onChange={(e) => setFormDataCliente({ ...formDataCliente, numero: e.target.value })}
                  placeholder="Nº"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formDataCliente.cidade}
                  onChange={(e) => setFormDataCliente({ ...formDataCliente, cidade: e.target.value })}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={formDataCliente.estado}
                  onChange={(e) => setFormDataCliente({ ...formDataCliente, estado: e.target.value })}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formDataCliente.observacoes}
                onChange={(e) => setFormDataCliente({ ...formDataCliente, observacoes: e.target.value })}
                placeholder="Digite aqui observações sobre o cliente..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setModalClienteAberto(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleCriarCliente}>
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
