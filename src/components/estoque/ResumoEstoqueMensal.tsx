import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  const nomeMes = new Date(anoAtual, mesAtual - 1).toLocaleDateString('pt-BR', { month: 'long' });

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
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
      {/* Ano Atual */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ano Atual</p>
              <p className="text-2xl font-bold">{dados.ano}</p>
            </div>
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Mês Atual */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Mês Atual</p>
              <p className="text-xl font-bold capitalize">{nomeMes}</p>
            </div>
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Saldo Inicial */}
      <Card>
        <CardContent className="pt-6">
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
              className="cursor-pointer hover:opacity-70 transition-opacity"
              onClick={() => {
                setEditandoSaldoInicial(true);
                setSaldoInicialTemp(dados.saldo_inicial.toFixed(2));
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Inicial</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatarMoeda(dados.saldo_inicial)}
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Clique para editar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entradas */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Entradas</p>
              <p className="text-2xl font-bold text-green-600">
                {formatarMoeda(dados.entradas)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      {/* Saídas */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saídas</p>
              <p className="text-2xl font-bold text-red-600">
                {formatarMoeda(dados.saidas)}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
        </CardContent>
      </Card>

      {/* Saldo Final */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo Final</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatarMoeda(dados.saldo_final)}
              </p>
            </div>
            <Wallet className="h-8 w-8 text-emerald-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
