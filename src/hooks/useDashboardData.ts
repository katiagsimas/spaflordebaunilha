import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardKPIs {
  financeiro: {
    saldo_atual: number;
    saldo_mes_anterior: number;
    variacao_percentual: number;
  };
  encomendas: {
    total_ativas: number;
    urgentes: number;
  };
  producao: {
    tarefas_hoje: number;
    urgentes: number;
  };
}

export interface DashboardAlert {
  tipo: string;
  severidade: 'critico' | 'alta' | 'media';
  mensagem: string;
  icone: string;
  acao_url: string;
}

export interface DashboardAlerts {
  total: number;
  alertas: DashboardAlert[];
}

export interface EntregaProxima {
  encomenda_id: string;
  numero_pedido: string;
  data_entrega: string;
  cliente_nome: string;
  valor_total: number;
  urgencia: 'hoje' | 'amanha' | 'proximos_dias';
}

export interface Aniversariante {
  cliente_id: string;
  nome: string;
  telefone: string;
  quando: 'hoje' | 'amanha' | 'proximos_dias';
}

export interface DadosGrafico {
  data: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

export function useDashboardData() {
  const { user } = useAuth();

  // Query 1: KPIs
  const {
    data: kpis,
    isLoading: isLoadingKPIs,
  } = useQuery({
    queryKey: ['dashboard-kpis', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.rpc('get_dashboard_kpis' as any, {
        p_tenant_id: user.id,
      } as any);

      if (error) throw error;
      return data as unknown as DashboardKPIs;
    },
    enabled: !!user,
    refetchInterval: 60000, // 1 minuto
  });

  // Query 2: Alertas
  const {
    data: alerts,
    isLoading: isLoadingAlerts,
  } = useQuery({
    queryKey: ['dashboard-alerts', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.rpc('get_dashboard_alerts' as any, {
        p_tenant_id: user.id,
      } as any);

      if (error) throw error;
      return data as unknown as DashboardAlerts;
    },
    enabled: !!user,
    refetchInterval: 120000, // 2 minutos
  });

  // Query 3: Entregas próximas
  const {
    data: entregas,
  } = useQuery({
    queryKey: ['dashboard-entregas', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('dashboard_entregas_proximas' as any)
        .select('*')
        .eq('tenant_id', user.id)
        .limit(5);

      if (error) throw error;
      return data as unknown as EntregaProxima[];
    },
    enabled: !!user,
  });

  // Query 4: Aniversariantes
  const {
    data: aniversariantes,
  } = useQuery({
    queryKey: ['dashboard-aniversariantes', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('dashboard_aniversariantes' as any)
        .select('*')
        .eq('tenant_id', user.id)
        .limit(5);

      if (error) throw error;
      return data as unknown as Aniversariante[];
    },
    enabled: !!user,
  });

  // Query 5: Gráfico financeiro
  const {
    data: graficoData,
  } = useQuery({
    queryKey: ['dashboard-grafico', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.rpc('get_grafico_financeiro' as any, {
        p_tenant_id: user.id,
        p_dias: 7,
      } as any);

      if (error) throw error;
      return data as unknown as DadosGrafico[];
    },
    enabled: !!user,
  });

  const isLoading = isLoadingKPIs || isLoadingAlerts;

  return {
    kpis,
    alerts,
    entregas: entregas || [],
    aniversariantes: aniversariantes || [],
    graficoData: graficoData || [],
    isLoading,
  };
}
