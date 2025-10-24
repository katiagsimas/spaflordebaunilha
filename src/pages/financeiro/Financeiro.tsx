import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  PieChart,
  Settings,
  Plus,
  Trash2,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Building2,
  LayoutDashboard
} from 'lucide-react';

export default function Financeiro() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Estados de navegação temporal
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());

  // Estados do banner
  const [loading, setLoading] = useState(true);
  const [saldoAnterior, setSaldoAnterior] = useState(0);
  const [entradas, setEntradas] = useState(0);
  const [saidas, setSaidas] = useState(0);
  const [saldoAtual, setSaldoAtual] = useState(0);
  const [bancosSaldos, setBancosSaldos] = useState([]);

  // Estados do modal
  const [modalConfigAberto, setModalConfigAberto] = useState(false);
  const [bancos, setBancos] = useState([]);
  const [saldosConfigurados, setSaldosConfigurados] = useState([]);
  
  // Formulário de novo saldo
  const [bancoId, setBancoId] = useState('');
  const [mesReferencia, setMesReferencia] = useState(new Date().getMonth() + 1);
  const [anoReferencia, setAnoReferencia] = useState(new Date().getFullYear());
  const [saldoInicial, setSaldoInicial] = useState('');
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    fetchResumo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesSelecionado, anoSelecionado]);

  const fetchResumo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar resumo financeiro
      const { data: resumo } = await supabase
        .from('vw_resumo_financeiro')
        .select('*')
        .eq('user_id', user.id);

      // Buscar total recebido do Contas a Receber
      const { data: parcelasReceber } = await supabase
        .from('vw_contas_receber_parcelas')
        .select('*')
        .eq('user_id', user.id);

      let totalRecebido = 0;
      parcelasReceber?.forEach((p: any) => {
        if (p.status === 'pago' || p.status === 'adiantado') {
          totalRecebido += p.valor_pago || 0;
        }
        if (p.status === 'pagamento_parcial') {
          totalRecebido += p.valor_pago || 0;
        }
      });

      if (resumo && resumo.length > 0) {
        const totalSaldoInicial = resumo.reduce((acc, b) => acc + (b.saldo_inicial || 0), 0);
        const totalSaidas = resumo.reduce((acc, b) => acc + (b.saidas_mes || 0), 0);
        
        // Calcular saldo atual: (Saldo Anterior + Entradas) - Saídas
        const saldoCalculado = (totalSaldoInicial + totalRecebido) - totalSaidas;

        setSaldoAnterior(totalSaldoInicial);
        setEntradas(totalRecebido);
        setSaidas(totalSaidas);
        setSaldoAtual(saldoCalculado);
        setBancosSaldos(resumo);
      } else {
        // Não tem saldos configurados
        const saldoCalculado = (0 + totalRecebido) - 0;
        
        setSaldoAnterior(0);
        setEntradas(totalRecebido);
        setSaidas(0);
        setSaldoAtual(saldoCalculado);
        setBancosSaldos([]);
      }
    } catch (error) {
      console.error('Erro ao buscar resumo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirConfig = async () => {
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

      // Buscar saldos configurados do mês atual
      const mesAtual = new Date().getMonth() + 1;
      const anoAtual = new Date().getFullYear();

      const { data: dataSaldos } = await supabase
        .from('saldos_iniciais_bancos')
        .select(`
          id,
          banco_id,
          mes_referencia,
          ano_referencia,
          saldo_inicial,
          bancos (
            codigo,
            nome
          )
        `)
        .eq('user_id', user.id)
        .eq('mes_referencia', mesAtual)
        .eq('ano_referencia', anoAtual)
        .order('saldo_inicial', { ascending: false });

      setSaldosConfigurados(dataSaldos || []);

      // Resetar formulário
      setBancoId('');
      setMesReferencia(mesAtual);
      setAnoReferencia(anoAtual);
      setSaldoInicial('');
      setObservacao('');

      setModalConfigAberto(true);
    } catch (error) {
      console.error('Erro ao abrir configuração:', error);
    }
  };

  const handleAdicionarSaldo = async () => {
    try {
      if (!bancoId) {
        toast({
          title: 'Erro',
          description: 'Selecione o banco!',
          variant: 'destructive',
        });
        return;
      }

      const valor = parseFloat(saldoInicial.replace(',', '.'));
      if (isNaN(valor)) {
        toast({
          title: 'Erro',
          description: 'Informe um valor válido!',
          variant: 'destructive',
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Inserir ou atualizar
      const { error } = await supabase
        .from('saldos_iniciais_bancos')
        .upsert({
          user_id: user.id,
          banco_id: bancoId,
          mes_referencia: mesReferencia,
          ano_referencia: anoReferencia,
          saldo_inicial: valor,
          observacao: observacao.trim() || null,
        }, {
          onConflict: 'user_id,banco_id,mes_referencia,ano_referencia'
        });

      if (error) throw error;

      toast({
        title: '✅ Saldo configurado',
        description: 'O saldo inicial foi salvo com sucesso!',
      });

      // Recarregar dados e fechar modal
      await fetchResumo();
      setModalConfigAberto(false);
      
      // Redirecionar para a página principal do financeiro
      navigate('/financeiro');
    } catch (error) {
      console.error('Erro ao adicionar saldo:', error);
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleExcluirSaldo = async (saldoId) => {
    try {
      const confirmar = window.confirm('Tem certeza que deseja excluir este saldo inicial?');
      if (!confirmar) return;

      const { error } = await supabase
        .from('saldos_iniciais_bancos')
        .delete()
        .eq('id', saldoId);

      if (error) throw error;

      toast({
        title: '✅ Saldo excluído',
        description: 'O saldo inicial foi excluído!',
      });

      handleAbrirConfig();
      fetchResumo();
    } catch (error) {
      console.error('Erro ao excluir saldo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o saldo.',
        variant: 'destructive',
      });
    }
  };

  const formatarValor = (valor) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const getMesNome = (mes?: number) => {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return meses[(mes || mesSelecionado) - 1];
  };

  const gerarOpcoesAnos = () => {
    const anoAtual = new Date().getFullYear();
    const anos = [];
    for (let ano = anoAtual - 5; ano <= anoAtual + 5; ano++) {
      anos.push(ano);
    }
    return anos;
  };

  if (loading) return <div className="flex justify-center p-8">Carregando...</div>;

  const maxSaldo = Math.max(...bancosSaldos.map(b => b.saldo_atual || 0), 1);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Título da Página */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2 whitespace-nowrap">
          <DollarSign className="w-6 h-6 md:w-7 md:h-7 text-primary flex-shrink-0" />
          MOVIMENTAÇÕES E RELATÓRIOS FINANCEIROS
        </h1>
      </div>

      {/* Cards de Navegação */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Card Dashboard Financeiro */}
        <Card 
          className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-cyan-500"
          onClick={() => navigate('/financeiro/dashboard')}
        >
          <CardHeader className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                <LayoutDashboard className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-semibold">
                Dashboard
              </CardTitle>
            </div>
          </CardHeader>
        </Card>

        {/* Card Contas a Receber */}
        <Card 
          className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500"
          onClick={() => navigate('/financeiro/contas-receber')}
        >
          <CardHeader className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                <TrendingUp className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-semibold">
                Contas a Receber
              </CardTitle>
            </div>
          </CardHeader>
        </Card>

        {/* Card Contas a Pagar */}
        <Card 
          className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-red-500"
          onClick={() => navigate('/financeiro/contas-pagar')}
        >
          <CardHeader className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <TrendingDown className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-semibold">
                Contas a Pagar
              </CardTitle>
            </div>
          </CardHeader>
        </Card>

        {/* Card Fluxo de Caixa */}
        <Card 
          className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
          onClick={() => navigate('/financeiro/fluxo-caixa')}
        >
          <CardHeader className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Wallet className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-semibold">
                Fluxo de Caixa
              </CardTitle>
            </div>
          </CardHeader>
        </Card>

        {/* Card DRE */}
        <Card 
          className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500"
          onClick={() => navigate('/financeiro/dre')}
        >
          <CardHeader className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <PieChart className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-semibold">
                DRE
              </CardTitle>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Banner de Saldos */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl md:text-2xl font-bold uppercase flex items-center gap-2 mb-4">
                <Wallet className="h-6 w-6 text-primary" />
                Resumo Financeiro
              </CardTitle>
              
              {/* Seletores de Mês e Ano */}
              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1">Mês</Label>
                  <Select value={mesSelecionado.toString()} onValueChange={(v) => setMesSelecionado(parseInt(v))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((mes) => (
                        <SelectItem key={mes} value={mes.toString()}>
                          {getMesNome(mes)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1">Ano</Label>
                  <Select value={anoSelecionado.toString()} onValueChange={(v) => setAnoSelecionado(parseInt(v))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {gerarOpcoesAnos().map((ano) => (
                        <SelectItem key={ano} value={ano.toString()}>
                          {ano}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleAbrirConfig}
              className={`font-bold bg-primary text-primary-foreground hover:bg-primary/90 ${bancosSaldos.length === 0 ? 'animate-pulse' : ''}`}
            >
              <Settings className="mr-2 h-4 w-4" />
              Configure Saldos Iniciais
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Anterior</p>
                    <p className="text-2xl font-bold">
                      {formatarValor(saldoAnterior)}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Entradas</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatarValor(entradas)}
                    </p>
                  </div>
                  <ArrowUpCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saídas</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatarValor(saidas)}
                    </p>
                  </div>
                  <ArrowDownCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Atual</p>
                    <p className={`text-2xl font-bold ${saldoAtual >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatarValor(saldoAtual)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Distribuição por Banco */}
          {bancosSaldos.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Distribuição por Banco
                </h3>
                <div className="space-y-3">
                  {bancosSaldos.map(banco => (
                    <div key={banco.banco_id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">
                          {banco.banco_codigo} - {banco.banco_nome}
                        </span>
                        <span className={`font-bold ${banco.saldo_atual >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {formatarValor(banco.saldo_atual)}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full ${banco.saldo_atual >= 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                          style={{ width: `${(Math.abs(banco.saldo_atual) / maxSaldo) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {bancosSaldos.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum saldo configurado para este mês.</p>
              <Button variant="link" onClick={handleAbrirConfig}>
                Configurar agora
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Configuração de Saldos */}
      <Dialog open={modalConfigAberto} onOpenChange={setModalConfigAberto}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurar Saldos Iniciais
            </DialogTitle>
            <DialogDescription>
              Defina o saldo inicial de cada banco para calcular o fluxo de caixa do mês atual
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Formulário para Adicionar Saldo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Adicionar Novo Saldo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
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

                  {/* Mês */}
                  <div className="space-y-2">
                    <Label>Mês</Label>
                    <Select 
                      value={mesReferencia.toString()} 
                      onValueChange={(v) => setMesReferencia(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                        ].map((mes, index) => (
                          <SelectItem key={index + 1} value={(index + 1).toString()}>
                            {mes}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ano */}
                  <div className="space-y-2">
                    <Label>Ano</Label>
                    <Select 
                      value={anoReferencia.toString()} 
                      onValueChange={(v) => setAnoReferencia(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2024, 2025, 2026].map(ano => (
                          <SelectItem key={ano} value={ano.toString()}>
                            {ano}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Saldo Inicial */}
                  <div className="space-y-2">
                    <Label htmlFor="saldo-inicial">Saldo Inicial *</Label>
                    <Input
                      id="saldo-inicial"
                      placeholder="Ex: 25000,00"
                      value={saldoInicial}
                      onChange={(e) => {
                        const valor = e.target.value.replace(/[^\d,.-]/g, '');
                        setSaldoInicial(valor);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use valores negativos para saldo devedor
                    </p>
                  </div>

                  {/* Preview */}
                  <div className="space-y-2">
                    <Label>Preview do Saldo</Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className={`text-2xl font-bold ${
                        parseFloat(saldoInicial.replace(',', '.') || '0') >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {saldoInicial 
                          ? formatarValor(parseFloat(saldoInicial.replace(',', '.') || '0'))
                          : 'R$ 0,00'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Observação */}
                <div className="space-y-2">
                  <Label htmlFor="observacao">Observação</Label>
                  <Textarea
                    id="observacao"
                    placeholder="Observações sobre este saldo (opcional)..."
                    rows={2}
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                  />
                </div>

                <Button onClick={handleAdicionarSaldo} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Saldo
                </Button>
              </CardContent>
            </Card>

            {/* Lista de Saldos Configurados */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Saldos Configurados</CardTitle>
                <CardDescription>
                  Saldos do mês atual ({getMesNome()} {new Date().getFullYear()})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {saldosConfigurados.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum saldo configurado para este mês.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Banco</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead className="text-right">Saldo Inicial</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {saldosConfigurados.map(saldo => (
                        <TableRow key={saldo.id}>
                          <TableCell className="font-medium">
                            {saldo.bancos?.codigo} - {saldo.bancos?.nome}
                          </TableCell>
                          <TableCell>
                            {saldo.mes_referencia.toString().padStart(2, '0')}/{saldo.ano_referencia}
                          </TableCell>
                          <TableCell className={`text-right font-bold ${
                            saldo.saldo_inicial >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatarValor(saldo.saldo_inicial)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExcluirSaldo(saldo.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalConfigAberto(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
