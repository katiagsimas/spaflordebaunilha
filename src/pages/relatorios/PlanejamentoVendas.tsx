import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, AlertCircle, Info, Edit, Check, RefreshCw, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useReceitas } from '@/hooks/useReceitas';
import { useToast } from '@/hooks/use-toast';

interface DistribuicaoProduto {
  receita_id: string;
  nome: string;
  preco_venda: number;
  percentual: number;
}

interface MetaMensal {
  mes: number;
  faturamento: number;
  lucro: number;
  ticketMedio: number;
  pedidos: number;
  customizado: boolean;
}

export default function PlanejamentoVendas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { receitas } = useReceitas();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Ano selecionado
  const [anoReferencia, setAnoReferencia] = useState(() => new Date().getFullYear());

  // Metas anuais
  const [metaFaturamentoAnual, setMetaFaturamentoAnual] = useState('');
  const [pctLucroSelecionado, setPctLucroSelecionado] = useState<35 | 45 | 50 | null>(null);

  // Ticket médio carregado da Inteligência
  const [ticketMedioInteligencia, setTicketMedioInteligencia] = useState<number>(0);

  // Metas mensais (12 meses)
  const [metasMensais, setMetasMensais] = useState<MetaMensal[]>([]);
  
  // Mês sendo editado
  const [mesEditando, setMesEditando] = useState<number | null>(null);
  const [valorEditando, setValorEditando] = useState('');

  // Distribuição por produto
  const [distribuicao, setDistribuicao] = useState<DistribuicaoProduto[]>([]);

  // Anos disponíveis para seleção
  const anosDisponiveis = Array.from(
    { length: 7 },
    (_, i) => new Date().getFullYear() - 3 + i
  );

  // Nomes dos meses
  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Produtos ativos
  const produtosAtivos = receitas.filter(r => r.cardapio === 'ativo');

  // Garantir que sempre tenhamos 12 meses para exibir
  const mesesParaExibir: MetaMensal[] = Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1;
    const metaExistente = metasMensais.find(m => m.mes === mes);
    return metaExistente || {
      mes,
      faturamento: 0,
      lucro: 0,
      ticketMedio: 0,
      pedidos: 0,
      customizado: false,
    };
  });

  // Calcular soma dos percentuais
  const somaPercentuais = distribuicao.reduce((sum, item) => sum + item.percentual, 0);

  // Calcular Lucro Anual automaticamente
  const metaLucroAnual = metaFaturamentoAnual && pctLucroSelecionado
    ? Math.round(parseFloat(metaFaturamentoAnual) * (pctLucroSelecionado / 100))
    : 0;

  // Calcular somatórios das metas mensais
  const somaFaturamentoMensal = mesesParaExibir.reduce((sum, m) => sum + m.faturamento, 0);
  const somaLucroMensal = mesesParaExibir.reduce((sum, m) => sum + m.lucro, 0);
  const somaPedidosMensal = mesesParaExibir.reduce((sum, m) => sum + m.pedidos, 0);
  
  // Diferença entre soma mensal e meta anual
  const diferencaFaturamento = somaFaturamentoMensal - (parseFloat(metaFaturamentoAnual) || 0);

  useEffect(() => {
    if (user) {
      carregarPlanejamento();
      carregarTicketMedio();
    }
  }, [anoReferencia, user]);

  // Inicializar distribuição com produtos ativos
  useEffect(() => {
    if (produtosAtivos.length > 0 && distribuicao.length === 0) {
      const distribuicaoInicial = produtosAtivos.map(produto => ({
        receita_id: produto.id,
        nome: produto.nome,
        preco_venda: produto.valorVenda || 0,
        percentual: 0,
      }));
      setDistribuicao(distribuicaoInicial);
    }
  }, [produtosAtivos]);

  // Atualizar metas mensais quando mudar meta anual ou % lucro
  useEffect(() => {
    if (metaFaturamentoAnual && pctLucroSelecionado && ticketMedioInteligencia > 0) {
      // Verificar se há algum mês com valor maior que 0
      const temMetasDefinidas = metasMensais.some(m => m.faturamento > 0);
      
      // Se não há metas definidas, preencher automaticamente
      if (!temMetasDefinidas) {
        inicializarMetasMensais();
      } else {
        // Se há metas, recalcular apenas as não customizadas
        const metaFatMensal = Math.round(parseFloat(metaFaturamentoAnual) / 12);
        
        setMetasMensais(prev => {
          if (prev.length === 0) return prev;
          
          return prev.map(m => {
            if (m.customizado) return m; // Mantém os customizados
            
            return {
              ...m,
              faturamento: metaFatMensal,
              lucro: Math.round(metaFatMensal * (pctLucroSelecionado / 100)),
              ticketMedio: ticketMedioInteligencia,
              pedidos: Math.max(1, Math.floor(metaFatMensal / ticketMedioInteligencia)),
            };
          });
        });
      }
    }
  }, [metaFaturamentoAnual, pctLucroSelecionado, ticketMedioInteligencia]);

  const carregarTicketMedio = async () => {
    if (!user) return;

    try {
      // Calcular ticket médio dos últimos 90 dias
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - 90);

      const { data: encomendas, error } = await supabase
        .from('encomendas')
        .select('valor')
        .eq('usuario_id', user.id)
        .gte('data_entrega', dataInicio.toISOString())
        .in('status', ['entregue', 'pago', 'concluido', 'finalizado']);

      if (error) throw error;

      if (encomendas && encomendas.length > 0) {
        const totalReceita = encomendas.reduce((sum, e) => sum + (e.valor || 0), 0);
        const ticketMedio = totalReceita / encomendas.length;
        setTicketMedioInteligencia(ticketMedio);
      }
    } catch (error) {
      console.error('Erro ao carregar ticket médio:', error);
    }
  };

  const inicializarMetasMensais = () => {
    const metaFatMensal = Math.round(parseFloat(metaFaturamentoAnual) / 12);
    const novasMetasMensais: MetaMensal[] = [];

    for (let mes = 1; mes <= 12; mes++) {
      const metaExistente = metasMensais.find(m => m.mes === mes);
      
      // Se o mês já existe E foi customizado, mantém os valores dele
      // Senão, usa os valores calculados (anual/12)
      if (metaExistente?.customizado) {
        novasMetasMensais.push(metaExistente);
      } else {
        novasMetasMensais.push({
          mes,
          faturamento: metaFatMensal,
          lucro: Math.round(metaFatMensal * (pctLucroSelecionado! / 100)),
          ticketMedio: ticketMedioInteligencia,
          pedidos: Math.max(1, Math.floor(metaFatMensal / ticketMedioInteligencia)),
          customizado: false,
        });
      }
    }

    setMetasMensais(novasMetasMensais);
  };

  const carregarPlanejamento = async () => {
    if (!user) return;

    try {
      setLoadingData(true);

      // Buscar planejamentos de todos os 12 meses do ano
      const { data: planejamentosData, error: planejamentoError } = await supabase
        .from('planejamento_vendas')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('ano', anoReferencia);

      if (planejamentoError && planejamentoError.code !== 'PGRST116') {
        throw planejamentoError;
      }

      if (planejamentosData && planejamentosData.length > 0) {
        // Pegar dados da meta anual do primeiro registro (assumindo que é o mesmo para todos)
        const primeiroRegistro = planejamentosData[0];
        setMetaFaturamentoAnual(primeiroRegistro.meta_faturamento_anual?.toString() || '');
        setPctLucroSelecionado(primeiroRegistro.pct_lucro_selecionado as 35 | 45 | 50 | null);

        // Carregar metas mensais existentes
        const metasCarregadas: MetaMensal[] = [];
        for (let mes = 1; mes <= 12; mes++) {
          const planejamentoMes = planejamentosData.find(p => p.mes === mes);
          
          if (planejamentoMes) {
            metasCarregadas.push({
              mes,
              faturamento: planejamentoMes.meta_faturamento_mensal || 0,
              lucro: planejamentoMes.meta_lucro_mensal || 0,
              ticketMedio: planejamentoMes.meta_ticket_medio || 0,
              pedidos: planejamentoMes.meta_pedidos || 0,
              customizado: true, // Se foi salvo, considera customizado
            });
          } else {
            // Mês sem dados
            metasCarregadas.push({
              mes,
              faturamento: 0,
              lucro: 0,
              ticketMedio: 0,
              pedidos: 0,
              customizado: false,
            });
          }
        }
        setMetasMensais(metasCarregadas);

        // Buscar distribuição de produtos (usar o primeiro mês que tiver)
        const planejamentoComProdutos = planejamentosData.find(p => p.id);
        if (planejamentoComProdutos) {
          const { data: produtosData, error: produtosError } = await supabase
            .from('planejamento_produtos')
            .select('receita_id, percentual_participacao')
            .eq('planejamento_id', planejamentoComProdutos.id);

          if (produtosError) throw produtosError;

          // Mesclar com produtos ativos
          const distribuicaoCarregada = produtosAtivos.map(produto => {
            const produtoSalvo = produtosData?.find(p => p.receita_id === produto.id);
            return {
              receita_id: produto.id,
              nome: produto.nome,
              preco_venda: produto.valorVenda || 0,
              percentual: produtoSalvo?.percentual_participacao || 0,
            };
          });

          setDistribuicao(distribuicaoCarregada);
        }
      } else {
        // Nenhum planejamento encontrado para este ano
        setMetasMensais([]);
      }
    } catch (error) {
      console.error('Erro ao carregar planejamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o planejamento.',
        variant: 'destructive',
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleEditarMes = (mes: number) => {
    const meta = mesesParaExibir.find(m => m.mes === mes);
    if (meta) {
      setMesEditando(mes);
      setValorEditando(meta.faturamento > 0 ? meta.faturamento.toString() : '');
    }
  };

  const handleLimparMes = (mes: number) => {
    setMetasMensais(prev => {
      const novasMetas = prev.filter(m => m.mes !== mes);
      return novasMetas;
    });
    
    toast({
      title: 'Mês limpo',
      description: `Os valores de ${nomesMeses[mes - 1]} foram removidos.`,
    });
  };

  const handleSalvarMes = (mes: number) => {
    const novoFaturamento = parseFloat(valorEditando);
    
    if (isNaN(novoFaturamento) || novoFaturamento <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'O faturamento deve ser maior que zero.',
        variant: 'destructive',
      });
      return;
    }

    const novoLucro = Math.round(novoFaturamento * (pctLucroSelecionado! / 100));
    const novosPedidos = ticketMedioInteligencia > 0 
      ? Math.max(1, Math.floor(novoFaturamento / ticketMedioInteligencia))
      : 0;

    setMetasMensais(prev =>
      prev.map(m =>
        m.mes === mes
          ? {
              ...m,
              faturamento: novoFaturamento,
              lucro: novoLucro,
              pedidos: novosPedidos,
              customizado: true,
            }
          : m
      )
    );

    setMesEditando(null);
    setValorEditando('');
  };

  const handleRedistribuirDiferenca = () => {
    if (!metaFaturamentoAnual || !pctLucroSelecionado) return;

    const metaAnual = parseFloat(metaFaturamentoAnual);
    const mesesNaoCustomizados = metasMensais.filter(m => !m.customizado);
    
    if (mesesNaoCustomizados.length === 0) {
      toast({
        title: 'Não é possível redistribuir',
        description: 'Todos os meses foram customizados manualmente.',
        variant: 'destructive',
      });
      return;
    }

    const faturamentoCustomizado = metasMensais
      .filter(m => m.customizado)
      .reduce((sum, m) => sum + m.faturamento, 0);

    const faturamentoRestante = metaAnual - faturamentoCustomizado;
    const faturamentoPorMes = Math.round(faturamentoRestante / mesesNaoCustomizados.length);

    setMetasMensais(prev =>
      prev.map(m => {
        if (m.customizado) return m;

        const novoLucro = Math.round(faturamentoPorMes * (pctLucroSelecionado / 100));
        const novosPedidos = ticketMedioInteligencia > 0
          ? Math.max(1, Math.floor(faturamentoPorMes / ticketMedioInteligencia))
          : 0;

        return {
          ...m,
          faturamento: faturamentoPorMes,
          lucro: novoLucro,
          pedidos: novosPedidos,
        };
      })
    );

    toast({
      title: 'Diferença redistribuída',
      description: `Faturamento redistribuído entre ${mesesNaoCustomizados.length} meses.`,
    });
  };

  const handlePercentualChange = (receitaId: string, valor: string) => {
    const percentual = parseFloat(valor) || 0;
    
    setDistribuicao(prev =>
      prev.map(item =>
        item.receita_id === receitaId
          ? { ...item, percentual }
          : item
      )
    );
  };

  const salvarPlanejamento = async () => {
    if (!user) return;

    // Validações
    if (!metaFaturamentoAnual || parseFloat(metaFaturamentoAnual) <= 0) {
      toast({
        title: 'Campo obrigatório',
        description: 'Informe o Faturamento Anual (maior que 0).',
        variant: 'destructive',
      });
      return;
    }

    if (!pctLucroSelecionado) {
      toast({
        title: 'Selecione o percentual de lucro',
        description: 'Escolha uma das opções: 35%, 45% ou 50%.',
        variant: 'destructive',
      });
      return;
    }

    if (ticketMedioInteligencia <= 0) {
      toast({
        title: 'Ticket Médio ausente',
        description: 'Não foi possível calcular o Ticket Médio. Adicione vendas no sistema.',
        variant: 'destructive',
      });
      return;
    }

    if (Math.abs(diferencaFaturamento) > 0.01) {
      toast({
        title: 'Soma inválida',
        description: 'A soma das metas mensais deve igualar a Meta de Faturamento Anual.',
        variant: 'destructive',
      });
      return;
    }

    if (Math.abs(somaPercentuais - 100) > 0.01) {
      toast({
        title: 'Distribuição inválida',
        description: 'A soma dos percentuais deve ser exatamente 100%.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Salvar ou atualizar planejamento apenas para meses com valores
      const mesesComValores = mesesParaExibir.filter(m => m.faturamento > 0);
      
      for (const metaMes of mesesComValores) {
        const planejamentoPayload = {
          usuario_id: user.id,
          ano: anoReferencia,
          mes: metaMes.mes,
          meta_faturamento_anual: parseFloat(metaFaturamentoAnual),
          meta_lucro_anual: metaLucroAnual,
          pct_lucro_selecionado: pctLucroSelecionado,
          meta_faturamento_mensal: metaMes.faturamento,
          meta_lucro_mensal: metaMes.lucro,
          meta_pedidos: metaMes.pedidos,
          meta_ticket_medio: metaMes.ticketMedio,
          updated_at: new Date().toISOString(),
        };

        const { data: planejamentoData, error: planejamentoError } = await supabase
          .from('planejamento_vendas')
          .upsert(planejamentoPayload, { onConflict: 'usuario_id,ano,mes' })
          .select()
          .single();

        if (planejamentoError) throw planejamentoError;

        // Deletar distribuição anterior deste mês
        await supabase
          .from('planejamento_produtos')
          .delete()
          .eq('planejamento_id', planejamentoData.id);

        // Salvar nova distribuição (apenas produtos com percentual > 0)
        const produtosParaSalvar = distribuicao
          .filter(item => item.percentual > 0)
          .map(item => ({
            planejamento_id: planejamentoData.id,
            receita_id: item.receita_id,
            percentual_participacao: item.percentual,
          }));

        if (produtosParaSalvar.length > 0) {
          const { error: produtosError } = await supabase
            .from('planejamento_produtos')
            .insert(produtosParaSalvar);

          if (produtosError) throw produtosError;
        }
      }

      toast({
        title: 'Sucesso!',
        description: 'Planejamento salvo com sucesso.',
      });

    } catch (error) {
      console.error('Erro ao salvar planejamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o planejamento.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/relatorios/inteligencia')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">📈 Planejamento de Vendas</h1>
          <p className="text-muted-foreground">
            Defina metas claras e controle seu crescimento mensal
          </p>
        </div>
      </div>

      {/* Seletor de Ano */}
      <Card>
        <CardContent className="pt-6">
          <Label htmlFor="ano">Ano de Referência</Label>
          <Select
            value={anoReferencia.toString()}
            onValueChange={(value) => setAnoReferencia(parseInt(value))}
          >
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anosDisponiveis.map((ano) => (
                <SelectItem key={ano} value={ano.toString()}>
                  {ano}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Bloco 1 - Meta Anual */}
      <Card>
        <CardHeader>
          <CardTitle>Meta Anual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="faturamento-anual">Faturamento Anual (R$) *</Label>
            <Input
              id="faturamento-anual"
              type="number"
              step="0.01"
              value={metaFaturamentoAnual}
              onChange={(e) => setMetaFaturamentoAnual(e.target.value)}
              placeholder="0,00"
              required
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label>Percentual de Lucro *</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>% aplicado sobre o faturamento para projetar seu lucro</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => setPctLucroSelecionado(35)}
                className={`flex-1 min-w-[140px] px-4 py-3 rounded-lg border-2 transition-all ${
                  pctLucroSelecionado === 35
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-2xl font-bold">35%</div>
                <div className="text-xs opacity-70">Meta mínima</div>
              </button>

              <button
                type="button"
                onClick={() => setPctLucroSelecionado(45)}
                className={`flex-1 min-w-[140px] px-4 py-3 rounded-lg border-2 transition-all ${
                  pctLucroSelecionado === 45
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-2xl font-bold">45%</div>
                <div className="text-xs opacity-70">Meta saudável</div>
              </button>

              <button
                type="button"
                onClick={() => setPctLucroSelecionado(50)}
                className={`flex-1 min-w-[140px] px-4 py-3 rounded-lg border-2 transition-all ${
                  pctLucroSelecionado === 50
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-2xl font-bold">50%</div>
                <div className="text-xs opacity-70">Meta premium</div>
              </button>
            </div>

            {!pctLucroSelecionado && metaFaturamentoAnual && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Selecione um percentual de lucro para calcular as metas.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div>
            <Label htmlFor="lucro-anual">Lucro Anual (R$)</Label>
            <Input
              id="lucro-anual"
              type="text"
              value={formatCurrency(metaLucroAnual)}
              readOnly
              className="bg-muted cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Calculado automaticamente
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bloco 2 - Metas Mensais (Tabela) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Metas Mensais</span>
            {metaFaturamentoAnual && pctLucroSelecionado && ticketMedioInteligencia > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={inicializarMetasMensais}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Resetar para Meta Anual ÷ 12
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticketMedioInteligencia <= 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Defina o Ticket Médio adicionando vendas no sistema (últimos 90 dias).
              </AlertDescription>
            </Alert>
          )}

          {/* Alerta de diferença */}
          {Math.abs(diferencaFaturamento) > 0.01 && somaFaturamentoMensal > 0 && (
            <Alert variant={diferencaFaturamento > 0 ? "destructive" : "default"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  {diferencaFaturamento > 0 
                    ? `Excedeu em ${formatCurrency(diferencaFaturamento)} a meta anual de faturamento.`
                    : `Faltam ${formatCurrency(Math.abs(diferencaFaturamento))} para alcançar a meta anual de faturamento.`
                  }
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRedistribuirDiferenca}
                  className="ml-4"
                >
                  Redistribuir Diferença
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Tabela de meses */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Mês</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Faturamento (R$)</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Lucro (R$)</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Ticket Médio (R$)</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Pedidos</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {mesesParaExibir.map((meta) => (
                    <tr key={meta.mes} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {nomesMeses[meta.mes - 1]}
                          {meta.customizado && (
                            <Badge variant="outline" className="text-xs">
                              Personalizado
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {mesEditando === meta.mes ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={valorEditando}
                            onChange={(e) => setValorEditando(e.target.value)}
                            className="w-32 ml-auto text-right"
                            autoFocus
                          />
                        ) : (
                          meta.faturamento > 0 ? formatCurrency(meta.faturamento) : '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {meta.lucro > 0 ? formatCurrency(meta.lucro) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {meta.ticketMedio > 0 ? formatCurrency(meta.ticketMedio) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {meta.pedidos > 0 ? meta.pedidos : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {mesEditando === meta.mes ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSalvarMes(meta.mes)}
                              className="gap-1"
                            >
                              <Check className="h-4 w-4" />
                              Salvar
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditarMes(meta.mes)}
                                className="gap-1"
                                disabled={!pctLucroSelecionado || ticketMedioInteligencia <= 0}
                              >
                                <Edit className="h-4 w-4" />
                                Editar
                              </Button>
                              {meta.faturamento > 0 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleLimparMes(meta.mes)}
                                  className="gap-1 text-destructive hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                  Limpar
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Linha de Total */}
                  <tr className="border-t-2 bg-muted/50 font-semibold">
                    <td className="px-4 py-3">Total do Ano</td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(somaFaturamentoMensal)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(somaLucroMensal)}
                    </td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">
                      {somaPedidosMensal}
                    </td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bloco 3 - Distribuição por Produto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Distribuição por Produto</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-normal text-muted-foreground">
                Total: {somaPercentuais.toFixed(1)}%
              </span>
              {Math.abs(somaPercentuais - 100) < 0.01 ? (
                <span className="text-sm text-green-600">✓</span>
              ) : (
                <span className="text-sm text-red-600">✗</span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barra de Progresso */}
          <div className="space-y-2">
            <Progress value={Math.min(somaPercentuais, 100)} className="h-2" />
            {Math.abs(somaPercentuais - 100) > 0.01 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  A soma deve ser 100%. Faltam {(100 - somaPercentuais).toFixed(1)}%.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Lista de Produtos */}
          <div className="space-y-3">
            {distribuicao.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum produto ativo encontrado. Ative produtos em Precificação → Ficha Técnica.
                </AlertDescription>
              </Alert>
            ) : (
              distribuicao.map((item) => (
                <div
                  key={item.receita_id}
                  className="grid grid-cols-12 gap-4 items-center p-4 border rounded-lg"
                >
                  <div className="col-span-5">
                    <p className="font-medium">{item.nome}</p>
                  </div>

                  <div className="col-span-3 text-right text-sm text-muted-foreground">
                    {formatCurrency(item.preco_venda)}
                  </div>

                  <div className="col-span-4 flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={item.percentual || ''}
                      onChange={(e) => handlePercentualChange(item.receita_id, e.target.value)}
                      placeholder="0"
                      className="text-right"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Botão de Salvar */}
      <div className="flex justify-end">
        <Button
          onClick={salvarPlanejamento}
          disabled={
            loading || 
            Math.abs(diferencaFaturamento) > 0.01 ||
            Math.abs(somaPercentuais - 100) > 0.01 ||
            !metaFaturamentoAnual ||
            parseFloat(metaFaturamentoAnual) <= 0 ||
            !pctLucroSelecionado ||
            ticketMedioInteligencia <= 0 ||
            somaFaturamentoMensal === 0
          }
          size="lg"
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar Planejamento
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
