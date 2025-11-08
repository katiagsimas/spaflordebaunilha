import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, TrendingDown, Wallet, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ResumoMensalData {
  ano: number;
  mes: number;
  saldo_inicial: number;
  entradas: number;
  saidas: number;
  saldo_final: number;
}

export function ResumoEstoqueMensal() {
  const [dados, setDados] = useState<ResumoMensalData | null>(null);
  const [editandoSaldoInicial, setEditandoSaldoInicial] = useState(false);
  const [saldoInicialTemp, setSaldoInicialTemp] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const mesAtual = new Date().getMonth() + 1;
  const anoAtual = new Date().getFullYear();
  const nomeMes = new Date(anoAtual, mesAtual - 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');

  useEffect(() => {
    carregarResumo();
  }, []);

  const carregarResumo = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dataInicio = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-01`;
      const dataFim = new Date(anoAtual, mesAtual, 0);
      const dataFimStr = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-${dataFim.getDate()}`;

      // Buscar movimentos do mês atual
      const { data: movimentos, error } = await supabase
        .from('movimentos_estoque_v2')
        .select('tipo, valor_total')
        .eq('usuario_id', user.id)
        .gte('data', dataInicio)
        .lte('data', dataFimStr);

      if (error) throw error;

      const entradas = movimentos
        ?.filter(m => m.tipo === 'entrada')
        .reduce((sum, m) => sum + (m.valor_total || 0), 0) || 0;

      const saidas = movimentos
        ?.filter(m => m.tipo === 'saida' || m.tipo === 'perda')
        .reduce((sum, m) => sum + (m.valor_total || 0), 0) || 0;

      // Buscar saldo do estoque atual (valor total em estoque)
      const { data: estoque } = await supabase
        .from('estoque_atual_v2')
        .select('valor_estoque')
        .eq('usuario_id', user.id);

      const valorTotalEstoque = estoque?.reduce((sum, e) => sum + (e.valor_estoque || 0), 0) || 0;

      // Calcular saldo inicial baseado na fórmula: Saldo Final = Saldo Inicial + Entradas - Saídas
      // Portanto: Saldo Inicial = Saldo Final - Entradas + Saídas
      const saldoInicial = valorTotalEstoque - entradas + saidas;

      setDados({
        ano: anoAtual,
        mes: mesAtual,
        saldo_inicial: saldoInicial,
        entradas,
        saidas,
        saldo_final: valorTotalEstoque
      });
    } catch (err: any) {
      console.error('Erro ao carregar resumo mensal:', err);
      toast({
        title: "Erro ao carregar resumo",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const salvarSaldoInicial = () => {
    if (!dados || !saldoInicialTemp) return;
    
    const novoSaldoInicial = parseFloat(saldoInicialTemp.replace(/[^\d,]/g, '').replace(',', '.'));
    if (isNaN(novoSaldoInicial)) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor numérico válido",
        variant: "destructive"
      });
      return;
    }

    const novoSaldoFinal = novoSaldoInicial + dados.entradas - dados.saidas;
    
    setDados({
      ...dados,
      saldo_inicial: novoSaldoInicial,
      saldo_final: novoSaldoFinal
    });

    setEditandoSaldoInicial(false);
    setSaldoInicialTemp("");
    
    toast({
      title: "Saldo inicial atualizado",
      description: "O saldo foi recalculado com sucesso"
    });
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  if (loading || !dados) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {/* Ano Atual */}
      <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-slate-500">
        <CardHeader className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold text-muted-foreground mb-0.5">
                Ano Atual
              </CardTitle>
              <p className="text-xl font-bold truncate">{dados.ano}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Mês Atual */}
      <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-slate-500">
        <CardHeader className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold text-muted-foreground mb-0.5">
                Mês Atual
              </CardTitle>
              <p className="text-lg font-bold capitalize truncate">{nomeMes}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Saldo Inicial */}
      <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
        <CardHeader className="p-3">
          {editandoSaldoInicial ? (
            <div className="space-y-2">
              <Input
                type="text"
                value={saldoInicialTemp}
                onChange={(e) => setSaldoInicialTemp(e.target.value)}
                placeholder="0,00"
                className="h-8"
              />
              <div className="flex gap-1">
                <Button size="sm" onClick={salvarSaldoInicial} className="h-7 text-xs">
                  <Save className="h-3 w-3 mr-1" />
                  Salvar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setEditandoSaldoInicial(false);
                    setSaldoInicialTemp("");
                  }}
                  className="h-7 text-xs"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="cursor-pointer"
              onClick={() => {
                setEditandoSaldoInicial(true);
                setSaldoInicialTemp(dados.saldo_inicial.toFixed(2));
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Wallet className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-semibold text-muted-foreground mb-0.5">
                    Saldo Inicial
                  </CardTitle>
                  <p className="text-lg font-bold text-blue-600 truncate">
                    {formatarMoeda(dados.saldo_inicial)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Clique para editar</p>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Entradas */}
      <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
        <CardHeader className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold text-muted-foreground mb-0.5">
                Entradas
              </CardTitle>
              <p className="text-lg font-bold text-green-600 truncate">
                {formatarMoeda(dados.entradas)}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Saídas */}
      <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-red-500">
        <CardHeader className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <TrendingDown className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold text-muted-foreground mb-0.5">
                Saídas
              </CardTitle>
              <p className="text-lg font-bold text-red-600 truncate">
                {formatarMoeda(dados.saidas)}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Saldo Final */}
      <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-emerald-500">
        <CardHeader className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Wallet className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold text-muted-foreground mb-0.5">
                Saldo Final
              </CardTitle>
              <p className="text-lg font-bold text-emerald-600 truncate">
                {formatarMoeda(dados.saldo_final)}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
