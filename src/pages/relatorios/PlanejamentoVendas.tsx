import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
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

export default function PlanejamentoVendas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { receitas } = useReceitas();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [planejamentoId, setPlanejamentoId] = useState<string | null>(null);

  // Mês selecionado
  const [mesReferencia, setMesReferencia] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });

  // Metas anuais
  const [metaFaturamentoAnual, setMetaFaturamentoAnual] = useState('');
  const [metaLucroAnual, setMetaLucroAnual] = useState('');

  // Metas mensais
  const [metaFaturamentoMensal, setMetaFaturamentoMensal] = useState('');
  const [metaLucroMensal, setMetaLucroMensal] = useState('');
  const [metaPedidos, setMetaPedidos] = useState('');
  const [metaTicketMedio, setMetaTicketMedio] = useState('');

  // Distribuição por produto
  const [distribuicao, setDistribuicao] = useState<DistribuicaoProduto[]>([]);

  // Produtos ativos
  const produtosAtivos = receitas.filter(r => r.cardapio === 'ativo');

  // Calcular soma dos percentuais
  const somaPercentuais = distribuicao.reduce((sum, item) => sum + item.percentual, 0);

  useEffect(() => {
    if (user) {
      carregarPlanejamento();
    }
  }, [mesReferencia, user]);

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

  const carregarPlanejamento = async () => {
    if (!user) return;

    try {
      setLoadingData(true);
      const [ano, mes] = mesReferencia.split('-').map(Number);

      // Buscar planejamento existente
      const { data: planejamentoData, error: planejamentoError } = await supabase
        .from('planejamento_vendas')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('ano', ano)
        .eq('mes', mes)
        .single();

      if (planejamentoError && planejamentoError.code !== 'PGRST116') {
        throw planejamentoError;
      }

      if (planejamentoData) {
        setPlanejamentoId(planejamentoData.id);
        setMetaFaturamentoAnual(planejamentoData.meta_faturamento_anual?.toString() || '');
        setMetaLucroAnual(planejamentoData.meta_lucro_anual?.toString() || '');
        setMetaFaturamentoMensal(planejamentoData.meta_faturamento_mensal.toString());
        setMetaLucroMensal(planejamentoData.meta_lucro_mensal.toString());
        setMetaPedidos(planejamentoData.meta_pedidos.toString());
        setMetaTicketMedio(planejamentoData.meta_ticket_medio.toString());

        // Buscar distribuição de produtos
        const { data: produtosData, error: produtosError } = await supabase
          .from('planejamento_produtos')
          .select('receita_id, percentual_participacao')
          .eq('planejamento_id', planejamentoData.id);

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
      } else {
        setPlanejamentoId(null);
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
    if (!metaFaturamentoMensal || !metaLucroMensal || !metaPedidos || !metaTicketMedio) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todas as metas mensais.',
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
      const [ano, mes] = mesReferencia.split('-').map(Number);

      // Salvar ou atualizar planejamento
      const planejamentoPayload = {
        usuario_id: user.id,
        ano,
        mes,
        meta_faturamento_anual: metaFaturamentoAnual ? parseFloat(metaFaturamentoAnual) : null,
        meta_lucro_anual: metaLucroAnual ? parseFloat(metaLucroAnual) : null,
        meta_faturamento_mensal: parseFloat(metaFaturamentoMensal),
        meta_lucro_mensal: parseFloat(metaLucroMensal),
        meta_pedidos: parseInt(metaPedidos),
        meta_ticket_medio: parseFloat(metaTicketMedio),
        updated_at: new Date().toISOString(),
      };

      const { data: planejamentoData, error: planejamentoError } = await supabase
        .from('planejamento_vendas')
        .upsert(planejamentoPayload, { onConflict: 'usuario_id,ano,mes' })
        .select()
        .single();

      if (planejamentoError) throw planejamentoError;

      setPlanejamentoId(planejamentoData.id);

      // Deletar distribuição anterior
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

      {/* Seletor de Mês */}
      <Card>
        <CardContent className="pt-6">
          <Label htmlFor="mes">Mês de Referência</Label>
          <Input
            id="mes"
            type="month"
            value={mesReferencia}
            onChange={(e) => setMesReferencia(e.target.value)}
            className="max-w-xs"
          />
        </CardContent>
      </Card>

      {/* Bloco 1 - Meta Anual */}
      <Card>
        <CardHeader>
          <CardTitle>Meta Anual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="faturamento-anual">Faturamento Anual (R$)</Label>
              <Input
                id="faturamento-anual"
                type="number"
                step="0.01"
                value={metaFaturamentoAnual}
                onChange={(e) => setMetaFaturamentoAnual(e.target.value)}
                placeholder="0,00"
              />
            </div>

            <div>
              <Label htmlFor="lucro-anual">Lucro Anual (R$)</Label>
              <Input
                id="lucro-anual"
                type="number"
                step="0.01"
                value={metaLucroAnual}
                onChange={(e) => setMetaLucroAnual(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bloco 2 - Metas Mensais */}
      <Card>
        <CardHeader>
          <CardTitle>Metas Mensais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="faturamento-mensal">Meta de Faturamento (R$) *</Label>
              <Input
                id="faturamento-mensal"
                type="number"
                step="0.01"
                value={metaFaturamentoMensal}
                onChange={(e) => setMetaFaturamentoMensal(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>

            <div>
              <Label htmlFor="lucro-mensal">Meta de Lucro (R$) *</Label>
              <Input
                id="lucro-mensal"
                type="number"
                step="0.01"
                value={metaLucroMensal}
                onChange={(e) => setMetaLucroMensal(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>

            <div>
              <Label htmlFor="pedidos">Quantidade de Pedidos *</Label>
              <Input
                id="pedidos"
                type="number"
                value={metaPedidos}
                onChange={(e) => setMetaPedidos(e.target.value)}
                placeholder="0"
                required
              />
            </div>

            <div>
              <Label htmlFor="ticket-medio">Ticket Médio (R$) *</Label>
              <Input
                id="ticket-medio"
                type="number"
                step="0.01"
                value={metaTicketMedio}
                onChange={(e) => setMetaTicketMedio(e.target.value)}
                placeholder="0,00"
                required
              />
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
          disabled={loading || Math.abs(somaPercentuais - 100) > 0.01}
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
