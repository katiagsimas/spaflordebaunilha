import { useState, useEffect, useMemo } from 'react';
import { 
  Target, TrendingUp, DollarSign, AlertCircle, CheckCircle, 
  ShoppingCart, ChevronLeft, ChevronRight, Copy, Save, X
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { BackButton } from '@/components/BackButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ModalAplicarMeses } from '@/components/relatorios/ModalAplicarMeses';

interface DadosPE {
  ano: number;
  mes: number;
  mes_nome: string;
  tipo_dado: 'real' | 'estimado' | 'meta';
  editavel: boolean;
  custos_fixos: number;
  cmv: number;
  cmv_percentual: number;
  faturamento: number;
  margem_contribuicao_percentual: number;
  ponto_equilibrio_reais: number;
  ticket_medio: number;
  ponto_equilibrio_unidades: number;
  quantidade_vendas_real: number;
  resultado_mes: number;
  percentual_acima_pe: number;
  status: 'acima' | 'abaixo' | 'planejado' | 'pendente';
}

export default function PontoEquilibrio() {
  const hoje = new Date();
  const [mesSelecionado, setMesSelecionado] = useState({
    ano: hoje.getFullYear(),
    mes: hoje.getMonth() + 1
  });
  
  const [dados, setDados] = useState<DadosPE | null>(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [modalAplicarAberto, setModalAplicarAberto] = useState(false);
  
  const [custosFixos, setCustosFixos] = useState('');
  const [cmvPercentual, setCmvPercentual] = useState('');
  const [ticketMedio, setTicketMedio] = useState('');

  useEffect(() => {
    carregarDados();
  }, [mesSelecionado]);

  useEffect(() => {
    if (dados && editando) {
      setCustosFixos(dados.custos_fixos.toString());
      setCmvPercentual(dados.cmv_percentual.toString());
      setTicketMedio(dados.ticket_medio.toString());
    }
  }, [dados, editando]);

  const carregarDados = async () => {
    try {
      setLoading(true);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase.rpc('get_ponto_equilibrio_mes', {
        p_usuario_id: user.user.id,
        p_ano: mesSelecionado.ano,
        p_mes: mesSelecionado.mes
      });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setDados(data[0] as DadosPE);
      } else {
        setDados(null);
      }
    } catch (error) {
      console.error('Erro ao carregar PE:', error);
      toast.error('Erro ao carregar dados do Ponto de Equilíbrio');
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async () => {
    try {
      setLoading(true);

      const custosFixosNum = parseFloat(custosFixos) || 0;
      const cmvPercentualNum = parseFloat(cmvPercentual) || 0;
      const ticketMedioNum = parseFloat(ticketMedio) || 0;

      if (custosFixosNum <= 0) {
        toast.error('Custos Fixos deve ser maior que zero');
        return;
      }

      if (cmvPercentualNum <= 0 || cmvPercentualNum >= 100) {
        toast.error('% CMV deve estar entre 0 e 100');
        return;
      }

      if (ticketMedioNum <= 0) {
        toast.error('Ticket Médio deve ser maior que zero');
        return;
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      await supabase
        .from('cmv_mensal')
        .upsert({
          usuario_id: user.user.id,
          ano: mesSelecionado.ano,
          mes: mesSelecionado.mes,
          tipo_dado: 'estimado',
          custos_fixos_estimado: custosFixosNum,
          cmv_percentual_estimado: cmvPercentualNum,
          ticket_medio_estimado: ticketMedioNum,
          usa_dados_sistema: false
        }, {
          onConflict: 'usuario_id,ano,mes'
        });

      toast.success('Estimativas salvas com sucesso!');
      setEditando(false);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar estimativas');
    } finally {
      setLoading(false);
    }
  };

  const handleCopiarMesAnterior = async () => {
    try {
      const mesAnterior = new Date(mesSelecionado.ano, mesSelecionado.mes - 2);
      const anoAnterior = mesAnterior.getFullYear();
      const mesAnt = mesAnterior.getMonth() + 1;

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase.rpc('get_ponto_equilibrio_mes', {
        p_usuario_id: user.user.id,
        p_ano: anoAnterior,
        p_mes: mesAnt
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const dadosAnteriores = data[0] as DadosPE;
        setCustosFixos(dadosAnteriores.custos_fixos.toString());
        setCmvPercentual(dadosAnteriores.cmv_percentual.toString());
        setTicketMedio(dadosAnteriores.ticket_medio.toString());
        
        toast.success(`Valores de ${dadosAnteriores.mes_nome}/${anoAnterior} copiados`);
      } else {
        toast.error('Mês anterior não possui dados');
      }
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const navegarMes = (direcao: 'anterior' | 'proximo') => {
    const novaData = new Date(mesSelecionado.ano, mesSelecionado.mes - 1);
    if (direcao === 'anterior') {
      novaData.setMonth(novaData.getMonth() - 1);
    } else {
      novaData.setMonth(novaData.getMonth() + 1);
    }
    
    setMesSelecionado({
      ano: novaData.getFullYear(),
      mes: novaData.getMonth() + 1
    });
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const valoresCalculados = useMemo(() => {
    const cf = parseFloat(custosFixos) || 0;
    const cmv = parseFloat(cmvPercentual) || 0;
    const tm = parseFloat(ticketMedio) || 0;
    
    const margemContribuicao = 100 - cmv;
    const peReais = margemContribuicao > 0 ? cf / (margemContribuicao / 100) : 0;
    const peUnidades = tm > 0 ? Math.round(peReais / tm) : 0;
    
    const metaFaturamento = peReais * 1.2;
    const metaVendas = tm > 0 ? Math.round(metaFaturamento / tm) : 0;
    
    return {
      margemContribuicao,
      peReais,
      peUnidades,
      metaFaturamento,
      metaVendas
    };
  }, [custosFixos, cmvPercentual, ticketMedio]);

  const mesAtual = new Date();
  const ehMesPassado = new Date(mesSelecionado.ano, mesSelecionado.mes - 1) < 
                       new Date(mesAtual.getFullYear(), mesAtual.getMonth());
  const ehMesFuturo = new Date(mesSelecionado.ano, mesSelecionado.mes - 1) > 
                      new Date(mesAtual.getFullYear(), mesAtual.getMonth());

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Ponto de Equilíbrio"
          description="Carregando..."
          backButton={<BackButton to="/relatorios/inteligencia-negocios" />}
        />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ponto de Equilíbrio"
        description={ehMesPassado ? '📊 Análise de Performance' : '📈 Planejamento Futuro'}
        backButton={<BackButton to="/relatorios/inteligencia-negocios" />}
      />

      {/* Navegação de Mês */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navegarMes('anterior')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center min-w-[180px]">
          <div className="text-lg font-semibold">{dados?.mes_nome || ''}</div>
          <div className="text-sm text-muted-foreground">{mesSelecionado.ano}</div>
        </div>
        <Button variant="outline" size="icon" onClick={() => navegarMes('proximo')}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Alertas */}
      {ehMesPassado && dados?.tipo_dado === 'real' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            📊 Modo Análise: Dados reais carregados do sistema automaticamente.
          </AlertDescription>
        </Alert>
      )}

      {ehMesFuturo && !dados?.tipo_dado && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            📈 Modo Planejamento: Digite suas estimativas para calcular as metas deste mês.
          </AlertDescription>
        </Alert>
      )}

      {ehMesFuturo && dados?.tipo_dado === 'estimado' && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            ✅ Metas Definidas: Este mês já possui planejamento configurado.
          </AlertDescription>
        </Alert>
      )}

      {/* MÊS PASSADO */}
      {ehMesPassado && dados && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Custos Fixos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatarMoeda(dados.custos_fixos)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ponto de Equilíbrio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatarMoeda(dados.ponto_equilibrio_reais)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(dados.ponto_equilibrio_unidades)} vendas necessárias
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faturamento Real</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatarMoeda(dados.faturamento)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dados.quantidade_vendas_real} vendas realizadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resultado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", dados.resultado_mes >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {formatarMoeda(dados.resultado_mes)}
                </div>
                <Badge variant="outline" className="mt-1">
                  {dados.resultado_mes >= 0 ? '✅ Lucro' : '🚨 Prejuízo'}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance do Mês</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm font-medium mb-1">Margem de Contribuição</div>
                  <div className="text-2xl font-bold">
                    {dados.margem_contribuicao_percentual.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sobra após pagar custos variáveis (CMV)
                  </p>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Desempenho vs Meta</div>
                  {dados.status === 'acima' ? (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          +{dados.percentual_acima_pe.toFixed(0)}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Acima do Ponto de Equilíbrio
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {dados.percentual_acima_pe.toFixed(0)}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Abaixo do Ponto de Equilíbrio
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="font-semibold mb-2">💡 Insights:</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {dados.status === 'abaixo' && (
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>
                        Você precisava de mais {Math.round(dados.ponto_equilibrio_unidades - dados.quantidade_vendas_real)} vendas
                        ({formatarMoeda(dados.ponto_equilibrio_reais - dados.faturamento)}) 
                        para atingir o ponto de equilíbrio.
                      </span>
                    </li>
                  )}
                  
                  {dados.status === 'acima' && (
                    <li className="flex gap-2">
                      <span>✅</span>
                      <span>
                        Parabéns! Você teve {formatarMoeda(dados.resultado_mes)} de lucro neste mês.
                      </span>
                    </li>
                  )}

                  {dados.margem_contribuicao_percentual < 40 && (
                    <li className="flex gap-2">
                      <span>⚠️</span>
                      <span>
                        Sua margem de contribuição está em {dados.margem_contribuicao_percentual.toFixed(1)}%. 
                        Considere revisar seus preços ou reduzir o CMV.
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* MÊS FUTURO */}
      {(ehMesFuturo || !dados) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {editando || !dados ? '📝 Digite suas Estimativas' : '✅ Metas Configuradas'}
              </CardTitle>
              {dados && !editando && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditando(true)}>
                    ✏️ Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setModalAplicarAberto(true)}>
                    📋 Aplicar para Outros Meses
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {(editando || !dados) && (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="custos-fixos">Custos Fixos Mensais *</Label>
                    <Input
                      id="custos-fixos"
                      type="number"
                      step="0.01"
                      value={custosFixos}
                      onChange={(e) => setCustosFixos(e.target.value)}
                      placeholder="Ex: 5000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Aluguel, luz, água, internet, salários...
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cmv-percentual">% CMV Esperado *</Label>
                    <Input
                      id="cmv-percentual"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={cmvPercentual}
                      onChange={(e) => setCmvPercentual(e.target.value)}
                      placeholder="Ex: 28"
                    />
                    <p className="text-xs text-muted-foreground">
                      Custo dos ingredientes sobre vendas
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ticket-medio">Ticket Médio *</Label>
                    <Input
                      id="ticket-medio"
                      type="number"
                      step="0.01"
                      value={ticketMedio}
                      onChange={(e) => setTicketMedio(e.target.value)}
                      placeholder="Ex: 500"
                    />
                    <p className="text-xs text-muted-foreground">
                      Valor médio por venda
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" onClick={handleCopiarMesAnterior} className="gap-2">
                    <Copy className="h-4 w-4" />
                    Copiar Mês Anterior
                  </Button>
                </div>
              </>
            )}

            {(parseFloat(custosFixos) > 0 && parseFloat(cmvPercentual) > 0 && parseFloat(ticketMedio) > 0) && (
              <div className="border-t pt-4 space-y-4">
                <p className="font-semibold">🎯 Suas Metas Calculadas:</p>
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="text-sm text-muted-foreground">Margem Contribuição</div>
                      <div className="text-2xl font-bold">
                        {valoresCalculados.margemContribuicao.toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="text-sm text-muted-foreground">PE em Reais</div>
                      <div className="text-2xl font-bold">
                        {formatarMoeda(valoresCalculados.peReais)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="text-sm text-muted-foreground">PE em Vendas</div>
                      <div className="text-2xl font-bold">
                        {valoresCalculados.peUnidades}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="text-sm text-muted-foreground">Meta (20% lucro)</div>
                      <div className="text-2xl font-bold">
                        {formatarMoeda(valoresCalculados.metaFaturamento)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {valoresCalculados.metaVendas} vendas
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <AlertDescription>
                    💡 Para não ter prejuízo: Você precisa faturar no mínimo {formatarMoeda(valoresCalculados.peReais)} 
                    ({valoresCalculados.peUnidades} vendas). Para ter 20% de lucro, sua meta é {formatarMoeda(valoresCalculados.metaFaturamento)} 
                    ({valoresCalculados.metaVendas} vendas).
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {(editando || !dados) && (
              <div className="flex justify-end gap-2">
                {editando && (
                  <Button variant="outline" onClick={() => setEditando(false)}>
                    Cancelar
                  </Button>
                )}
                <Button onClick={handleSalvar} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Estimativas'}
                </Button>
              </div>
            )}

            {!editando && dados && (
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Margem Contribuição</div>
                    <div className="text-2xl font-bold">
                      {dados.margem_contribuicao_percentual.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">PE em Reais</div>
                    <div className="text-2xl font-bold">
                      {formatarMoeda(dados.ponto_equilibrio_reais)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">PE em Vendas</div>
                    <div className="text-2xl font-bold">
                      {Math.round(dados.ponto_equilibrio_unidades)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Meta (20% lucro)</div>
                    <div className="text-2xl font-bold">
                      {formatarMoeda(dados.ponto_equilibrio_reais * 1.2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round(dados.ponto_equilibrio_unidades * 1.2)} vendas
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {dados && (editando || dados.tipo_dado === 'estimado') && (
        <ModalAplicarMeses
          aberto={modalAplicarAberto}
          onFechar={() => setModalAplicarAberto(false)}
          valoresBase={{
            custos_fixos: parseFloat(custosFixos) || dados.custos_fixos,
            cmv_percentual: parseFloat(cmvPercentual) || dados.cmv_percentual,
            ticket_medio: parseFloat(ticketMedio) || dados.ticket_medio
          }}
          mesOrigem={mesSelecionado}
          onSucesso={() => {
            toast.success('Estimativas aplicadas com sucesso');
          }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>📚 Como Usar</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span>📊</span>
              <span>Meses Passados: Sistema carrega dados reais automaticamente. Você pode ver como foi sua performance.</span>
            </li>
            <li className="flex gap-2">
              <span>📈</span>
              <span>Meses Futuros: Digite suas estimativas para calcular quanto precisa vender. Use "Copiar Mês Anterior" para facilitar.</span>
            </li>
            <li className="flex gap-2">
              <span>🎯</span>
              <span>Ponto de Equilíbrio: É o mínimo que você precisa faturar para não ter prejuízo (cobrir custos fixos + variáveis).</span>
            </li>
            <li className="flex gap-2">
              <span>📋</span>
              <span>Aplicar para Outros Meses: Depois de definir estimativas, você pode replicar para vários meses de uma vez, economizando tempo.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
