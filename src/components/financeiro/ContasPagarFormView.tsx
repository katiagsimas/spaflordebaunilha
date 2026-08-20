import { useState, useEffect } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';

import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getTodayISO, addMonthsToDate, addDaysToDate } from '@/lib/dateUtils';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { FornecedorAutocomplete } from '@/components/FornecedorAutocomplete';
import { LoadingMascote } from '@/components/LoadingMascote';
import { Info, Check, ChevronsUpDown, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContasPagarFormViewProps {
  contaId?: string;
  onSucesso: () => void;
  onCancelar: () => void;
}

export default function ContasPagarFormView({
  contaId,
  onSucesso,
  onCancelar,
}: ContasPagarFormViewProps) {

  const { toast } = useToast();
  const navigate = useNavigate();
  const isEdicao = !!contaId;

  // Estados do formulário
  const [dataEmissao, setDataEmissao] = useState(getTodayISO());
  const [fornecedorId, setFornecedorId] = useState('');
  const [fornecedorNome, setFornecedorNome] = useState('');
  const [tipoDocumentoId, setTipoDocumentoId] = useState('');
  const [planoContasId, setPlanoContasId] = useState('');
  const [bancoId, setBancoId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [numeroParcelas, setNumeroParcelas] = useState('1');
  const [primeiroVencimento, setPrimeiroVencimento] = useState('');
  const [tipoLancamento, setTipoLancamento] = useState('unico');

  // Dados para picklists
  const [tiposDocumento, setTiposDocumento] = useState<any[]>([]);
  const [planosContas, setPlanosContas] = useState<any[]>([]);
  const [bancos, setBancos] = useState<any[]>([]);

  // Estados para Combobox Plano de Contas
  const [openPlanoContas, setOpenPlanoContas] = useState(false);
  const [searchPlanoContas, setSearchPlanoContas] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingConta, setLoadingConta] = useState(isEdicao);
  const [parcelasGeradas, setParcelasGeradas] = useState<any[]>([]);
  const [parcelasEditadas, setParcelasEditadas] = useState(false);

  useEffect(() => {
    fetchDados();
  }, []);

  useEffect(() => {
    if (isEdicao && contaId) {
      fetchConta(contaId);
    }
  }, [contaId, isEdicao]);

  const fetchConta = async (id: string) => {
    try {
      setLoadingConta(true);
      const { data, error } = await supabase
        .from('contas_pagar' as any)
        .select(`
          *,
          fornecedor:fornecedores ( nome ),
          parcelas:contas_pagar_parcelas ( data_vencimento )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      const c = data as any;
      setDataEmissao(c?.data_emissao || getTodayISO());
      setFornecedorId(c?.fornecedor_id || '');
      setFornecedorNome(c?.fornecedor?.nome || '');
      setTipoDocumentoId(c?.tipo_documento_id || '');
      setPlanoContasId(c?.plano_contas_id || '');
      setBancoId(c?.banco_id || '');
      setDescricao(c?.descricao || '');
      setValorTotal(c?.valor_total ? Number(c.valor_total).toFixed(2).replace('.', ',') : '');
      setNumeroParcelas(c?.numero_parcelas ? String(c.numero_parcelas) : '1');
      setTipoLancamento(c?.tipo_lancamento || 'unico');
      setPrimeiroVencimento(
        c?.parcelas && c.parcelas.length > 0 ? c.parcelas[0].data_vencimento : ''
      );
    } catch (error) {
      console.error('Erro ao buscar conta:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados da conta.',
        variant: 'destructive',
      });
      navigate('/financeiro/contas-pagar');
    } finally {
      setLoadingConta(false);
    }
  };

  const fetchDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Tipos de Documentos
      const { data: dataTipos } = await supabase
        .from('tipos_documento')
        .select('id, descricao')
        .eq('usuario_id', user.id)
        .eq('habilitado', true)
        .eq('ativo', true)
        .order('descricao');
      setTiposDocumento(dataTipos || []);

      // Planos de Contas (apenas débito/despesas)
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

      const planosDebito = (dataPlanos || []).filter(
        (p: any) => p.categoria?.indicador === 'Debito'
      );
      setPlanosContas(planosDebito);

      // Bancos habilitados
      const { data: dataBancos } = await supabase
        .from('bancos')
        .select('id, codigo, nome')
        .eq('usuario_id', user.id)
        .eq('habilitado', true)
        .order('nome');
      setBancos(dataBancos || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  const handleFornecedorSelect = (fornecedorId: string, fornecedorNome: string) => {
    setFornecedorId(fornecedorId);
    setFornecedorNome(fornecedorNome);
  };

  const handleEditarParcela = (index: number, campo: string, valor: any) => {
    const novasParcelas = [...parcelasGeradas];

    if (campo === 'valor_parcela') {
      const valorNumerico = parseFloat(valor.replace(',', '.'));
      novasParcelas[index][campo] = isNaN(valorNumerico) ? 0 : valorNumerico;
    } else {
      novasParcelas[index][campo] = valor;
    }

    setParcelasGeradas(novasParcelas);
    setParcelasEditadas(true);
  };

  const handleGerarParcelas = () => {
    const erros: string[] = [];

    if (!fornecedorId) erros.push('• Fornecedor');
    if (!tipoDocumentoId) erros.push('• Tipo de Documento');
    if (!planoContasId) erros.push('• Plano de Contas');
    if (!bancoId) erros.push('• Banco');

    const valor = parseFloat(valorTotal.replace(',', '.'));
    if (!valor || valor <= 0) erros.push('• Valor Total (deve ser maior que zero)');

    const parcelas = parseInt(numeroParcelas);
    if (!parcelas || parcelas < 1) erros.push('• Número de Parcelas (deve ser maior que zero)');

    if (!primeiroVencimento) erros.push('• Data do Primeiro Vencimento');

    if (erros.length > 0) {
      toast({
        title: '⚠️ Preencha os campos obrigatórios',
        description: (
          <div className="mt-2">
            <p className="font-semibold mb-1">Campos faltando:</p>
            {erros.map((erro, idx) => (
              <div key={idx} className="text-sm">{erro}</div>
            ))}
          </div>
        ),
        variant: 'destructive',
        duration: 6000,
      });
      return;
    }

    const parcelas_geradas = [];

    if (tipoLancamento === 'parcelado' || tipoLancamento === 'unico') {
      const valorParcela = valor / parcelas;

      for (let i = 0; i < parcelas; i++) {
        parcelas_geradas.push({
          numero_parcela: i + 1,
          data_emissao: dataEmissao,
          data_vencimento: addMonthsToDate(primeiroVencimento, i),
          valor_total: valor,
          valor_parcela: valorParcela,
          status: 'aberto',
        });
      }
    } else {
      for (let i = 0; i < parcelas; i++) {
        parcelas_geradas.push({
          numero_parcela: i + 1,
          data_emissao: addDaysToDate(dataEmissao, i * 30),
          data_vencimento: addDaysToDate(primeiroVencimento, i * 30),
          valor_total: valor,
          valor_parcela: valor,
          status: 'aberto',
        });
      }
    }

    setParcelasGeradas(parcelas_geradas);
    setParcelasEditadas(false);

    toast({
      title: '✅ Parcelas geradas',
      description: `${parcelas_geradas.length} parcela(s) gerada(s) com sucesso!`,
    });
  };

  const handleSalvar = async () => {

    try {
      if (parcelasGeradas.length === 0) {
        toast({
          title: 'Erro',
          description: 'Gere as parcelas antes de salvar!',
          variant: 'destructive',
        });
        return;
      }

      const valorTotalNum = parseFloat(valorTotal.replace(',', '.'));

      if (tipoLancamento !== 'recorrente') {
        const totalParcelas = parcelasGeradas.reduce((acc, p) => acc + p.valor_parcela, 0);

        if (Math.abs(totalParcelas - valorTotalNum) > 0.01) {
          toast({
            title: 'Erro',
            description: `A soma das parcelas (${totalParcelas.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            })}) não corresponde ao valor total (${valorTotalNum.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            })})`,
            variant: 'destructive',
          });
          return;
        }
      }

      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const dadosConta = {
        usuario_id: user.id,
        fornecedor_id: fornecedorId,
        data_emissao: dataEmissao,
        tipo_documento_id: tipoDocumentoId,
        plano_contas_id: planoContasId,
        banco_id: bancoId,
        descricao: descricao.trim() || null,
        valor_total: valorTotalNum,
        numero_parcelas: parseInt(numeroParcelas),
        tipo_lancamento: tipoLancamento,
        e_recorrente: tipoLancamento === 'recorrente',
      };

      if (isEdicao && contaId) {
        const { error: errorConta } = await supabase
          .from('contas_pagar' as any)
          .update(dadosConta)
          .eq('id', contaId);

        if (errorConta) throw errorConta;

        await supabase
          .from('contas_pagar_parcelas' as any)
          .delete()
          .eq('conta_pagar_id', contaId);

        const parcelasParaInserir = parcelasGeradas.map(p => ({
          ...p,
          conta_pagar_id: contaId,
        }));

        const { error: errorParcelas } = await supabase
          .from('contas_pagar_parcelas' as any)
          .insert(parcelasParaInserir);

        if (errorParcelas) throw errorParcelas;

        toast({
          title: '✅ Conta atualizada',
          description: 'A conta foi atualizada com sucesso!',
        });
      } else {
        const { data: conta, error: errorConta } = await supabase
          .from('contas_pagar' as any)
          .insert(dadosConta)
          .select()
          .single();

        if (errorConta) throw errorConta;
        if (!conta) throw new Error('Erro ao criar conta');

        const contaCriada = conta as any;

        const parcelasParaInserir = parcelasGeradas.map(p => ({
          ...p,
          conta_pagar_id: contaCriada.id,
        }));

        const { error: errorParcelas } = await supabase
          .from('contas_pagar_parcelas' as any)
          .insert(parcelasParaInserir);

        if (errorParcelas) throw errorParcelas;

        toast({
          title: '✅ Conta criada',
          description: `${parcelasGeradas.length} parcela(s) criada(s) com sucesso!`,
        });
      }

      onSucesso();
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

  if (loadingConta) {
    return (
      <div className="container mx-auto p-6 space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancelar}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Contas a Pagar</h1>
        </div>
        <div className="flex justify-center py-12">
          <LoadingMascote size={72} label="Carregando dados..." />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancelar}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdicao ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
          </h1>
          <p className="text-muted-foreground">
            {isEdicao ? 'Edite a conta e as parcelas serão recalculadas' : 'Cadastre uma nova conta a pagar'}
          </p>
        </div>
      </div>

      {/* Alert Informativo */}
      <Alert className={isEdicao ? "bg-amber-50 border-amber-200" : "bg-sfb-areia/10 border-sfb-areia/40"}>
        <Info className={isEdicao ? "h-4 w-4 text-amber-600" : "h-4 w-4 text-primary"} />
        <AlertDescription>
          {isEdicao ? (
            <>
              <strong>Atenção:</strong> Ao salvar, todas as parcelas serão recalculadas com base nos novos valores.
            </>
          ) : (
            <>
              <strong>Parcelado:</strong> Divide o valor total em X parcelas. Emissão = mesma data.<br />
              <strong>Recorrente:</strong> Repete o valor total em cada parcela. Emissão = dia 01 de cada mês.
            </>
          )}
        </AlertDescription>
      </Alert>

      {/* Card Principal */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Data de Emissão */}
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

          {/* Fornecedor */}
          <div className="space-y-2">
            <Label>Fornecedor *</Label>
            <FornecedorAutocomplete
              value={fornecedorId}
              onSelect={handleFornecedorSelect}
              placeholder="Selecione o fornecedor..."
            />
          </div>

          {/* Tipo Documento e Plano Contas */}
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
                  <Command className="bg-popover" shouldFilter={false}>
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

          {/* Descrição */}
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

          {/* Valor Total */}
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

          {/* Tipo de Lançamento */}
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

          {/* Número de Parcelas e Vencimento */}
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

          {/* Banco */}
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
        </CardContent>
      </Card>

      {/* Tabela de Parcelas Geradas */}
      {parcelasGeradas.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Parcelas Geradas</CardTitle>
              {parcelasEditadas && (
                <span className="text-xs text-warning">
                  ⚠️ Parcelas editadas
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Vencimento</th>
                    <th className="p-2 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {parcelasGeradas.map((parcela, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">{parcela.numero_parcela}</td>
                      <td className="p-2">
                        <Input
                          type="date"
                          value={parcela.data_vencimento}
                          onChange={(e) => handleEditarParcela(index, 'data_vencimento', e.target.value)}
                          className="w-40"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <Input
                          type="text"
                          placeholder="0,00"
                          value={parcela.valor_parcela.toFixed(2).replace('.', ',')}
                          onChange={(e) => {
                            let valor = e.target.value;
                            valor = valor.replace(/[^\d,]/g, '');
                            const partes = valor.split(',');
                            if (partes.length > 2) {
                              valor = partes[0] + ',' + partes.slice(1).join('');
                            }
                            if (partes[1] && partes[1].length > 2) {
                              valor = partes[0] + ',' + partes[1].substring(0, 2);
                            }
                            handleEditarParcela(index, 'valor_parcela', valor);
                          }}
                          className="w-40 text-right ml-auto"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted font-semibold">
                  <tr>
                    <td colSpan={2} className="p-2 text-right">Total:</td>
                    <td className="p-2 text-right">
                      {parcelasGeradas.reduce((acc, p) => acc + p.valor_parcela, 0).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões de Ação */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onCancelar}
          disabled={loading}
          className="flex-1"
        >
          Cancelar
        </Button>

        {parcelasGeradas.length === 0 ? (
          <Button onClick={handleGerarParcelas} disabled={loading} className="flex-1">
            Gerar Parcelas
          </Button>
        ) : (
          <Button onClick={handleSalvar} disabled={loading} className="flex-1">
            {loading ? 'Salvando...' : (isEdicao ? 'Atualizar Conta' : 'Cadastrar Conta a Pagar')}
          </Button>
        )}
      </div>
    </div>
  );
}
