import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ProjecaoSaldo {
  data: string;
  saldo_projetado: number;
  entradas_dia: number;
  saidas_dia: number;
  tem_alerta: boolean;
  descricao_alerta: string | null;
}

export interface AlertaFluxo {
  tipo_alerta: string;
  severidade: 'CRITICO' | 'ALTO' | 'MEDIO';
  data_evento: string;
  dias_restantes: number;
  valor: number;
  descricao: string;
  origem_id: string | null;
}

interface UseFluxoCaixaIntegradoProps {
  diasProjecao?: number;
  bancoId?: string;
}

export function useFluxoCaixaIntegrado({ 
  diasProjecao = 30, 
  bancoId 
}: UseFluxoCaixaIntegradoProps = {}) {
  const { user } = useAuth();

  // Query A - Projeção de Saldo
  const {
    data: projecoes = [],
    isLoading: isLoadingProjecoes,
    error: errorProjecoes,
    refetch: refetchProjecoes,
  } = useQuery({
    queryKey: ['projecao-saldo', diasProjecao, bancoId, user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.rpc('calcular_projecao_saldo' as any, {
        p_usuario_id: user.id,
        p_data_inicial: new Date().toISOString().split('T')[0],
        p_dias_projecao: diasProjecao,
        p_banco_id: bancoId || null,
      });

      if (error) {
        console.error('Erro ao buscar projeção:', error);
        throw error;
      }

      return (data || []) as unknown as ProjecaoSaldo[];
    },
    enabled: !!user,
    staleTime: 60000, // 1 minuto
  });

  // Query B - Alertas
  const {
    data: alertas = [],
    isLoading: isLoadingAlertas,
    error: errorAlertas,
    refetch: refetchAlertas,
  } = useQuery({
    queryKey: ['alertas-fluxo-caixa', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.rpc('buscar_alertas_fluxo_caixa' as any, {
        p_usuario_id: user.id,
        p_dias_antecedencia: 7,
      });

      if (error) {
        console.error('Erro ao buscar alertas:', error);
        throw error;
      }

      return (data || []) as unknown as AlertaFluxo[];
    },
    enabled: !!user,
    staleTime: 60000,
  });

  // Calcular resumos
  const saldoHoje = projecoes[0]?.saldo_projetado || 0;
  const saldo7Dias = projecoes[7]?.saldo_projetado || 0;
  const saldo30Dias = projecoes[29]?.saldo_projetado || 0;
  const alertasCriticos = alertas.filter((a) => a.severidade === 'CRITICO').length;
  const temProblemas = alertasCriticos > 0;

  // Tratamento de erros
  if (errorProjecoes) {
    toast.error('Erro ao carregar projeção de saldo');
  }
  if (errorAlertas) {
    toast.error('Erro ao carregar alertas');
  }

  const isLoading = isLoadingProjecoes || isLoadingAlertas;
  const error = errorProjecoes || errorAlertas;

  const refetch = async () => {
    await Promise.all([refetchProjecoes(), refetchAlertas()]);
  };

  return {
    saldoHoje,
    saldo7Dias,
    saldo30Dias,
    projecoes,
    alertas,
    alertasCriticos,
    temProblemas,
    isLoading,
    error,
    refetch,
  };
}
