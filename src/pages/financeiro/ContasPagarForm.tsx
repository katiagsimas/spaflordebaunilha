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
import { ArrowLeft, Plus, Info } from 'lucide-react';

export default function ContasPagarForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEdicao = !!id;

  // Estados do formulário
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().split('T')[0]);
  const [fornecedorId, setFornecedorId] = useState('');
  const [tipoDocumentoId, setTipoDocumentoId] = useState('');
  const [planoContasId, setPlanoContasId] = useState('');
  const [bancoId, setBancoId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [numeroParcelas, setNumeroParcelas] = useState('1');
  const [primeiroVencimento, setPrimeiroVencimento] = useState('');
  const [tipoLancamento, setTipoLancamento] = useState('unico');
  const [diaVencimentoRecorrente, setDiaVencimentoRecorrente] = useState('');

  // Dados para picklists
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<any[]>([]);
  const [planosContas, setPlanosContas] = useState<any[]>([]);
  const [bancos, setBancos] = useState<any[]>([]);

  // Modal cadastro de fornecedor
  const [modalFornecedor, setModalFornecedor] = useState(false);
  const [novoFornecedorNome, setNovoFornecedorNome] = useState('');
  const [novoFornecedorCpfCnpj, setNovoFornecedorCpfCnpj] = useState('');
  const [novoFornecedorEmail, setNovoFornecedorEmail] = useState('');
  const [novoFornecedorTelefone, setNovoFornecedorTelefone] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDados();
    if (isEdicao) {
      fetchConta();
    }
  }, [id]);

  const fetchDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fornecedores
      const { data: dataFornecedores } = await supabase
        .from('fornecedores' as any)
        .select('id, nome')
        .eq('usuario_id', user.id)
        .order('nome');
      setFornecedores(dataFornecedores || []);

      // Tipos de Documentos
      const { data: dataTipos } = await supabase
        .from('tipos_documento')
        .select('id, descricao')
        .eq('usuario_id', user.id)
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

      // Bancos
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

  const fetchConta = async () => {
    try {
      const { data, error } = await supabase
        .from('contas_pagar' as any)
        .select(`
          *,
          parcelas:contas_pagar_parcelas (
            data_vencimento
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return;

      const conta = data as any;

      setDataEmissao(conta.data_emissao);
      setFornecedorId(conta.fornecedor_id);
      setTipoDocumentoId(conta.tipo_documento_id);
      setPlanoContasId(conta.plano_contas_id);
      setBancoId(conta.banco_id);
      setDescricao(conta.descricao || '');
      setValorTotal(conta.valor_total.toFixed(2).replace('.', ','));
      setNumeroParcelas(conta.numero_parcelas.toString());
      setTipoLancamento(conta.tipo_lancamento);
      
      if (conta.e_recorrente) {
        setDiaVencimentoRecorrente(conta.dia_vencimento_recorrente?.toString() || '');
      }

      if (conta.parcelas && conta.parcelas.length > 0) {
        setPrimeiroVencimento(conta.parcelas[0].data_vencimento);
      }
    } catch (error) {
      console.error('Erro ao buscar conta:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados da conta.',
        variant: 'destructive',
      });
    }
  };

  const handleCriarFornecedor = async () => {
    try {
      if (!novoFornecedorNome.trim()) {
        toast({
          title: 'Erro',
          description: 'Informe o nome do fornecedor!',
          variant: 'destructive',
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('fornecedores' as any)
        .insert({
          usuario_id: user.id,
          nome: novoFornecedorNome.trim(),
          cpf_cnpj: novoFornecedorCpfCnpj.trim() || null,
          email: novoFornecedorEmail.trim() || null,
          telefone: novoFornecedorTelefone.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) return;

      const fornecedor = data as any;

      toast({
        title: '✅ Fornecedor criado',
        description: 'O fornecedor foi cadastrado com sucesso!',
      });

      setFornecedores([...fornecedores, { id: fornecedor.id, nome: fornecedor.nome }]);
      setFornecedorId(fornecedor.id);
      setModalFornecedor(false);
      
      // Limpar campos
      setNovoFornecedorNome('');
      setNovoFornecedorCpfCnpj('');
      setNovoFornecedorEmail('');
      setNovoFornecedorTelefone('');
    } catch (error: any) {
      console.error('Erro ao criar fornecedor:', error);
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSalvar = async () => {
    try {
      // Validações
      if (!fornecedorId) {
        toast({
          title: 'Erro',
          description: 'Selecione o fornecedor!',
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

      if (tipoLancamento === 'recorrente' && !diaVencimentoRecorrente) {
        toast({
          title: 'Erro',
          description: 'Informe o dia do vencimento para lançamentos recorrentes!',
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const dadosConta = {
        user_id: user.id,
        fornecedor_id: fornecedorId,
        data_emissao: dataEmissao,
        tipo_documento_id: tipoDocumentoId,
        plano_contas_id: planoContasId,
        banco_id: bancoId,
        descricao: descricao.trim() || null,
        valor_total: valor,
        numero_parcelas: parcelas,
        tipo_lancamento: tipoLancamento,
        e_recorrente: tipoLancamento === 'recorrente',
        dia_vencimento_recorrente: tipoLancamento === 'recorrente' ? parseInt(diaVencimentoRecorrente) : null,
      };

      if (isEdicao) {
        // Atualizar conta existente
        const { error: errorConta } = await supabase
          .from('contas_pagar' as any)
          .update(dadosConta)
          .eq('id', id);

        if (errorConta) throw errorConta;

        // Deletar parcelas antigas
        await supabase
          .from('contas_pagar_parcelas' as any)
          .delete()
          .eq('conta_pagar_id', id);

        // Criar novas parcelas
        await criarParcelas(id as string, valor, parcelas);

        toast({
          title: '✅ Conta atualizada',
          description: 'A conta foi atualizada com sucesso!',
        });
      } else {
        // Criar nova conta
        const { data: conta, error: errorConta } = await supabase
          .from('contas_pagar' as any)
          .insert(dadosConta)
          .select()
          .single();

        if (errorConta) throw errorConta;
        if (!conta) throw new Error('Erro ao criar conta');

        const contaCriada = conta as any;

        // Criar parcelas
        await criarParcelas(contaCriada.id, valor, parcelas);

        toast({
          title: '✅ Conta criada',
          description: `${parcelas} parcela(s) criada(s) com sucesso!`,
        });
      }

      navigate('/financeiro/contas-pagar');
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

  const criarParcelas = async (contaId: string, valor: number, parcelas: number) => {
    const parcelas_data = [];
    const dataBase = new Date(primeiroVencimento + 'T00:00:00');

    if (tipoLancamento === 'parcelado' || tipoLancamento === 'unico') {
      // Parcelado: divide o valor total
      const valorParcela = valor / parcelas;

      for (let i = 0; i < parcelas; i++) {
        const dataVenc = new Date(dataBase);
        dataVenc.setMonth(dataVenc.getMonth() + i);

        parcelas_data.push({
          conta_pagar_id: contaId,
          numero_parcela: i + 1,
          data_emissao: dataEmissao,
          data_vencimento: dataVenc.toISOString().split('T')[0],
          valor_total: valor,
          valor_parcela: valorParcela,
          status: 'aberto',
        });
      }
    } else {
      // Recorrente: repete o valor total
      const dia = parseInt(diaVencimentoRecorrente);

      for (let i = 0; i < parcelas; i++) {
        const dataVenc = new Date(dataBase);
        dataVenc.setMonth(dataVenc.getMonth() + i);
        dataVenc.setDate(dia);

        const dataEmissaoParcela = new Date(dataVenc);
        dataEmissaoParcela.setDate(1);

        parcelas_data.push({
          conta_pagar_id: contaId,
          numero_parcela: i + 1,
          data_emissao: dataEmissaoParcela.toISOString().split('T')[0],
          data_vencimento: dataVenc.toISOString().split('T')[0],
          valor_total: valor,
          valor_parcela: valor,
          status: 'aberto',
        });
      }
    }

    const { error } = await supabase
      .from('contas_pagar_parcelas' as any)
      .insert(parcelas_data);

    if (error) throw error;
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/financeiro/contas-pagar')}>
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
      <Alert className={isEdicao ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"}>
        <Info className={isEdicao ? "h-4 w-4 text-amber-600" : "h-4 w-4 text-blue-600"} />
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
            <div className="flex justify-between items-center">
              <Label>Fornecedor *</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModalFornecedor(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Fornecedor
              </Button>
            </div>
            <Select value={fornecedorId} onValueChange={setFornecedorId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o fornecedor..." />
              </SelectTrigger>
              <SelectContent>
                {fornecedores.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <Select value={planoContasId} onValueChange={setPlanoContasId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {planosContas.map((plano: any) => (
                    <SelectItem key={plano.id} value={plano.id}>
                      {plano.codigo_estruturado} - {plano.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          {/* Dia Vencimento Recorrente */}
          {tipoLancamento === 'recorrente' && (
            <div className="space-y-2">
              <Label htmlFor="dia-vencimento">Dia do Vencimento *</Label>
              <Select value={diaVencimentoRecorrente} onValueChange={setDiaVencimentoRecorrente}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Selecione o dia..." />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(dia => (
                    <SelectItem key={dia} value={dia.toString()}>
                      Dia {dia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/financeiro/contas-pagar')}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button onClick={handleSalvar} disabled={loading} className="flex-1">
          {loading ? 'Salvando...' : (isEdicao ? 'Atualizar Conta' : 'Cadastrar Conta a Pagar')}
        </Button>
      </div>

      {/* Modal Novo Fornecedor */}
      <Dialog open={modalFornecedor} onOpenChange={setModalFornecedor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Fornecedor</DialogTitle>
            <DialogDescription>
              Cadastre um novo fornecedor rapidamente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fornecedor-nome">Nome *</Label>
              <Input
                id="fornecedor-nome"
                placeholder="Nome do fornecedor"
                value={novoFornecedorNome}
                onChange={(e) => setNovoFornecedorNome(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fornecedor-cpfcnpj">CPF/CNPJ</Label>
              <Input
                id="fornecedor-cpfcnpj"
                placeholder="000.000.000-00"
                value={novoFornecedorCpfCnpj}
                onChange={(e) => setNovoFornecedorCpfCnpj(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fornecedor-telefone">Telefone</Label>
              <Input
                id="fornecedor-telefone"
                placeholder="(00) 00000-0000"
                value={novoFornecedorTelefone}
                onChange={(e) => setNovoFornecedorTelefone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fornecedor-email">E-mail</Label>
              <Input
                id="fornecedor-email"
                type="email"
                placeholder="fornecedor@email.com"
                value={novoFornecedorEmail}
                onChange={(e) => setNovoFornecedorEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalFornecedor(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCriarFornecedor}>
              Criar Fornecedor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
