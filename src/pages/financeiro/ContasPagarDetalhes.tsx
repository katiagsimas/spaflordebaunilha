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
  RefreshCw,
  Upload,
  X,
  Info
} from 'lucide-react';

export default function ContasPagarDetalhes() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const [conta, setConta] = useState<any>(null);
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para modal de baixa
  const [modalBaixaAberto, setModalBaixaAberto] = useState(false);
  const [parcelaEmBaixa, setParcelaEmBaixa] = useState<any>(null);
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0]);
  const [valorPago, setValorPago] = useState('');
  const [juros, setJuros] = useState('0,00');
  const [desconto, setDesconto] = useState('0,00');
  const [bancoIdPagamento, setBancoIdPagamento] = useState('');
  const [tipoDocumentoIdPagamento, setTipoDocumentoIdPagamento] = useState('');
  const [observacaoPagamento, setObservacaoPagamento] = useState('');
  const [comprovantes, setComprovantes] = useState<File[]>([]);

  // Estados para listas
  const [bancos, setBancos] = useState<any[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<any[]>([]);

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

  // Estados para estorno
  const [modalEstornar, setModalEstornar] = useState(false);
  const [pagamentoEstornando, setPagamentoEstornando] = useState<any>(null);
  const [motivoEstorno, setMotivoEstorno] = useState('');

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

      // Buscar parcelas com pagamentos e comprovantes
      const { data: dataParcelas, error: errorParcelas } = await supabase
        .from('contas_pagar_parcelas' as any)
        .select(`
          *,
          pagamentos:contas_pagar_pagamentos(
            *,
            banco:bancos(codigo, nome),
            tipo_documento:tipos_documento(descricao),
            comprovantes:contas_pagar_comprovantes(*)
          )
        `)
        .eq('conta_pagar_id', id)
        .order('numero_parcela', { ascending: true });

      if (errorParcelas) throw errorParcelas;
      setParcelas(dataParcelas || []);

      // Buscar bancos para o modal de baixa
      const { data: dataBancos } = await supabase
        .from('bancos')
        .select('id, codigo, nome')
        .eq('usuario_id', user.id)
        .order('nome');
      setBancos(dataBancos || []);

      // Buscar tipos de documento
      const { data: dataTipos } = await supabase
        .from('tipos_documento')
        .select('id, descricao')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('descricao');
      setTiposDocumento(dataTipos || []);
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

  const handleAbrirBaixa = (parcela: any) => {
    setParcelaEmBaixa(parcela);
    
    // Calcular valor restante
    const valorRestante = parcela.valor_parcela - (parcela.valor_pago || 0);
    setValorPago(valorRestante.toFixed(2).replace('.', ','));
    
    // Resetar campos
    setDataPagamento(new Date().toISOString().split('T')[0]);
    setJuros('0,00');
    setDesconto('0,00');
    setBancoIdPagamento('');
    setTipoDocumentoIdPagamento('');
    setObservacaoPagamento('');
    setComprovantes([]);
    
    setModalBaixaAberto(true);
  };

  const handleUploadComprovante = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = Array.from(event.target.files || []);
      
      if (files.length === 0) return;

      // Validar tamanho (máximo 5MB por arquivo)
      const maxSize = 5 * 1024 * 1024; // 5MB
      for (const file of files) {
        if (file.size > maxSize) {
          toast({
            title: 'Erro',
            description: `O arquivo ${file.name} é muito grande. Tamanho máximo: 5MB`,
            variant: 'destructive',
          });
          return;
        }
      }

      setComprovantes([...comprovantes, ...files]);

      toast({
        title: '✅ Arquivo(s) adicionado(s)',
        description: `${files.length} arquivo(s) pronto(s) para upload`,
      });
    } catch (error) {
      console.error('Erro ao adicionar arquivo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o arquivo.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoverComprovante = (index: number) => {
    const novosComprovantes = comprovantes.filter((_, i) => i !== index);
    setComprovantes(novosComprovantes);
  };

  const calcularValorLiquido = () => {
    const valor = parseFloat(valorPago.replace(',', '.')) || 0;
    const valorJuros = parseFloat(juros.replace(',', '.')) || 0;
    const valorDesconto = parseFloat(desconto.replace(',', '.')) || 0;
    return valor + valorJuros - valorDesconto;
  };

  // Funções para edição de pagamento
  const handleAbrirEdicaoPagamento = (pagamento: any) => {
    setPagamentoEditando(pagamento);
    setDataEditando(pagamento.data_pagamento);
    setValorEditando(pagamento.valor_pago.toFixed(2).replace('.', ','));
    setJurosEditando((pagamento.juros || 0).toFixed(2).replace('.', ','));
    setDescontoEditando((pagamento.desconto || 0).toFixed(2).replace('.', ','));
    setBancoEditando(pagamento.banco_id);
    setTipoDocEditando(pagamento.tipo_documento_id);
    setObsEditando(pagamento.observacao || '');
    setModalEditarPagamento(true);
  };

  const handleSalvarEdicaoPagamento = async () => {
    try {
      if (!dataEditando) {
        toast({
          title: 'Erro',
          description: 'Informe a data do pagamento!',
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

      const valorJuros = parseFloat(jurosEditando.replace(',', '.')) || 0;
      const valorDesconto = parseFloat(descontoEditando.replace(',', '.')) || 0;

      const { error } = await supabase
        .from('contas_pagar_pagamentos' as any)
        .update({
          data_pagamento: dataEditando,
          valor_pago: valor,
          juros: valorJuros,
          desconto: valorDesconto,
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
      console.error('Erro ao atualizar pagamento:', error);
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Funções para excluir pagamento
  const handleExcluirPagamento = async (pagamento: any) => {
    try {
      const confirmar = window.confirm(
        'Tem certeza que deseja excluir este pagamento?\n\n' +
        `Valor: ${formatarValor(pagamento.valor_pago)}\n` +
        `Data: ${formatarData(pagamento.data_pagamento)}\n\n` +
        'Esta ação não pode ser desfeita!'
      );

      if (!confirmar) return;

      // Excluir comprovantes do storage primeiro
      if (pagamento.comprovantes && pagamento.comprovantes.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          for (const comp of pagamento.comprovantes) {
            try {
              const caminho = comp.url_storage.split('/comprovantes-pagar/')[1];
              await supabase.storage
                .from('comprovantes-pagar')
                .remove([caminho]);
            } catch (error) {
              console.error('Erro ao excluir comprovante:', error);
            }
          }
        }
      }

      // Excluir pagamento (cascade deleta comprovantes da tabela)
      const { error } = await supabase
        .from('contas_pagar_pagamentos' as any)
        .delete()
        .eq('id', pagamento.id);

      if (error) throw error;

      toast({
        title: '✅ Pagamento excluído',
        description: 'O pagamento foi excluído com sucesso!',
      });

      fetchDetalhes();
    } catch (error: any) {
      console.error('Erro ao excluir pagamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o pagamento.',
        variant: 'destructive',
      });
    }
  };

  // Funções para estorno
  const handleAbrirEstorno = (pagamento: any) => {
    setPagamentoEstornando(pagamento);
    setMotivoEstorno('');
    setModalEstornar(true);
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

      const { error } = await supabase
        .from('contas_pagar_pagamentos' as any)
        .update({
          estornado: true,
          data_estorno: new Date().toISOString(),
          motivo_estorno: motivoEstorno.trim(),
        })
        .eq('id', pagamentoEstornando.id);

      if (error) throw error;

      toast({
        title: '✅ Pagamento estornado',
        description: 'O pagamento foi estornado com sucesso!',
      });

      setModalEstornar(false);
      fetchDetalhes();
    } catch (error: any) {
      console.error('Erro ao estornar pagamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível estornar o pagamento.',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmarBaixa = async () => {
    try {
      // Validações
      if (!dataPagamento) {
        toast({
          title: 'Erro',
          description: 'Informe a data do pagamento!',
          variant: 'destructive',
        });
        return;
      }

      const valor = parseFloat(valorPago.replace(',', '.'));
      if (!valor || valor <= 0) {
        toast({
          title: 'Erro',
          description: 'Informe um valor válido!',
          variant: 'destructive',
        });
        return;
      }

      if (!bancoIdPagamento) {
        toast({
          title: 'Erro',
          description: 'Selecione o banco!',
          variant: 'destructive',
        });
        return;
      }

      if (!tipoDocumentoIdPagamento) {
        toast({
          title: 'Erro',
          description: 'Selecione o tipo de documento!',
          variant: 'destructive',
        });
        return;
      }

      // Validar valor máximo
      const valorRestante = parcelaEmBaixa.valor_parcela - (parcelaEmBaixa.valor_pago || 0);
      const valorJuros = parseFloat(juros.replace(',', '.')) || 0;
      const valorDesconto = parseFloat(desconto.replace(',', '.')) || 0;

      if (valor > valorRestante + 0.01) { // +0.01 para tolerância de arredondamento
        toast({
          title: 'Erro',
          description: `O valor pago não pode ser maior que o saldo restante (${formatarValor(valorRestante)})`,
          variant: 'destructive',
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Inserir pagamento
      const { data: pagamento, error: errorPagamento } = await supabase
        .from('contas_pagar_pagamentos' as any)
        .insert({
          parcela_id: parcelaEmBaixa.id,
          data_pagamento: dataPagamento,
          valor_pago: valor,
          juros: valorJuros,
          desconto: valorDesconto,
          banco_id: bancoIdPagamento,
          tipo_documento_id: tipoDocumentoIdPagamento,
          observacao: observacaoPagamento.trim() || null,
        })
        .select()
        .single() as any;

      if (errorPagamento) throw errorPagamento;

      // Upload de comprovantes (se houver)
      if (comprovantes.length > 0) {
        for (const file of comprovantes) {
          try {
            // Gerar nome único
            const timestamp = Date.now();
            const nomeArquivo = `${timestamp}_${file.name}`;
            const caminhoStorage = `${user.id}/contas-pagar/${pagamento.id}/${nomeArquivo}`;

            // Upload para storage
            const { error: errorUpload } = await supabase.storage
              .from('comprovantes-pagar')
              .upload(caminhoStorage, file);

            if (errorUpload) throw errorUpload;

            // Obter URL pública
            const { data: urlData } = supabase.storage
              .from('comprovantes-pagar')
              .getPublicUrl(caminhoStorage);

            // Salvar referência no banco
            await supabase.from('contas_pagar_comprovantes' as any).insert({
              pagamento_id: (pagamento as any).id,
              nome_arquivo: file.name,
              tipo_arquivo: file.type,
              tamanho_bytes: file.size,
              url_storage: urlData.publicUrl,
            });
          } catch (error) {
            console.error('Erro ao fazer upload do comprovante:', error);
            // Não bloqueia o pagamento se o upload falhar
          }
        }
      }

      toast({
        title: '✅ Pagamento registrado',
        description: `Pagamento de ${formatarValor(calcularValorLiquido())} registrado com sucesso!`,
      });

      setModalBaixaAberto(false);
      fetchDetalhes();
    } catch (error: any) {
      console.error('Erro ao registrar pagamento:', error);
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
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
                      <DropdownMenuItem onClick={() => handleAbrirBaixa(parcela)}>
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
                              <DropdownMenuItem onClick={() => handleAbrirEdicaoPagamento(pag)}>
                                <Edit className="mr-2 h-4 w-4" />
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

      {/* Modal Dar Baixa */}
      <Dialog open={modalBaixaAberto} onOpenChange={setModalBaixaAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              {parcelaEmBaixa && (
                <>
                  Parcela {parcelaEmBaixa.numero_parcela} de {conta?.numero_parcelas} - 
                  Vencimento: {formatarData(parcelaEmBaixa.data_vencimento)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {parcelaEmBaixa && (
            <div className="space-y-4 py-4">
              {/* Resumo da Parcela */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor da Parcela:</span>
                  <span className="font-medium text-red-600">
                    {formatarValor(parcelaEmBaixa.valor_parcela)}
                  </span>
                </div>
                {parcelaEmBaixa.valor_pago > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Já Pago:</span>
                    <span className="font-medium text-green-600">
                      {formatarValor(parcelaEmBaixa.valor_pago)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-2 border-t border-blue-300">
                  <span className="font-medium">Saldo Restante:</span>
                  <span className="font-bold text-red-600">
                    {formatarValor(parcelaEmBaixa.valor_parcela - (parcelaEmBaixa.valor_pago || 0))}
                  </span>
                </div>
              </div>

              {/* Data do Pagamento */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data-pagamento">Data do Pagamento *</Label>
                  <Input
                    id="data-pagamento"
                    type="date"
                    value={dataPagamento}
                    onChange={(e) => setDataPagamento(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor-pago">Valor Pago *</Label>
                  <Input
                    id="valor-pago"
                    placeholder="0,00"
                    value={valorPago}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/[^\d,]/g, '');
                      setValorPago(valor);
                    }}
                  />
                </div>
              </div>

              {/* Juros e Descontos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="juros">Juros/Multa</Label>
                  <Input
                    id="juros"
                    placeholder="0,00"
                    value={juros}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/[^\d,]/g, '');
                      setJuros(valor);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desconto">Desconto</Label>
                  <Input
                    id="desconto"
                    placeholder="0,00"
                    value={desconto}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/[^\d,]/g, '');
                      setDesconto(valor);
                    }}
                  />
                </div>
              </div>

              {/* Valor Líquido */}
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Valor Líquido a Pagar:</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatarValor(calcularValorLiquido())}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Valor Pago + Juros - Desconto
                </p>
              </div>

              {/* Banco e Tipo de Documento */}
              <div className="space-y-2">
                <Label>Banco *</Label>
                <Select value={bancoIdPagamento} onValueChange={setBancoIdPagamento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o banco..." />
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
                <Select value={tipoDocumentoIdPagamento} onValueChange={setTipoDocumentoIdPagamento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo..." />
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

              {/* Observação */}
              <div className="space-y-2">
                <Label htmlFor="observacao">Observação</Label>
                <Textarea
                  id="observacao"
                  placeholder="Observações sobre o pagamento..."
                  rows={3}
                  value={observacaoPagamento}
                  onChange={(e) => setObservacaoPagamento(e.target.value)}
                />
              </div>

              {/* Upload de Comprovantes */}
              <div className="space-y-2">
                <Label>Comprovantes</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <input
                    type="file"
                    id="upload-comprovante"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleUploadComprovante}
                    className="hidden"
                  />
                  <label
                    htmlFor="upload-comprovante"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Clique para fazer upload ou arraste arquivos
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG ou PDF (máx. 5MB cada)
                    </p>
                  </label>
                </div>

                {/* Lista de Comprovantes */}
                {comprovantes.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {comprovantes.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoverComprovante(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Alerta de Pagamento Parcial */}
              {parcelaEmBaixa && 
               calcularValorLiquido() < (parcelaEmBaixa.valor_parcela - (parcelaEmBaixa.valor_pago || 0)) && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pagamento Parcial:</strong> O valor informado é menor que o saldo restante. 
                    A parcela ficará com status "Pago Parcialmente" e poderá receber novos pagamentos.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setModalBaixaAberto(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmarBaixa}>
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Pagamento */}
      <Dialog open={modalEditarPagamento} onOpenChange={setModalEditarPagamento}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Pagamento</DialogTitle>
            <DialogDescription>
              Atualize as informações do pagamento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Data e Valor */}
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
                  placeholder="0,00"
                  value={valorEditando}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/[^\d,]/g, '');
                    setValorEditando(valor);
                  }}
                />
              </div>
            </div>

            {/* Juros e Descontos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="juros-edit">Juros/Multa</Label>
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

            {/* Valor Líquido */}
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Valor Líquido:</span>
                <span className="text-xl font-bold text-green-600">
                  {formatarValor(
                    (parseFloat(valorEditando.replace(',', '.')) || 0) +
                    (parseFloat(jurosEditando.replace(',', '.')) || 0) -
                    (parseFloat(descontoEditando.replace(',', '.')) || 0)
                  )}
                </span>
              </div>
            </div>

            {/* Banco */}
            <div className="space-y-2">
              <Label>Banco *</Label>
              <Select value={bancoEditando} onValueChange={setBancoEditando}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o banco..." />
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

            {/* Tipo de Documento */}
            <div className="space-y-2">
              <Label>Tipo de Documento *</Label>
              <Select value={tipoDocEditando} onValueChange={setTipoDocEditando}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo..." />
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

            {/* Observação */}
            <div className="space-y-2">
              <Label htmlFor="obs-edit">Observação</Label>
              <Textarea
                id="obs-edit"
                placeholder="Observações sobre o pagamento..."
                rows={3}
                value={obsEditando}
                onChange={(e) => setObsEditando(e.target.value)}
              />
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> A edição não permite alterar ou adicionar comprovantes. 
                Para isso, exclua o pagamento e crie um novo.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setModalEditarPagamento(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSalvarEdicaoPagamento}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Estornar Pagamento */}
      <Dialog open={modalEstornar} onOpenChange={setModalEstornar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estornar Pagamento</DialogTitle>
            <DialogDescription>
              O pagamento será marcado como estornado e não contabilizado
            </DialogDescription>
          </DialogHeader>

          {pagamentoEstornando && (
            <div className="space-y-4 py-4">
              {/* Informações do Pagamento */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Data:</span>
                  <span className="font-medium">
                    {formatarData(pagamentoEstornando.data_pagamento)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-medium text-red-600">
                    {formatarValor(pagamentoEstornando.valor_pago)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Banco:</span>
                  <span className="font-medium">
                    {pagamentoEstornando.banco?.nome}
                  </span>
                </div>
              </div>

              <Alert className="bg-amber-50 border-amber-200">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription>
                  <strong>Importante:</strong> O estorno não exclui o pagamento, apenas o marca 
                  como inválido. O histórico será mantido para auditoria.
                </AlertDescription>
              </Alert>

              {/* Motivo do Estorno */}
              <div className="space-y-2">
                <Label htmlFor="motivo-estorno">Motivo do Estorno *</Label>
                <Textarea
                  id="motivo-estorno"
                  placeholder="Descreva o motivo do estorno..."
                  rows={4}
                  value={motivoEstorno}
                  onChange={(e) => setMotivoEstorno(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setModalEstornar(false)}
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
