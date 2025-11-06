import { useEffect, useState } from 'react';
import { DollarSign, Package, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface CustoCategoria {
  categoria: string;
  total_itens: number;
  itens_rastreados: number;
  valor_total_estoque: number;
  valor_medio_por_item: number;
}

const getCategoriaStyle = (categoria: string) => {
  const estilos: Record<string, { icone: string; cor: string }> = {
    'Ingredientes': { icone: '🧈', cor: '#FF6B6B' },
    'Embalagens': { icone: '📦', cor: '#4ECDC4' },
    'Descartáveis de Produção': { icone: '🧤', cor: '#95E1D3' },
    'Itens de Decoração': { icone: '🎨', cor: '#F38181' },
    'Higiene / Limpeza': { icone: '🧼', cor: '#AA96DA' },
    'Escritório / Impressão': { icone: '🖨️', cor: '#FCBAD3' }
  };
  return estilos[categoria] || { icone: '📌', cor: '#95A5A6' };
};

export default function CustosPorCategoria() {
  const [custos, setCustos] = useState<CustoCategoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarCustos();
  }, []);

  const carregarCustos = async () => {
    try {
      const { data, error } = await supabase
        .from('custos_por_categoria')
        .select('*');

      if (error) throw error;
      setCustos(data || []);
    } catch (error) {
      console.error('Erro ao carregar custos:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalGeral = custos.reduce((sum, c) => sum + c.valor_total_estoque, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="💰 Custos por Categoria"
          description="Quanto você tem investido em cada categoria de estoque"
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="💰 Custos por Categoria"
        description="Quanto você tem investido em cada categoria de estoque"
      />

      {/* Total Geral */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-primary" />
            Valor Total em Estoque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-primary">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(totalGeral)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Distribuído em {custos.length} categorias
          </p>
        </CardContent>
      </Card>

      {/* Por Categoria */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {custos.map(custo => {
          const style = getCategoriaStyle(custo.categoria);
          const percentual = totalGeral > 0 ? (custo.valor_total_estoque / totalGeral * 100) : 0;

          return (
            <Card key={custo.categoria} className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                      style={{ 
                        backgroundColor: style.cor + '20',
                        border: `2px solid ${style.cor}40`
                      }}
                    >
                      {style.icone}
                    </div>
                    <CardTitle className="text-base">{custo.categoria}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Valor em Estoque</p>
                  <p className="text-2xl font-bold" style={{ color: style.cor }}>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(custo.valor_total_estoque)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${percentual}%`,
                          backgroundColor: style.cor
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium" style={{ color: style.cor }}>
                      {percentual.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Package className="h-3 w-3" />
                      <span className="text-xs">Total de itens</span>
                    </div>
                    <p className="font-semibold text-lg">{custo.total_itens}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-xs">Rastreados</span>
                    </div>
                    <p className="font-semibold text-lg">{custo.itens_rastreados}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
