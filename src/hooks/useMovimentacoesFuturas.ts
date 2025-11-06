import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MovimentacaoFutura {
  tipo_movimento: string;
  origem_id: string;
  data_movimento: string;
  valor: number;
  natureza: 'ENTRADA' | 'SAIDA';
  descricao: string;
  cliente_fornecedor: string | null;
  banco: string | null;
  banco_id: string | null;
  tipo_documento: string | null;
  categoria: string | null;
  usuario_id: string;
  realizado: boolean;
  created_at: string;
}

export function useMovimentacoesFuturas() {
  const { user } = useAuth();

  const hoje = new Date().toISOString().split('T')[0];
  const dataFinal = new Date();
  dataFinal.setDate(dataFinal.getDate() + 30);
  const dataFinalStr = dataFinal.toISOString().split('T')[0];

  const {
    data: movimentacoes = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['movimentacoes-futuras', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('vw_fluxo_caixa_consolidado' as any)
        .select('*')
        .eq('usuario_id', user.id)
        .eq('realizado', false)
        .gte('data_movimento', hoje)
        .lte('data_movimento', dataFinalStr)
        .order('data_movimento', { ascending: true });

      if (error) {
        console.error('Erro ao buscar movimentações futuras:', error);
        throw error;
      }

      return (data || []) as unknown as MovimentacaoFutura[];
    },
    enabled: !!user,
    staleTime: 60000,
  });

  // Calcular agregações
  const entradas = movimentacoes.filter((m) => m.natureza === 'ENTRADA');
  const saidas = movimentacoes.filter((m) => m.natureza === 'SAIDA');
  const totalEntradas = entradas.reduce((acc, m) => acc + m.valor, 0);
  const totalSaidas = saidas.reduce((acc, m) => acc + m.valor, 0);
  const saldoLiquido = totalEntradas - totalSaidas;

  if (error) {
    toast.error('Erro ao carregar movimentações futuras');
  }

  return {
    movimentacoes,
    entradas,
    saidas,
    totalEntradas,
    totalSaidas,
    saldoLiquido,
    isLoading,
    error,
    refetch,
  };
}
