import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  titulo: string;
  valor: string | number;
  icone: React.ReactNode;
  subtitulo?: string;
  variacao?: number;
  corVariacao?: 'positiva' | 'negativa';
  onClick?: () => void;
}

export function KPICard({
  titulo,
  valor,
  icone,
  subtitulo,
  variacao,
  corVariacao,
  onClick,
}: KPICardProps) {
  return (
    <Card
      className={`p-4 md:p-6 ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <p className="text-sm text-muted-foreground">{titulo}</p>
          <p className="text-3xl font-bold">{valor}</p>
          
          {subtitulo && (
            <p className="text-sm text-muted-foreground">{subtitulo}</p>
          )}
          
          {variacao !== undefined && (
            <div className={`flex items-center gap-1 text-sm ${
              corVariacao === 'positiva' ? 'text-green-600' : 'text-red-600'
            }`}>
              {corVariacao === 'positiva' ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{Math.abs(variacao).toFixed(1)}% vs mês anterior</span>
            </div>
          )}
        </div>
        
        <div className="text-muted-foreground">
          {icone}
        </div>
      </div>
    </Card>
  );
}
