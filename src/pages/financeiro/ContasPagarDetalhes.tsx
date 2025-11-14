import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/LoadingState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Edit, 
  Trash2, 
  DollarSign, 
  MoreVertical,
  FileText,
  Calendar,
  User,
  TrendingDown,
  Download,
  CreditCard,
  RefreshCw,
  Upload,
  X,
  Info,
  Building2,
  Edit2
} from 'lucide-react';
import DarBaixaPagarDialog from '@/components/financeiro/DarBaixaPagarDialog';
import { BackButton } from '@/components/BackButton';

export default function ContasPagarDetalhes() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const [conta, setConta] = useState<any>(null);
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [comprovantes, setComprovantes] = useState<Record<string, any[]>>({});

  // Estados para listas
  const [bancos, setBancos] = useState<any[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<any[]>([]);

  // Estados para modal de dar baixa
  const [modalDarBaixa, setModalDarBaixa] = useState(false);
  const [parcelaSelecionada, setParcelaSelecionada] = useState<any>(null);

  // Estados para edição de pagamento
  const [modalEditarPagamento, setModalEditarPagamento] = useState(false);
  const [pagamentoEditando, setPagamentoEditando] = useState<any>(null);
  const [dataEditando, setDataEditando] = useState('');
  const [valorEditando, setValorEditando] = useState('');
  const [jurosEditando, setJurosEditando] = useState('');
  const [descontoEditando, setDescontoEditando] = useState('');
  const [bancoEditando, setBancoEditando] = useState('');
  const [tipoDocEditando, setTipoDocEditando] = useState('');
  const [obsEditando, setObsEditando] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  // Estados para estorno
  const [modalEstorno, setModalEstorno] = useState(false);
  const [pagamentoEstornando, setPagamentoEstornando] = useState<any>(null);
  const [motivoEstorno, setMotivoEstorno] = useState('');

  useEffect(() => {
    fetchDetalhes();
    fetchDadosAdicionais();
  }, [id]);

  const fetchDetalhes = async () => {
    try {
      console.log('🔍 Buscando detalhes da conta:', id);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar conta principal COM TODOS OS DADOS DO FORNECEDOR
      const { data: dataConta, error: errorConta } = await supabase
        .from('contas_pagar')
        .select(`
          id,
          data_emissao,
          tipo_documento_id,
          plano_contas_id,
          banco_id,
          fornecedor_id,
          descricao,
          valor_total,
          numero_parcelas,
          tipo_lancamento,
          e_recorrente,
          observacoes,
          created_at,
          fornecedor:fornecedores (
            id,
            nome,
            cpf_cnpj,
            email,
            telefone,
            tipo,
            contato,
            observacoes
          ),
          tipo_documento:tipos_documento (
            descricao
          ),
          plano_contas:plano_contas (
            codigo_estruturado,
            descricao
          ),
          banco:bancos (
            codigo,
            nome
          )
        `)
        .eq('id', id)
        .single();

      if (errorConta) throw errorConta;
      
      console.log('✅ Conta carregada:', dataConta);
      console.log('👤 Dados do fornecedor:', dataConta.fornecedor);
      console.log('Valor total:', dataConta.valor_total);
      
      setConta(dataConta);

      // Buscar parcelas
      const { data: dataParcelas, error: errorParcelas } = await supabase
        .from('contas_pagar_parcelas')
        .select('*')
        .eq('conta_pagar_id', id)
        .order('numero_parcela');

      if (errorParcelas) throw errorParcelas;
      
      console.log('Parcelas carregadas:', dataParcelas?.length);
      
      setParcelas(dataParcelas || []);

      // Buscar histórico de pagamentos
      if (dataParcelas && dataParcelas.length > 0) {
        const parcelaIds = dataParcelas.map(p => p.id);
        
        const { data: dataPagamentos, error: errorPagamentos } = await supabase
          .from('contas_pagar_pagamentos')
          .select('*')
          .in('parcela_id', parcelaIds)
          .order('data_pagamento', { ascending: false });

        if (errorPagamentos) throw errorPagamentos;
        
        console.log('Pagamentos carregados:', dataPagamentos?.length);
        
        // Buscar dados de bancos e tipos de documento para os pagamentos
        if (dataPagamentos && dataPagamentos.length > 0) {
          const bancoIds = [...new Set(dataPagamentos.map(p => p.banco_id).filter(Boolean))];
          const tipoDocIds = [...new Set(dataPagamentos.map(p => p.tipo_documento_id).filter(Boolean))];
          
          // Buscar bancos habilitados
          const { data: bancosData } = await supabase
            .from('bancos')
            .select('id, codigo, nome')
            .in('id', bancoIds)
            .eq('habilitado', true);
          
          // Buscar tipos de documento
          const { data: tiposDocData } = await supabase
            .from('tipos_documento')
            .select('id, descricao')
            .in('id', tipoDocIds);
          
          // Criar mapas para lookup rápido
          const bancosMap = (bancosData || []).reduce((acc, b) => {
            acc[b.id] = b;
            return acc;
          }, {} as Record<string, any>);
          
          const tiposDocMap = (tiposDocData || []).reduce((acc, t) => {
            acc[t.id] = t;
            return acc;
          }, {} as Record<string, any>);
          
          // Enriquecer pagamentos com dados de banco e tipo_documento
          const pagamentosEnriquecidos = dataPagamentos.map(pag => ({
            ...pag,
            banco: bancosMap[pag.banco_id] || null,
            tipo_documento: tiposDocMap[pag.tipo_documento_id] || null,
          }));
          
          setPagamentos(pagamentosEnriquecidos);
          
          // Buscar comprovantes
          const ids = dataPagamentos.map(p => p.id);
          await fetchComprovantes(ids);
        } else {
          setPagamentos([]);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os detalhes.',
        variant: 'destructive',
      });
      navigate('/financeiro/contas-pagar');
    } finally {
      setLoading(false);
    }
  };

  const fetchDadosAdicionais = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar bancos
      const { data: dataBancos } = await supabase
        .from('bancos')
        .select('id, codigo, nome')
        .eq('usuario_id', user.id)
        .order('nome');

      setBancos(dataBancos || []);

      // Buscar tipos de documentos
      const { data: dataTipos } = await supabase
        .from('tipos_documento')
        .select('id, descricao')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('descricao');

      setTiposDocumento(dataTipos || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  const fetchComprovantes = async (pagamentosIds: string[]) => {
    try {
      const { data } = await supabase
        .from('contas_pagar_comprovantes')
        .select('*')
        .in('pagamento_id', pagamentosIds);

      if (data) {
        const comprovantesMap: Record<string, any[]> = {};
        data.forEach(comp => {
          if (!comprovantesMap[comp.pagamento_id]) {
            comprovantesMap[comp.pagamento_id] = [];
          }
          comprovantesMap[comp.pagamento_id].push(comp);
        });
        setComprovantes(comprovantesMap);
      }
    } catch (error) {
      console.error('Erro ao buscar comprovantes:', error);
    }
  };

  const handleExcluirConta = async () => {
    try {
      const confirmar = window.confirm(
        'Tem certeza que deseja excluir esta conta?\n\n' +
        'Esta ação excluirá todas as parcelas e pagamentos relacionados.\n' +
        'Esta ação não pode ser desfeita!'
      );

      if (!confirmar) return;

      const { error } = await supabase
        .from('contas_pagar')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: '✅ Conta excluída',
        description: 'A conta foi excluída com sucesso!',
      });

      navigate('/financeiro/contas-pagar');
    } catch (error: any) {
      console.error('Erro ao excluir conta:', error);
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAbrirEdicaoPagamento = (pagamento: any) => {
    setPagamentoEditando(pagamento);
    setDataEditando(pagamento.data_pagamento);
    setValorEditando(pagamento.valor_pago.toString().replace('.', ','));
    setJurosEditando((pagamento.juros || 0).toString().replace('.', ','));
    setDescontoEditando((pagamento.desconto || 0).toString().replace('.', ','));
    setBancoEditando(pagamento.banco_id);
    setTipoDocEditando(pagamento.tipo_documento_id);
    setObsEditando(pagamento.observacao || '');
    setModalEditarPagamento(true);
  };

  const handleSalvarEdicaoPagamento = async () => {
    try {
      if (!bancoEditando) {
        toast({
          title: 'Erro',
          description: 'Selecione o banco!',
          variant: 'destructive',
        });
        return;
      }

      if (!tipoDocEditando) {
        toast({
          title: 'Erro',
          description: 'Selecione o tipo de documento!',
          variant: 'destructive',
        });
        return;
      }

      const valor = parseFloat(valorEditando.replace(',', '.'));
      if (!valor || valor <= 0) {
        toast({
          title: 'Erro',
          description: 'Informe um valor válido!',
          variant: 'destructive',
        });
        return;
      }

      setSalvandoEdicao(true);

      const juros = parseFloat(jurosEditando.replace(',', '.')) || 0;
      const desconto = parseFloat(descontoEditando.replace(',', '.')) || 0;

      const { error } = await supabase
        .from('contas_pagar_pagamentos')
        .update({
          data_pagamento: dataEditando,
          valor_pago: valor,
          juros: juros,
          desconto: desconto,
          banco_id: bancoEditando,
          tipo_documento_id: tipoDocEditando,
          observacao: obsEditando.trim() || null,
        })
        .eq('id', pagamentoEditando.id);

      if (error) throw error;

      toast({
        title: '✅ Pagamento atualizado',
        description: 'As alterações foram salvas com sucesso!',
      });

      setModalEditarPagamento(false);
      fetchDetalhes();
    } catch (error: any) {
      console.error('Erro ao editar pagamento:', error);
      toast({
        title: 'Erro ao editar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const handleExcluirPagamento = async (pagamento: any) => {
    try {
      const confirmar = window.confirm(
        `Tem certeza que deseja excluir este pagamento de ${formatarValor(parseFloat(pagamento.valor_pago))}?\n\n` +
        `Esta ação não pode ser desfeita e o status da parcela será recalculado.`
      );

      if (!confirmar) return;

      // 1. Buscar e deletar comprovantes do storage
      const { data: comprovantes } = await supabase
        .from('contas_pagar_comprovantes')
        .select('*')
        .eq('pagamento_id', pagamento.id);

      if (comprovantes && comprovantes.length > 0) {
        for (const comp of comprovantes) {
          // Extrair caminho do arquivo da URL
          const url = new URL(comp.url_storage);
          const path = url.pathname.split('/storage/v1/object/public/comprovantes-pagar/')[1];
          
          if (path) {
            await supabase.storage
              .from('comprovantes-pagar')
              .remove([path]);
          }
        }

        // Deletar registros de comprovantes
        await supabase
          .from('contas_pagar_comprovantes')
          .delete()
          .eq('pagamento_id', pagamento.id);
      }

      // 2. Deletar o pagamento (trigger atualiza a parcela automaticamente)
      const { error } = await supabase
        .from('contas_pagar_pagamentos')
        .delete()
        .eq('id', pagamento.id);

      if (error) throw error;

      toast({
        title: '✅ Pagamento excluído',
        description: 'O pagamento foi removido e a parcela foi recalculada.',
      });

      fetchDetalhes();
    } catch (error: any) {
      console.error('Erro ao excluir pagamento:', error);
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAbrirEstorno = (pagamento: any) => {
    setPagamentoEstornando(pagamento);
    setMotivoEstorno('');
    setModalEstorno(true);
  };

  const handleConfirmarEstorno = async () => {
    try {
      if (!motivoEstorno.trim()) {
        toast({
          title: 'Erro',
          description: 'Informe o motivo do estorno!',
          variant: 'destructive',
        });
        return;
      }

      if (motivoEstorno.trim().length < 10) {
        toast({
          title: 'Erro',
          description: 'O motivo deve ter pelo menos 10 caracteres!',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('contas_pagar_pagamentos')
        .update({
          estornado: true,
          data_estorno: new Date().toISOString(),
          motivo_estorno: motivoEstorno.trim(),
        })
        .eq('id', pagamentoEstornando.id);

      if (error) throw error;

      toast({
        title: '✅ Pagamento estornado',
        description: 'O estorno foi registrado e a parcela foi recalculada.',
      });

      setModalEstorno(false);
      fetchDetalhes();
    } catch (error: any) {
      console.error('Erro ao estornar pagamento:', error);
      toast({
        title: 'Erro ao estornar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleReverterEstorno = async (pagamento: any) => {
    try {
      const confirmar = window.confirm(
        `Tem certeza que deseja REVERTER o estorno deste pagamento de ${formatarValor(parseFloat(pagamento.valor_pago))}?\n\n` +
        `O pagamento voltará a ser contabilizado na parcela.`
      );

      if (!confirmar) return;

      const { error } = await supabase
        .from('contas_pagar_pagamentos')
        .update({
          estornado: false,
          data_estorno: null,
          motivo_estorno: null,
        })
        .eq('id', pagamento.id);

      if (error) throw error;

      toast({
        title: '✅ Estorno revertido',
        description: 'O pagamento foi reativado com sucesso.',
      });

      fetchDetalhes();
    } catch (error: any) {
      console.error('Erro ao reverter estorno:', error);
      toast({
        title: 'Erro ao reverter',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const formatarData = (dataISO: string | null) => {
    if (!dataISO) return '-';
    const data = new Date(dataISO + 'T00:00:00');
    return data.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatarValor = (valor: number) => {
    if (!valor) return 'R$ 0,00';
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const getBadgeStatus = (status: string) => {
    const badges: Record<string, JSX.Element> = {
      aberto: <Badge variant="outline">Aberto</Badge>,
      pago: <Badge className="bg-green-100 text-green-700 border-green-300">Pago</Badge>,
      pagamento_parcial: <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Pagamento Parcial</Badge>,
      atrasado: <Badge className="bg-red-100 text-red-700 border-red-300">Atrasado</Badge>,
      adiantado: <Badge className="bg-blue-100 text-blue-700 border-blue-300">Adiantado</Badge>,
    };
    return badges[status] || <Badge variant="outline">{status}</Badge>;
  };

  const getBadgeTipoLancamento = (tipo: string) => {
    const badges: Record<string, JSX.Element> = {
      unico: <Badge variant="outline" className="bg-gray-100">Único</Badge>,
      parcelado: <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">Parcelado</Badge>,
      recorrente: <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">Recorrente</Badge>,
    };
    return badges[tipo] || <Badge variant="outline">{tipo}</Badge>;
  };

  const calcularTotais = () => {
    // Filtrar apenas pagamentos não estornados
    const pagamentosValidos = pagamentos.filter(p => !p.estornado);
    
    // Total PAGO (apenas valor pago, sem juros/descontos)
    const totalPago = pagamentosValidos.reduce((acc, p) => acc + (parseFloat(p.valor_pago) || 0), 0);
    
    // Total de juros
    const totalJuros = pagamentosValidos.reduce((acc, p) => acc + (parseFloat(p.juros) || 0), 0);
    
    // Total de descontos
    const totalDescontos = pagamentosValidos.reduce((acc, p) => acc + (parseFloat(p.desconto) || 0), 0);
    
    // Total líquido (pago + juros - descontos)
    const totalLiquido = totalPago + totalJuros - totalDescontos;
    
    // Total das parcelas
    const totalParcelas = parcelas.reduce((acc, p) => acc + (parseFloat(p.valor_parcela) || 0), 0);
    const totalSomaParcelas = totalParcelas;
    
    // Total em aberto
    const totalAberto = totalParcelas - totalLiquido;
    
    // Contadores
    const parcelasPagas = parcelas.filter(p => p.status === 'pago' || p.status === 'adiantado').length;
    const parcelasAbertas = parcelas.filter(p => p.status === 'aberto' || p.status === 'atrasado' || p.status === 'pagamento_parcial').length;
    const totalParcelasCount = parcelas.length;

    return {
      totalPago,
      totalJuros,
      totalDescontos,
      totalLiquido,
      totalAberto,
      totalSomaParcelas,
      parcelasPagas,
      parcelasAbertas,
      totalParcelasCount,
    };
  };

  if (loading) return <LoadingState message="Carregando Detalhes" submessage="Buscando informações da conta..." />;
  if (!conta) return <div className="flex justify-center p-8">Conta não encontrada</div>;

  const totais = calcularTotais();

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton to="/financeiro/contas-pagar" label="" />
          <div>
            <h1 className="text-3xl font-bold">Detalhes da Conta a Pagar</h1>
            <p className="text-muted-foreground">
              Informações completas e histórico de pagamentos
            </p>
          </div>
        </div>
        <Button onClick={() => navigate(`/financeiro/contas-pagar/editar/${conta.id}`)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar Conta
        </Button>
      </div>

      {/* Informações Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Informações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Data de Emissão</p>
                <p className="font-medium">{formatarData(conta.data_emissao)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Fornecedor</p>
                <p className="font-medium">{conta.fornecedor?.nome || 'N/A'}</p>
                {conta.fornecedor?.email && (
                  <p className="text-sm text-muted-foreground">{conta.fornecedor.email}</p>
                )}
                {conta.fornecedor?.telefone && (
                  <p className="text-sm text-muted-foreground">{conta.fornecedor.telefone}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Tipo de Documento</p>
                <p className="font-medium">{conta.tipo_documento?.descricao || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Banco</p>
                <p className="font-medium">{conta.banco?.codigo} - {conta.banco?.nome}</p>
              </div>
            </div>

            {conta.descricao && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                  <p className="text-sm">{conta.descricao}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card Resumo Financeiro */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Valor Total:</span>
                <span className="font-bold text-red-600 text-lg">{formatarValor(conta.valor_total)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Pago:</span>
                <span className="font-medium text-green-600">{formatarValor(totais.totalLiquido)}</span>
              </div>
              
              {totais.totalJuros > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Juros:</span>
                  <span className="text-red-600">+ {formatarValor(totais.totalJuros)}</span>
                </div>
              )}
              
              {totais.totalDescontos > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Descontos:</span>
                  <span className="text-blue-600">- {formatarValor(totais.totalDescontos)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Saldo Restante:</span>
                <span className="font-bold text-orange-600">{formatarValor(totais.totalAberto)}</span>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Tipo Lançamento</p>
                <div className="mt-1">
                  {getBadgeTipoLancamento(conta.tipo_lancamento)}
                </div>
              </div>
              
              <div>
                <p className="text-muted-foreground">Parcelas</p>
                <p className="font-medium mt-1">
                  {totais.parcelasPagas} de {totais.totalParcelasCount} pagas
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Plano de Contas</p>
              <p className="text-sm font-medium mt-1">
                {conta.plano_contas?.codigo_estruturado} - {conta.plano_contas?.descricao}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parcelas e Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Parcelas e Pagamentos</CardTitle>
          <CardDescription>
            Histórico detalhado de todas as parcelas e pagamentos realizados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {parcelas.map((parcela) => {
            // Filtrar pagamentos desta parcela
            const pagamentosParcela = pagamentos.filter(p => p.parcela_id === parcela.id);
            
            return (
              <div key={parcela.id} className="border rounded-lg p-4 space-y-4">
                {/* Cabeçalho da Parcela */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">
                        Parcela {parcela.numero_parcela} de {conta.numero_parcelas}
                      </h3>
                      {getBadgeStatus(parcela.status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Vencimento: <span className="font-medium text-foreground">{formatarData(parcela.data_vencimento)}</span></p>
                      <p>Valor da Parcela: <span className="font-medium text-red-600">{formatarValor(parcela.valor_parcela)}</span></p>
                      {parcela.valor_pago > 0 && (
                        <p>Valor Pago: <span className="font-medium text-green-600">{formatarValor(parcela.valor_pago)}</span></p>
                      )}
                      {parcela.data_pagamento && (
                        <p>Data do Pagamento: <span className="font-medium text-foreground">{formatarData(parcela.data_pagamento)}</span></p>
                      )}
                    </div>
                  </div>

                  {/* Menu de Ações da Parcela */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {parcela.status !== 'pago' && parcela.status !== 'adiantado' && (
                        <DropdownMenuItem onClick={() => {
                          setParcelaSelecionada(parcela);
                          setModalDarBaixa(true);
                        }}>
                          <DollarSign className="mr-2 h-4 w-4 text-green-600" />
                          Dar Baixa
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Histórico de Pagamentos da Parcela */}
                {pagamentosParcela.length > 0 ? (
                  <div className="space-y-3">
                    <Separator />
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Histórico de Pagamentos
                    </h4>
                    
                    {pagamentosParcela.map((pag: any) => (
                      <div
                        key={pag.id}
                        className={`p-3 rounded-lg border ${
                          pag.estornado 
                            ? 'bg-red-50 border-red-200' 
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            {/* Dados do Pagamento */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                              <div>
                                <span className="text-muted-foreground">Data:</span>
                                <span className="ml-2 font-medium">
                                  {formatarData(pag.data_pagamento)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Valor Pago:</span>
                                <span className="ml-2 font-medium text-green-600">
                                  {formatarValor(pag.valor_pago)}
                                </span>
                              </div>

                              {pag.juros > 0 && (
                                <div>
                                  <span className="text-muted-foreground">Juros:</span>
                                  <span className="ml-2 font-medium text-red-600">
                                    {formatarValor(pag.juros)}
                                  </span>
                                </div>
                              )}

                              {pag.desconto > 0 && (
                                <div>
                                  <span className="text-muted-foreground">Desconto:</span>
                                  <span className="ml-2 font-medium text-blue-600">
                                    {formatarValor(pag.desconto)}
                                  </span>
                                </div>
                              )}

                              <div>
                                <span className="text-muted-foreground">Banco:</span>
                                <span className="ml-2 font-medium">
                                  {pag.banco?.codigo} - {pag.banco?.nome}
                                </span>
                              </div>

                              <div>
                                <span className="text-muted-foreground">Tipo Doc:</span>
                                <span className="ml-2 font-medium">
                                  {pag.tipo_documento?.descricao}
                                </span>
                              </div>
                            </div>

                            {/* Valor Líquido */}
                            <div className="pt-2 border-t">
                              <span className="text-sm text-muted-foreground">Valor Líquido:</span>
                              <span className="ml-2 font-bold text-green-600">
                                {formatarValor(pag.valor_pago + (pag.juros || 0) - (pag.desconto || 0))}
                              </span>
                            </div>

                            {/* Observação */}
                            {pag.observacao && (
                              <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground">Observação:</p>
                                <p className="text-sm">{pag.observacao}</p>
                              </div>
                            )}

                            {/* Comprovantes */}
                            {comprovantes[pag.id] && comprovantes[pag.id].length > 0 && (
                              <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground mb-2">Comprovantes:</p>
                                <div className="flex flex-wrap gap-2">
                                  {comprovantes[pag.id].map((comp: any) => (
                                    <a
                                      key={comp.id}
                                      href={comp.url_storage}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs bg-white px-3 py-1.5 rounded border hover:bg-gray-50 flex items-center gap-2"
                                    >
                                      <FileText className="h-3 w-3" />
                                      {comp.nome_arquivo}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Informação de Estorno */}
                            {pag.estornado && (
                              <div className="pt-2 border-t bg-red-100 -m-3 mt-2 p-3 rounded-b-lg">
                                <div className="flex items-start gap-2">
                                  <RefreshCw className="h-4 w-4 text-red-600 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-red-900">
                                      Pagamento Estornado
                                    </p>
                                    <p className="text-xs text-red-700">
                                      Data do estorno: {new Date(pag.data_estorno).toLocaleString('pt-BR')}
                                    </p>
                                    {pag.motivo_estorno && (
                                      <p className="text-xs text-red-700 mt-1">
                                        Motivo: {pag.motivo_estorno}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Menu de Ações do Pagamento */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!pag.estornado ? (
                                <>
                                  <DropdownMenuItem onClick={() => handleAbrirEdicaoPagamento(pag)}>
                                    <Edit2 className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAbrirEstorno(pag)}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Estornar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleExcluirPagamento(pag)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <DropdownMenuItem onClick={() => handleReverterEstorno(pag)}>
                                  <RefreshCw className="mr-2 h-4 w-4 text-green-600" />
                                  Reverter Estorno
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded">
                    Nenhum pagamento registrado nesta parcela
                  </div>
                )}

                {parcela.observacao && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">Observação:</p>
                    <p className="text-sm">{parcela.observacao}</p>
                  </div>
                )}
              </div>
            );
          })}

          {parcelas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma parcela encontrada.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Dar Baixa */}
      <DarBaixaPagarDialog
        open={modalDarBaixa}
        onOpenChange={setModalDarBaixa}
        parcela={parcelaSelecionada}
        onSuccess={() => {
          fetchDetalhes();
          setModalDarBaixa(false);
        }}
      />

      {/* Modal Editar Pagamento */}
      <Dialog open={modalEditarPagamento} onOpenChange={setModalEditarPagamento}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Pagamento</DialogTitle>
            <DialogDescription>
              Altere as informações do pagamento registrado
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data-edit">Data do Pagamento *</Label>
                <Input
                  id="data-edit"
                  type="date"
                  value={dataEditando}
                  onChange={(e) => setDataEditando(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor-edit">Valor Pago *</Label>
                <Input
                  id="valor-edit"
                  placeholder="Ex: 35,00"
                  value={valorEditando}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/[^\d,]/g, '');
                    setValorEditando(valor);
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="juros-edit">Juros</Label>
                <Input
                  id="juros-edit"
                  placeholder="0,00"
                  value={jurosEditando}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/[^\d,]/g, '');
                    setJurosEditando(valor);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="desconto-edit">Desconto</Label>
                <Input
                  id="desconto-edit"
                  placeholder="0,00"
                  value={descontoEditando}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/[^\d,]/g, '');
                    setDescontoEditando(valor);
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Banco *</Label>
                <Select value={bancoEditando} onValueChange={setBancoEditando}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bancos.map((banco: any) => (
                      <SelectItem key={banco.id} value={banco.id}>
                        {banco.codigo} - {banco.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Documento *</Label>
                <Select value={tipoDocEditando} onValueChange={setTipoDocEditando}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposDocumento.map((tipo: any) => (
                      <SelectItem key={tipo.id} value={tipo.id}>
                        {tipo.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="obs-edit">Observação</Label>
              <Textarea
                id="obs-edit"
                placeholder="Informações adicionais..."
                rows={3}
                value={obsEditando}
                onChange={(e) => setObsEditando(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setModalEditarPagamento(false)}
              disabled={salvandoEdicao}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSalvarEdicaoPagamento}
              disabled={salvandoEdicao}
            >
              {salvandoEdicao ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Estorno */}
      <Dialog open={modalEstorno} onOpenChange={setModalEstorno}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estornar Pagamento</DialogTitle>
            <DialogDescription>
              Informe o motivo para estornar este pagamento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                O estorno irá reverter o pagamento e recalcular o status da parcela.
                Esta ação pode ser desfeita posteriormente se necessário.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="motivo-estorno">Motivo do Estorno *</Label>
              <Textarea
                id="motivo-estorno"
                placeholder="Descreva o motivo do estorno (mínimo 10 caracteres)..."
                rows={4}
                value={motivoEstorno}
                onChange={(e) => setMotivoEstorno(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {motivoEstorno.length}/10 caracteres (mínimo)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setModalEstorno(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmarEstorno}
            >
              Confirmar Estorno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
