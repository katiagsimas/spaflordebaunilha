import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjecaoSaldo } from '@/hooks/useFluxoCaixaIntegrado';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface GraficoProjecaoProps {
  dados: ProjecaoSaldo[];
}

export function GraficoProjecao({ dados }: GraficoProjecaoProps) {
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatarValorEixo = (valor: number) => {
    const k = valor / 1000;
    return `R$ ${k.toFixed(0)}k`;
  };

  // Encontrar maior e menor saldo
  const saldos = dados.map((d) => d.saldo_projetado);
  const maiorSaldo = Math.max(...saldos);
  const menorSaldo = Math.min(...saldos);

  // Preparar dados para o gráfico
  const dadosGrafico = dados.map((d) => ({
    data: format(new Date(d.data), 'dd/MM', { locale: ptBR }),
    saldo: d.saldo_projetado,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Projeção de Saldo (30 dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="data"
                tick={{ fontSize: 12 }}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={formatarValorEixo}
              />
              <Tooltip
                formatter={(value: number) => formatarValor(value)}
                labelStyle={{ color: '#000' }}
              />
              <ReferenceLine
                y={0}
                stroke="#ef4444"
                strokeDasharray="3 3"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="saldo"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Maior Saldo
                </span>
              </div>
              <p className="text-2xl font-bold text-green-700">
                {formatarValor(maiorSaldo)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-700">
                  Menor Saldo
                </span>
              </div>
              <p className="text-2xl font-bold text-red-700">
                {formatarValor(menorSaldo)}
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
