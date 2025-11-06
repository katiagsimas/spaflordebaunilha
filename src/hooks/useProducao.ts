import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TarefaProducao {
  id: string;
  usuario_id: string;
  descricao: string;
  data: string;
  concluida: boolean;
  encomenda_id?: string;
  encomenda_item_id?: string;
  receita_id?: string;
  quantidade?: number;
  tempo_estimado?: number;
  prioridade?: 'urgente' | 'normal' | 'baixa';
  hora_entrega?: string;
  cliente_nome?: string;
  concluida_em?: string;
  observacoes?: string;
  data_entrega?: string;
  encomenda_status?: string;
  cliente_nome_join?: string;
  produto_nome?: string;
  receita_nome?: string;
  tempo_preparo?: number;
  unidade_tempo?: string;
  receita_categoria?: string;
  categoria_tempo?: 'urgente' | 'hoje' | 'amanha' | 'futuro';
  dias_ate_entrega?: number;
}

export function useProducao(data?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query para listar tarefas
  const { data: tarefas = [], isLoading, error, refetch } = useQuery({
    queryKey: ['producao-tarefas', data],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('producao_tarefas')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('concluida', false)
        .order('data', { ascending: true });
      
      if (data) {
        query = query.eq('data', data);
      }
      
      const { data: result, error } = await query;
      
      if (error) throw error;
      return result as TarefaProducao[];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  // Mutation: gerar tarefas automáticas
  const { mutate: gerarTarefas, isPending: isGerando } = useMutation({
    mutationFn: async (diasAntecedencia: number = 3) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase.rpc('gerar_tarefas_producao' as any, {
        p_usuario_id: user.id,
        p_data_inicial: new Date().toISOString().split('T')[0],
        p_dias_antecedencia: diasAntecedencia,
      });
      
      if (error) throw error;
      return data as number;
    },
    onSuccess: (quantidade) => {
      toast.success(`${quantidade} tarefa(s) gerada(s) com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['producao-tarefas'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao gerar tarefas: ' + error.message);
    },
  });

  // Mutation: marcar como produzido
  const { mutate: marcarProduzido, isPending: isMarcando } = useMutation({
    mutationFn: async ({ tarefaId, baixarEstoque = true }: { tarefaId: string; baixarEstoque?: boolean }) => {
      const { data, error } = await supabase.rpc('marcar_tarefa_produzida' as any, {
        p_tarefa_id: tarefaId,
        p_baixar_estoque: baixarEstoque,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Tarefa marcada como produzida!');
      queryClient.invalidateQueries({ queryKey: ['producao-tarefas'] });
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
      queryClient.invalidateQueries({ queryKey: ['ingredientes-dia'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao marcar tarefa: ' + error.message);
    },
  });

  // Mutation: criar tarefa manual
  const { mutate: criarTarefa, isPending: isCriando } = useMutation({
    mutationFn: async (novaTarefa: Partial<TarefaProducao>) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('producao_tarefas')
        .insert({
          descricao: novaTarefa.descricao || '',
          data: novaTarefa.data || new Date().toISOString().split('T')[0],
          usuario_id: user.id,
          concluida: false,
          ...novaTarefa,
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Tarefa criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['producao-tarefas'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar tarefa: ' + error.message);
    },
  });

  // Processar dados: tarefas por categoria
  const tarefasPorCategoria = {
    urgente: tarefas.filter(t => t.prioridade === 'urgente'),
    hoje: tarefas.filter(t => t.prioridade !== 'urgente' && t.data === new Date().toISOString().split('T')[0]),
    amanha: tarefas.filter(t => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      return t.data === amanha.toISOString().split('T')[0];
    }),
    futuro: tarefas.filter(t => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      return t.data && t.data > amanha.toISOString().split('T')[0];
    }),
  };

  // Calcular stats
  const stats = {
    total: tarefas.length,
    totalItens: tarefas.reduce((sum, t) => sum + (t.quantidade || 0), 0),
    tempoTotal: tarefas.reduce((sum, t) => sum + (t.tempo_estimado || 0), 0),
  };

  return {
    tarefas,
    tarefasPorCategoria,
    stats,
    isLoading,
    error,
    gerarTarefas,
    marcarProduzido,
    criarTarefa,
    isGerando,
    isMarcando,
    isCriando,
    refetch,
  };
}
