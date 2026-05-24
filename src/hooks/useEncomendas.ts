import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';
import { toast } from 'sonner';

interface Encomenda {
  id: string;
  usuario_id: string;
  owner_group_id?: string | null;
  cliente: string;
  data_pedido: string;
  data_entrega: string;
  hora_entrega?: string;
  status: string;
  valor: number;
  observacoes?: string;
  telefone?: string;
  endereco?: string;
  numero?: string;
  cep?: string;
  desconto_percentual?: number;
  desconto_valor?: number;
  taxa_entrega?: number;
  topo_bolo?: number;
  outros?: number;
  topo_tema?: string;
  topo_aniversariante?: string;
  topo_idade?: string;
  topo_obs?: string;
  topo_imagens?: string[];
  pagamentos?: Array<{ valor: number; data: string; tipo_pagamento: string; pago?: boolean; banco_id?: string }>;
  saldo_restante?: number;
  conta_receber_id?: string | null;
  tags?: Array<{ id: string; nome: string; cor: string; padrao_sistema?: boolean }>;
  created_at?: string;
  updated_at?: string;
}

export function useEncomendas() {
  const { user } = useAuth();
  const { activeGroupId } = useGroup();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const queryKey = ['encomendas', activeGroupId];

  const { data: encomendas = [], isLoading: loading, refetch } = useQuery<Encomenda[]>({
    queryKey,
    enabled: !!activeGroupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encomendas')
        .select(`
          *,
          tags:encomendas_tags (
            tag:tags_encomendas (
              id,
              nome,
              cor,
              padrao_sistema
            )
          )
        `)
        .eq('owner_group_id', activeGroupId!)
        .order('data_entrega', { ascending: false });

      if (error) {
        toast.error('Erro ao carregar encomendas: ' + error.message);
        throw error;
      }

      return (data || []).map((encomenda: any) => ({
        ...encomenda,
        topo_imagens: Array.isArray(encomenda.topo_imagens) ? encomenda.topo_imagens : [],
        pagamentos: Array.isArray(encomenda.pagamentos) ? encomenda.pagamentos : [],
        tags: encomenda.tags?.map((t: any) => t.tag).filter(Boolean) || [],
      })) as unknown as Encomenda[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (encomenda: Omit<Encomenda, 'id' | 'usuario_id' | 'owner_group_id' | 'created_at' | 'updated_at'>) => {
      if (!userId) throw new Error('Usuário não autenticado');
      if (!activeGroupId) throw new Error('Grupo não selecionado');
      const { data, error } = await supabase
        .from('encomendas')
        .insert({ ...encomenda, owner_group_id: activeGroupId, usuario_id: userId } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encomendas', activeGroupId] });
      toast.success('Encomenda criada!');
    },
    onError: (err: any) => {
      toast.error('Erro ao criar encomenda: ' + err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Encomenda> }) => {
      if (!activeGroupId) throw new Error('Grupo não selecionado');
      const { data, error } = await supabase
        .from('encomendas')
        .update(updates as any)
        .eq('id', id)
        .eq('owner_group_id', activeGroupId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encomendas', activeGroupId] });
      toast.success('Encomenda atualizada!');
    },
    onError: (err: any) => {
      toast.error('Erro ao atualizar encomenda: ' + err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!activeGroupId) throw new Error('Grupo não selecionado');
      const { error } = await supabase
        .from('encomendas')
        .delete()
        .eq('id', id)
        .eq('owner_group_id', activeGroupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encomendas', activeGroupId] });
      toast.success('Encomenda deletada!');
    },
    onError: (err: any) => {
      toast.error('Erro ao deletar encomenda: ' + err.message);
    },
  });

  return {
    encomendas,
    loading,
    createEncomenda: (encomenda: Omit<Encomenda, 'id' | 'usuario_id' | 'owner_group_id' | 'created_at' | 'updated_at'>) =>
      createMutation.mutateAsync(encomenda),
    updateEncomenda: (id: string, updates: Partial<Encomenda>) =>
      updateMutation.mutateAsync({ id, updates }),
    deleteEncomenda: (id: string) => deleteMutation.mutateAsync(id),
    refetch,
  };
}
