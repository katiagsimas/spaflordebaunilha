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
import { ArrowLeft, Edit, Calendar, User, FileText, Building2, DollarSign, Info, AlertTriangle } from 'lucide-react';

export default function ContasReceberDetalhes() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const [conta, setConta] = useState(null);
  const [parcelas, setParcelas] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetalhes();
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
    const totalSomaParcelas = parcelas.reduce((acc, p) => acc + (p.valor_parcela || 0), 0);
    const totalPago = parcelas.reduce((acc, p) => acc + (p.valor_pago || 0), 0);
    const totalAberto = totalSomaParcelas - totalPago;
    const parcelasPagas = parcelas.filter(p => p.status === 'pago' || p.status === 'adiantado').length;
    const parcelasAbertas = parcelas.filter(p => p.status === 'aberto' || p.status === 'atrasado').length;
    const totalParcelasCount = parcelas.length;

    return {
      totalSomaParcelas,
      totalPago,
      totalAberto,
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
                <span className="text-sm text-muted-foreground">
                  {conta.numero_parcelas === 1 ? 'Total Pago (Parcela)' : 'Pago na Próxima Parcela'}
                </span>
                <span className="font-medium text-green-600">
                  {(() => {
                    const proximaParcelaAberta = parcelas
                      .filter(p => p.status === 'aberto' || p.status === 'atrasado' || p.status === 'pagamento_parcial')
                      .sort((a, b) => {
                        const dateA = new Date(a.data_vencimento).getTime();
                        const dateB = new Date(b.data_vencimento).getTime();
                        return dateA - dateB;
                      })[0];
                    
                    if (proximaParcelaAberta) {
                      return formatarValor(Number(proximaParcelaAberta.valor_pago || 0));
                    }
                    return formatarValor(totais.totalPago);
                  })()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  {conta.numero_parcelas === 1 ? 'Saldo em Aberto (Parcela)' : 'Em Aberto na Próxima Parcela'}
                </span>
                <span className="font-medium text-red-600">
                  {(() => {
                    const proximaParcelaAberta = parcelas
                      .filter(p => p.status === 'aberto' || p.status === 'atrasado' || p.status === 'pagamento_parcial')
                      .sort((a, b) => {
                        const dateA = new Date(a.data_vencimento).getTime();
                        const dateB = new Date(b.data_vencimento).getTime();
                        return dateA - dateB;
                      })[0];
                    
                    if (proximaParcelaAberta) {
                      const saldoAberto = Number(proximaParcelaAberta.valor_parcela) - Number(proximaParcelaAberta.valor_pago || 0);
                      return formatarValor(saldoAberto);
                    }
                    return formatarValor(totais.totalAberto);
                  })()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Parcelas Pagas</span>
                <span className="font-medium">
                  {totais.parcelasPagas} de {totais.totalParcelasCount}
                </span>
              </div>

              {/* Histórico de Pagamentos da Parcela Selecionada */}
              {(() => {
                const proximaParcelaAberta = parcelas
                  .filter(p => p.status === 'aberto' || p.status === 'atrasado' || p.status === 'pagamento_parcial')
                  .sort((a, b) => {
                    const dateA = new Date(a.data_vencimento).getTime();
                    const dateB = new Date(b.data_vencimento).getTime();
                    return dateA - dateB;
                  })[0];

                if (!proximaParcelaAberta) return null;

                const pagamentosDaParcela = pagamentos.filter(p => p.parcela_id === proximaParcelaAberta.id);
                
                if (pagamentosDaParcela.length === 0) return null;

                return (
                  <div className="pt-3 mt-3 border-t space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      Histórico - Parcela {proximaParcelaAberta.numero_parcela}
                    </p>
                    {pagamentosDaParcela.map((pagamento, idx) => (
                      <div key={pagamento.id} className="bg-muted/30 rounded-md p-2 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Pagamento #{idx + 1}</span>
                          <span className="text-sm font-semibold text-green-600">
                            {formatarValor(Number(pagamento.valor_pago))}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div>📅 {formatarData(pagamento.data_pagamento)}</div>
                          <div>🏦 {pagamento.banco?.nome || '-'}</div>
                          <div>📄 {pagamento.tipo_documento?.descricao || '-'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
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

      {/* Tabela de Pagamentos Realizados */}
      <Card>
        <CardHeader>
          <CardTitle>Pagamentos Realizados</CardTitle>
          <CardDescription>
            Histórico completo de todos os pagamentos efetuados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Data Pagamento</TableHead>
                  <TableHead className="text-right">Valor Pago</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Tipo Documento</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagamentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum pagamento registrado ainda. Use "Dar Baixa" nas parcelas para registrar pagamentos.
                    </TableCell>
                  </TableRow>
                ) : (
                  pagamentos.map((pagamento) => {
                    const parcela = parcelas.find(p => p.id === pagamento.parcela_id);
                    if (!pagamento || !parcela) return null;
                    
                    return (
                      <TableRow key={pagamento.id}>
                        <TableCell className="font-medium">
                          {parcela.numero_parcela}/{conta.numero_parcelas || 1}
                        </TableCell>
                        <TableCell>{formatarData(pagamento.data_pagamento)}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {formatarValor(Number(pagamento.valor_pago))}
                        </TableCell>
                        <TableCell>{pagamento.banco?.nome || '-'}</TableCell>
                        <TableCell>{pagamento.tipo_documento?.descricao || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {pagamento.observacao || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
