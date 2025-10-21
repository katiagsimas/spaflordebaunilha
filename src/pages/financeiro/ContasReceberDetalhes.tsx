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
import { ArrowLeft, Edit, Calendar, User, FileText, Building2, DollarSign, Info } from 'lucide-react';

export default function ContasReceberDetalhes() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const [conta, setConta] = useState(null);
  const [parcelas, setParcelas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetalhes();
  }, [id]);

  const fetchDetalhes = async () => {
    try {
      // Buscar conta principal
      const { data: dataConta, error: errorConta } = await supabase
        .from('contas_receber')
        .select(`
          *,
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
      setConta(dataConta);

      // Buscar parcelas
      const { data: dataParcelas, error: errorParcelas } = await supabase
        .from('contas_receber_parcelas')
        .select('*')
        .eq('conta_receber_id', id)
        .order('numero_parcela');

      if (errorParcelas) throw errorParcelas;
      setParcelas(dataParcelas || []);

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
    const totalParcelas = parcelas.reduce((acc, p) => acc + p.valor_parcela, 0);
    const totalPago = parcelas.reduce((acc, p) => acc + (p.valor_pago || 0), 0);
    const totalAberto = totalParcelas - totalPago;
    const parcelasPagas = parcelas.filter(p => p.status === 'pago' || p.status === 'adiantado').length;
    const parcelasAbertas = parcelas.filter(p => p.status === 'aberto' || p.status === 'atrasado').length;

    return {
      totalParcelas,
      totalPago,
      totalAberto,
      parcelasPagas,
      parcelasAbertas,
      totalParcelasCount: parcelas.length,
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
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Valor Total</span>
                <span className="font-medium text-lg text-green-600">
                  {formatarValor(conta.valor_total)}
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
                <span className="text-sm text-muted-foreground">Total Pago</span>
                <span className="font-medium text-green-600">
                  {formatarValor(totais.totalPago)}
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

      {/* Observações */}
      {parcelas.some(p => p.observacao) && (
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
