import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DadosGrafico } from '@/hooks/useDashboardData';

interface GraficoFinanceiroProps {
  dados: DadosGrafico[];
}

export function GraficoFinanceiro({ dados }: GraficoFinanceiroProps) {
  const dadosFormatados = dados.map((item) => ({
    ...item,
    dataFormatada: format(new Date(item.data), 'dd/MMM', { locale: ptBR }),
  }));

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(valor);
  };

  if (dados.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📈 Evolução Financeira (últimos 7 dias)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dadosFormatados}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="dataFormatada"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              tickFormatter={formatarMoeda}
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              formatter={(value: number) => formatarMoeda(value)}
              labelStyle={{ color: '#000' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="entradas"
              stroke="#22c55e"
              name="Entradas"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="saidas"
              stroke="#ef4444"
              name="Saídas"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="saldo"
              stroke="#3b82f6"
              name="Saldo"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
