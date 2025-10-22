import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  DollarSign, 
  MoreVertical,
  FileText,
  Calendar,
  User,
  TrendingDown,
  Eye,
  Download,
  CreditCard,
  RefreshCw
} from 'lucide-react';

export default function ContasPagarDetalhes() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const [conta, setConta] = useState<any>(null);
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetalhes();
  }, [id]);

  const fetchDetalhes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar conta
      const { data: dataConta, error: errorConta } = await supabase
        .from('contas_pagar' as any)
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
          created_at,
          fornecedor:fornecedores (
            nome,
            cpf_cnpj,
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
        .from('contas_pagar_parcelas' as any)
        .select('*')
        .eq('conta_pagar_id', id)
        .order('numero_parcela', { ascending: true });

      if (errorParcelas) throw errorParcelas;
      setParcelas(dataParcelas || []);
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os detalhes da conta.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
        .from('contas_pagar' as any)
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

  const handleExcluirParcela = async (parcelaId: string) => {
    try {
      const confirmar = window.confirm(
        'Tem certeza que deseja excluir esta parcela?\n\n' +
        'Esta ação excluirá todos os pagamentos relacionados.\n' +
        'Esta ação não pode ser desfeita!'
      );

      if (!confirmar) return;

      const { error } = await supabase
        .from('contas_pagar_parcelas' as any)
        .delete()
        .eq('id', parcelaId);

      if (error) throw error;

      toast({
        title: '✅ Parcela excluída',
        description: 'A parcela foi excluída com sucesso!',
      });

      fetchDetalhes();
    } catch (error: any) {
      console.error('Erro ao excluir parcela:', error);
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const formatarData = (dataISO: string) => {
    if (!dataISO) return '-';
    const data = new Date(dataISO + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');
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
      aberto: <Badge variant="outline">Em Aberto</Badge>,
      pago: <Badge className="bg-green-100 text-green-700 border-green-300">Pago</Badge>,
      pagamento_parcial: <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Pago Parcialmente</Badge>,
      atrasado: <Badge className="bg-red-100 text-red-700 border-red-300">Atrasado</Badge>,
      adiantado: <Badge className="bg-blue-100 text-blue-700 border-blue-300">Adiantado</Badge>,
    };
    return badges[status] || <Badge variant="outline">{status}</Badge>;
  };

  if (loading) return <div className="flex justify-center p-8">Carregando...</div>;

  if (!conta) return <div className="flex justify-center p-8">Conta não encontrada.</div>;

  // Calcular totais
  const totalPago = parcelas.reduce((acc, p) => acc + (p.valor_pago || 0), 0);
  const totalAPagar = parcelas.reduce((acc, p) => {
    if (p.status === 'pago' || p.status === 'adiantado') return acc;
    return acc + (p.valor_parcela - (p.valor_pago || 0));
  }, 0);

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/financeiro/contas-pagar')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Detalhes da Conta a Pagar</h1>
            <p className="text-muted-foreground">
              Criada em {formatarData(conta.created_at?.split('T')[0])}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/financeiro/contas-pagar/editar/${id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button variant="destructive" onClick={handleExcluirConta}>
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir Conta
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatarValor(conta.valor_total)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pago</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatarValor(totalPago)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo a Pagar</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatarValor(totalAPagar)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dados da Conta */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dados da Conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Data de Emissão:</span>
              <span className="font-medium">{formatarData(conta.data_emissao)}</span>

              <span className="text-muted-foreground">Tipo de Documento:</span>
              <span className="font-medium">{conta.tipo_documento?.descricao || 'N/A'}</span>

              <span className="text-muted-foreground">Plano de Contas:</span>
              <span className="font-medium">
                {conta.plano_contas?.codigo_estruturado} - {conta.plano_contas?.descricao}
              </span>

              <span className="text-muted-foreground">Banco:</span>
              <span className="font-medium">
                {conta.banco?.codigo} - {conta.banco?.nome}
              </span>

              <span className="text-muted-foreground">Tipo de Lançamento:</span>
              <span className="font-medium">
                {conta.tipo_lancamento === 'unico' && '📄 Único'}
                {conta.tipo_lancamento === 'parcelado' && '📊 Parcelado'}
                {conta.tipo_lancamento === 'recorrente' && '🔄 Recorrente'}
              </span>

              <span className="text-muted-foreground">Número de Parcelas:</span>
              <span className="font-medium">{conta.numero_parcelas}</span>
            </div>

            {conta.descricao && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Descrição:</p>
                  <p className="text-sm">{conta.descricao}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados do Fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">Nome:</p>
                <p className="font-medium">{conta.fornecedor?.nome || 'N/A'}</p>
              </div>

              {conta.fornecedor?.cpf_cnpj && (
                <div>
                  <p className="text-muted-foreground">CPF/CNPJ:</p>
                  <p className="font-medium">{conta.fornecedor.cpf_cnpj}</p>
                </div>
              )}

              {conta.fornecedor?.email && (
                <div>
                  <p className="text-muted-foreground">E-mail:</p>
                  <p className="font-medium">{conta.fornecedor.email}</p>
                </div>
              )}

              {conta.fornecedor?.telefone && (
                <div>
                  <p className="text-muted-foreground">Telefone:</p>
                  <p className="font-medium">{conta.fornecedor.telefone}</p>
                </div>
              )}
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
          {parcelas.map((parcela) => (
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
                      <DropdownMenuItem onClick={() => toast({ title: 'Em breve', description: 'Funcionalidade de dar baixa em desenvolvimento' })}>
                        <DollarSign className="mr-2 h-4 w-4 text-green-600" />
                        Dar Baixa
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleExcluirParcela(parcela.id)} className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir Parcela
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Histórico de Pagamentos da Parcela */}
              {parcela.pagamentos && parcela.pagamentos.length > 0 ? (
                <div className="space-y-3">
                  <Separator />
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Histórico de Pagamentos
                  </h4>
                  
                  {parcela.pagamentos.map((pag: any) => (
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
                          {pag.comprovantes && pag.comprovantes.length > 0 && (
                            <div className="pt-2 border-t">
                              <p className="text-xs text-muted-foreground mb-2">Comprovantes:</p>
                              <div className="flex flex-wrap gap-2">
                                {pag.comprovantes.map((comp: any) => (
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
                        {!pag.estornado && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toast({ title: 'Em breve', description: 'Funcionalidade de editar em desenvolvimento' })}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast({ title: 'Em breve', description: 'Funcionalidade de estornar em desenvolvimento' })}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Estornar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => toast({ title: 'Em breve', description: 'Funcionalidade de excluir em desenvolvimento' })}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
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
          ))}

          {parcelas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma parcela encontrada.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
