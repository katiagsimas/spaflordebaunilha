import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { 
  ArrowLeft, Edit, Calendar, User, FileText, Building2, DollarSign, 
  Info, AlertTriangle, Edit2, Trash2, Download, MoreVertical 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ContasReceberDetalhes() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const [conta, setConta] = useState(null);
  const [parcelas, setParcelas] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comprovantes, setComprovantes] = useState({});
  
  // Estados para modal de edição
  const [modalEditarPagamento, setModalEditarPagamento] = useState(false);
  const [pagamentoEditando, setPagamentoEditando] = useState(null);
  const [dataPagamentoEdit, setDataPagamentoEdit] = useState('');
  const [valorPagoEdit, setValorPagoEdit] = useState('');
  const [jurosEdit, setJurosEdit] = useState('');
  const [descontoEdit, setDescontoEdit] = useState('');
  const [bancoIdEdit, setBancoIdEdit] = useState('');
  const [tipoDocumentoIdEdit, setTipoDocumentoIdEdit] = useState('');
  const [observacaoEdit, setObservacaoEdit] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  
  // Estados para listas auxiliares
  const [bancos, setBancos] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);

  useEffect(() => {
    fetchDetalhes();
    fetchDadosAdicionais();
  }, [id]);

  const fetchDetalhes = async () => {
    try {
      console.log('Buscando detalhes da conta:', id);

      // Buscar conta principal
      const { data: dataConta, error: errorConta } = await supabase
        .from('contas_receber')
        .select(`
          id,
          data_emissao,
          tipo_documento_id,
          plano_conta_id,
          banco_id,
          cliente_id,
          descricao,
          valor,
          numero_parcelas,
          tipo_lancamento,
          e_recorrente,
          created_at,
          cliente:clientes (
            nome,
            email,
            telefone
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
      
      console.log('Conta carregada:', dataConta);
      console.log('Valor total:', dataConta.valor);
      
      setConta(dataConta);

      // Buscar parcelas
      const { data: dataParcelas, error: errorParcelas } = await supabase
        .from('contas_receber_parcelas')
        .select('*')
        .eq('conta_receber_id', id)
        .order('numero_parcela');

      if (errorParcelas) throw errorParcelas;
      
      console.log('Parcelas carregadas:', dataParcelas?.length);
      
      setParcelas(dataParcelas || []);

      // Buscar histórico de pagamentos
      if (dataParcelas && dataParcelas.length > 0) {
        const parcelaIds = dataParcelas.map(p => p.id);
        
        const { data: dataPagamentos, error: errorPagamentos } = await supabase
          .from('contas_receber_pagamentos')
          .select(`
            *,
            banco:bancos (
              codigo,
              nome
            ),
            tipo_documento:tipos_documento (
              descricao
            )
          `)
          .in('parcela_id', parcelaIds)
          .order('data_pagamento', { ascending: false });

        if (errorPagamentos) throw errorPagamentos;
        
        console.log('Pagamentos carregados:', dataPagamentos?.length);
        
        setPagamentos(dataPagamentos || []);
        
        // Buscar comprovantes
        if (dataPagamentos && dataPagamentos.length > 0) {
          const ids = dataPagamentos.map(p => p.id);
          await fetchComprovantes(ids);
        }
      }

    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os detalhes.',
        variant: 'destructive',
      });
      navigate('/financeiro/contas-receber');
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

  const fetchComprovantes = async (pagamentosIds) => {
    try {
      const { data } = await supabase
        .from('contas_receber_comprovantes')
        .select('*')
        .in('pagamento_id', pagamentosIds);

      if (data) {
        const comprovantesMap = {};
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

  const handleAbrirEdicaoPagamento = (pagamento) => {
    setPagamentoEditando(pagamento);
    setDataPagamentoEdit(pagamento.data_pagamento);
    setValorPagoEdit(pagamento.valor_pago.toString().replace('.', ','));
    setJurosEdit((pagamento.juros || 0).toString().replace('.', ','));
    setDescontoEdit((pagamento.desconto || 0).toString().replace('.', ','));
    setBancoIdEdit(pagamento.banco_id);
    setTipoDocumentoIdEdit(pagamento.tipo_documento_id);
    setObservacaoEdit(pagamento.observacao || '');
    setModalEditarPagamento(true);
  };

  const handleSalvarEdicaoPagamento = async () => {
    try {
      if (!bancoIdEdit) {
        toast({
          title: 'Erro',
          description: 'Selecione o banco!',
          variant: 'destructive',
        });
        return;
      }

      if (!tipoDocumentoIdEdit) {
        toast({
          title: 'Erro',
          description: 'Selecione o tipo de documento!',
          variant: 'destructive',
        });
        return;
      }

      const valor = parseFloat(valorPagoEdit.replace(',', '.'));
      if (!valor || valor <= 0) {
        toast({
          title: 'Erro',
          description: 'Informe um valor válido!',
          variant: 'destructive',
        });
        return;
      }

      setSalvandoEdicao(true);

      const juros = parseFloat(jurosEdit.replace(',', '.')) || 0;
      const desconto = parseFloat(descontoEdit.replace(',', '.')) || 0;

      const { error } = await supabase
        .from('contas_receber_pagamentos')
        .update({
          data_pagamento: dataPagamentoEdit,
          valor_pago: valor,
          juros: juros,
          desconto: desconto,
          banco_id: bancoIdEdit,
          tipo_documento_id: tipoDocumentoIdEdit,
          observacao: observacaoEdit.trim() || null,
        })
        .eq('id', pagamentoEditando.id);

      if (error) throw error;

      toast({
        title: '✅ Pagamento atualizado',
        description: 'As alterações foram salvas com sucesso!',
      });

      setModalEditarPagamento(false);
      fetchDetalhes();
    } catch (error) {
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

  const handleExcluirPagamento = async (pagamento) => {
    try {
      const confirmar = window.confirm(
        `Tem certeza que deseja excluir este pagamento de ${formatarValor(parseFloat(pagamento.valor_pago))}?\n\n` +
        `Esta ação não pode ser desfeita e o status da parcela será recalculado.`
      );

      if (!confirmar) return;

      // 1. Buscar e deletar comprovantes do storage
      const { data: comprovantes } = await supabase
        .from('contas_receber_comprovantes')
        .select('*')
        .eq('pagamento_id', pagamento.id);

      if (comprovantes && comprovantes.length > 0) {
        for (const comp of comprovantes) {
          // Extrair caminho do arquivo da URL
          const url = new URL(comp.url_storage);
          const path = url.pathname.split('/storage/v1/object/public/comprovantes-receber/')[1];
          
          if (path) {
            await supabase.storage
              .from('comprovantes-receber')
              .remove([path]);
          }
        }

        // Deletar registros de comprovantes
        await supabase
          .from('contas_receber_comprovantes')
          .delete()
          .eq('pagamento_id', pagamento.id);
      }

      // 2. Deletar o pagamento (trigger atualiza a parcela automaticamente)
      const { error } = await supabase
        .from('contas_receber_pagamentos')
        .delete()
        .eq('id', pagamento.id);

      if (error) throw error;

      toast({
        title: '✅ Pagamento excluído',
        description: 'O pagamento foi removido e a parcela foi recalculada.',
      });

      fetchDetalhes();
    } catch (error) {
      console.error('Erro ao excluir pagamento:', error);
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const formatarData = (dataISO) => {
    if (!dataISO) return '-';
    const data = new Date(dataISO + 'T00:00:00');
    return data.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatarValor = (valor) => {
    if (!valor) return 'R$ 0,00';
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const getBadgeStatus = (status) => {
    const badges = {
      aberto: <Badge variant="outline">Aberto</Badge>,
      pago: <Badge className="bg-green-100 text-green-700 border-green-300">Pago</Badge>,
      pagamento_parcial: <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Pagamento Parcial</Badge>,
      atrasado: <Badge className="bg-red-100 text-red-700 border-red-300">Atrasado</Badge>,
      adiantado: <Badge className="bg-blue-100 text-blue-700 border-blue-300">Adiantado</Badge>,
    };
    return badges[status] || <Badge variant="outline">{status}</Badge>;
  };

  const getBadgeTipoLancamento = (tipo) => {
    const badges = {
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
    const totalSomaParcelas = totalParcelas; // Alias para manter compatibilidade
    
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

  if (loading) return <div className="flex justify-center p-8">Carregando...</div>;
  if (!conta) return <div className="flex justify-center p-8">Conta não encontrada</div>;

  const totais = calcularTotais();

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/financeiro/contas-receber')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Detalhes da Conta a Receber</h1>
            <p className="text-muted-foreground">
              Informações completas e histórico de pagamentos
            </p>
          </div>
        </div>
        <Button onClick={() => navigate(`/financeiro/contas-receber/editar/${conta.id}`)}>
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
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{conta.cliente?.nome || 'N/A'}</p>
                {conta.cliente?.email && (
                  <p className="text-sm text-muted-foreground">{conta.cliente.email}</p>
                )}
                {conta.cliente?.telefone && (
                  <p className="text-sm text-muted-foreground">{conta.cliente.telefone}</p>
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
                <p className="font-medium">
                  {conta.banco?.codigo} - {conta.banco?.nome || 'N/A'}
                </p>
              </div>
            </div>

            {conta.descricao && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                <p className="text-sm">{conta.descricao}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card Valores e Parcelamento */}
        <Card>
          <CardHeader>
            <CardTitle>Valores e Parcelamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Plano de Contas</p>
                <p className="font-medium">
                  {conta.plano_contas?.codigo_estruturado} - {conta.plano_contas?.descricao}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Valor Total da Conta</span>
                <span className="font-medium text-lg text-green-600">
                  {conta.valor ? formatarValor(conta.valor) : 'R$ 0,00'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {conta.numero_parcelas === 1 ? 'Valor da Parcela' : 'Valor da Próxima Parcela'}
                </span>
                <span className="font-medium text-lg text-red-600">
                  {(() => {
                    const proximaParcelaAberta = parcelas
                      .filter(p => p.status === 'aberto' || p.status === 'atrasado' || p.status === 'pagamento_parcial')
                      .sort((a, b) => {
                        const dateA = new Date(a.data_vencimento).getTime();
                        const dateB = new Date(b.data_vencimento).getTime();
                        return dateA - dateB;
                      })[0];
                    
                    if (proximaParcelaAberta) {
                      return formatarValor(Number(proximaParcelaAberta.valor_parcela));
                    }
                    return 'R$ 0,00';
                  })()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tipo de Lançamento</span>
                {getBadgeTipoLancamento(conta.tipo_lancamento)}
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Número de Parcelas</span>
                <span className="font-medium">{conta.numero_parcelas}x</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Pago (Principal)</span>
                <span className="font-medium text-green-600">
                  {formatarValor(totais.totalPago)}
                </span>
              </div>

              {totais.totalJuros > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">+ Juros</span>
                  <span className="font-medium text-red-600">
                    {formatarValor(totais.totalJuros)}
                  </span>
                </div>
              )}

              {totais.totalDescontos > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">- Descontos</span>
                  <span className="font-medium text-blue-600">
                    {formatarValor(totais.totalDescontos)}
                  </span>
                </div>
              )}

              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm font-medium">Total Líquido Recebido</span>
                <span className="font-bold text-green-700">
                  {formatarValor(totais.totalLiquido)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total em Aberto</span>
                <span className="font-medium text-red-600">
                  {formatarValor(totais.totalAberto)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Parcelas Pagas</span>
                <span className="font-medium">
                  {totais.parcelasPagas} de {totais.totalParcelasCount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debug - Remover depois de corrigir */}
      {(!conta.valor || conta.valor === 0) && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <strong>Debug:</strong> Valor total não encontrado no banco.
            <br />
            <strong>Soma das parcelas:</strong> {formatarValor(totais.totalSomaParcelas)}
            <br />
            <em>Execute o SQL de correção no Supabase.</em>
          </AlertDescription>
        </Alert>
      )}

      {/* Histórico de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <CardDescription>
            Acompanhe todas as parcelas e seus respectivos pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Parcela</TableHead>
                  <TableHead>Data Emissão</TableHead>
                  <TableHead>Data Vencimento</TableHead>
                  <TableHead>Valor Parcela</TableHead>
                  <TableHead>Valor Pago</TableHead>
                  <TableHead>Data Pagamento</TableHead>
                  <TableHead>Juros</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parcelas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Nenhuma parcela encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  parcelas.map(parcela => (
                    <TableRow key={parcela.id}>
                      <TableCell className="font-mono font-medium">
                        {parcela.numero_parcela} de {conta.numero_parcelas}
                      </TableCell>
                      <TableCell>{formatarData(parcela.data_emissao)}</TableCell>
                      <TableCell>{formatarData(parcela.data_vencimento)}</TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatarValor(parcela.valor_parcela)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {parcela.valor_pago ? (
                          <span className="text-green-600">{formatarValor(parcela.valor_pago)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {parcela.data_pagamento ? (
                          formatarData(parcela.data_pagamento)
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {parcela.juros ? (
                          <span className="text-red-600">{formatarValor(parcela.juros)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {parcela.desconto ? (
                          <span className="text-green-600">{formatarValor(parcela.desconto)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getBadgeStatus(parcela.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {parcelas.length > 0 && (
            <Alert className="mt-4 bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <strong>Parcelas pagas:</strong> {totais.parcelasPagas}
                  </div>
                  <div>
                    <strong>Parcelas em aberto:</strong> {totais.parcelasAbertas}
                  </div>
                  <div>
                    <strong>Total parcelas:</strong> {totais.totalParcelasCount}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Histórico Detalhado de Pagamentos */}
      {pagamentos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico Detalhado de Pagamentos</CardTitle>
            <CardDescription>
              Todos os pagamentos, juros e descontos registrados em cada parcela
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {parcelas.map(parcela => {
                const pagamentosParcela = pagamentos.filter(p => p.parcela_id === parcela.id && !p.estornado);
                
                if (pagamentosParcela.length === 0) return null;

                // Calcular totais
                const totalValorPago = pagamentosParcela.reduce((acc, p) => acc + parseFloat(p.valor_pago || 0), 0);
                const totalJuros = pagamentosParcela.reduce((acc, p) => acc + parseFloat(p.juros || 0), 0);
                const totalDesconto = pagamentosParcela.reduce((acc, p) => acc + parseFloat(p.desconto || 0), 0);
                const totalLiquido = totalValorPago + totalJuros - totalDesconto;

                return (
                  <div key={parcela.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">
                          Parcela {parcela.numero_parcela} de {conta.numero_parcelas}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Vencimento: {formatarData(parcela.data_vencimento)} | 
                          Valor: {formatarValor(parcela.valor_parcela)}
                        </p>
                      </div>
                      {getBadgeStatus(parcela.status)}
                    </div>

                    <div className="border-t pt-3">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-32">Tipo</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Banco</TableHead>
                            <TableHead>Tipo Doc</TableHead>
                            <TableHead>Observação</TableHead>
                            <TableHead className="w-24">Comprovante</TableHead>
                            <TableHead className="w-20 text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pagamentosParcela.map((pag) => (
                            <>
                              {/* Linha do Pagamento Principal */}
                              <TableRow key={`pag-${pag.id}`}>
                                <TableCell>
                                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                    Pagamento
                                  </Badge>
                                </TableCell>
                                <TableCell>{formatarData(pag.data_pagamento)}</TableCell>
                                <TableCell className="font-medium text-green-600">
                                  {formatarValor(parseFloat(pag.valor_pago))}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {pag.banco?.codigo} - {pag.banco?.nome}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {pag.tipo_documento?.descricao}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {pag.observacao || '-'}
                                </TableCell>
                                <TableCell>
                                  {comprovantes[pag.id] && comprovantes[pag.id].length > 0 ? (
                                    <div className="flex flex-col gap-1">
                                      {comprovantes[pag.id].map(comp => (
                                        <a
                                          key={comp.id}
                                          href={comp.url_storage}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                        >
                                          <FileText className="h-3 w-3" />
                                          Ver
                                        </a>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleAbrirEdicaoPagamento(pag)}>
                                        <Edit2 className="mr-2 h-4 w-4" />
                                        Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleExcluirPagamento(pag)}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Excluir
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>

                              {/* Linha de Juros (se houver) */}
                              {pag.juros && parseFloat(pag.juros) > 0 && (
                                <TableRow key={`juros-${pag.id}`} className="bg-red-50/50">
                                  <TableCell>
                                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                                      Juros
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{formatarData(pag.data_pagamento)}</TableCell>
                                  <TableCell className="font-medium text-red-600">
                                    + {formatarValor(parseFloat(pag.juros))}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {pag.banco?.codigo} - {pag.banco?.nome}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {pag.tipo_documento?.descricao}
                                  </TableCell>
                                  <TableCell className="text-xs text-red-600">
                                    Juros por atraso
                                  </TableCell>
                                  <TableCell>-</TableCell>
                                  <TableCell>-</TableCell>
                                </TableRow>
                              )}

                              {/* Linha de Desconto (se houver) */}
                              {pag.desconto && parseFloat(pag.desconto) > 0 && (
                                <TableRow key={`desc-${pag.id}`} className="bg-blue-50/50">
                                  <TableCell>
                                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                                      Desconto
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{formatarData(pag.data_pagamento)}</TableCell>
                                  <TableCell className="font-medium text-blue-600">
                                    - {formatarValor(parseFloat(pag.desconto))}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {pag.banco?.codigo} - {pag.banco?.nome}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {pag.tipo_documento?.descricao}
                                  </TableCell>
                                  <TableCell className="text-xs text-blue-600">
                                    Desconto concedido
                                  </TableCell>
                                  <TableCell>-</TableCell>
                                  <TableCell>-</TableCell>
                                </TableRow>
                              )}
                            </>
                          ))}

                          {/* Linha de Totais */}
                          <TableRow className="bg-muted/50 font-medium">
                            <TableCell colSpan={2} className="font-bold">
                              TOTAIS:
                            </TableCell>
                            <TableCell className="font-bold">
                              <div className="space-y-1">
                                <div className="text-green-600">
                                  Pago: {formatarValor(totalValorPago)}
                                </div>
                                {totalJuros > 0 && (
                                  <div className="text-red-600 text-sm">
                                    + Juros: {formatarValor(totalJuros)}
                                  </div>
                                )}
                                {totalDesconto > 0 && (
                                  <div className="text-blue-600 text-sm">
                                    - Desconto: {formatarValor(totalDesconto)}
                                  </div>
                                )}
                                <div className="pt-1 border-t text-primary">
                                  Líquido: {formatarValor(totalLiquido)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell colSpan={5} className="text-sm text-muted-foreground">
                              {pagamentosParcela.length} pagamento(s) registrado(s)
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Editar Pagamento */}
      <Dialog open={modalEditarPagamento} onOpenChange={setModalEditarPagamento}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Pagamento</DialogTitle>
            <DialogDescription>
              Altere as informações do pagamento
            </DialogDescription>
          </DialogHeader>

          {pagamentoEditando && (
            <div className="space-y-4 py-4">
              {/* Info do Pagamento */}
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <strong>Atenção:</strong> Ao editar, a parcela será recalculada automaticamente.
                </AlertDescription>
              </Alert>

              {/* Data e Valor */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data-edit">Data do Pagamento *</Label>
                  <Input
                    id="data-edit"
                    type="date"
                    value={dataPagamentoEdit}
                    onChange={(e) => setDataPagamentoEdit(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor-edit">Valor Pago *</Label>
                  <Input
                    id="valor-edit"
                    placeholder="Ex: 100,00"
                    value={valorPagoEdit}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/[^\d,]/g, '');
                      setValorPagoEdit(valor);
                    }}
                  />
                </div>
              </div>

              {/* Juros e Descontos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="juros-edit">Juros</Label>
                  <Input
                    id="juros-edit"
                    placeholder="0,00"
                    value={jurosEdit}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/[^\d,]/g, '');
                      setJurosEdit(valor);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desconto-edit">Desconto</Label>
                  <Input
                    id="desconto-edit"
                    placeholder="0,00"
                    value={descontoEdit}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/[^\d,]/g, '');
                      setDescontoEdit(valor);
                    }}
                  />
                </div>
              </div>

              {/* Banco e Tipo Doc */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Banco *</Label>
                  <Select value={bancoIdEdit} onValueChange={setBancoIdEdit}>
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
                  <Label>Tipo de Documento *</Label>
                  <Select value={tipoDocumentoIdEdit} onValueChange={setTipoDocumentoIdEdit}>
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
              </div>

              {/* Observação */}
              <div className="space-y-2">
                <Label htmlFor="obs-edit">Observação</Label>
                <Textarea
                  id="obs-edit"
                  placeholder="Informações adicionais..."
                  rows={3}
                  value={observacaoEdit}
                  onChange={(e) => setObservacaoEdit(e.target.value)}
                />
              </div>
            </div>
          )}

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

      {/* Observações */}
      {parcelas && parcelas.length > 0 && parcelas.some(p => p.observacao) && (
        <Card>
          <CardHeader>
            <CardTitle>Observações das Parcelas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {parcelas
                .filter(p => p.observacao)
                .map(parcela => (
                  <div key={parcela.id} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-medium text-sm">
                        Parcela {parcela.numero_parcela}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        - {formatarData(parcela.data_vencimento)}
                      </span>
                    </div>
                    <p className="text-sm">{parcela.observacao}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
