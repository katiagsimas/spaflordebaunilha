import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserId } from './useUserId';
import { toast } from 'sonner';

export interface UnidadeMedida {
  id: string;
  usuario_id: string;
  nome: string;
  sigla: string;
  codigo?: string;
  ativo?: boolean;
  e_padrao?: boolean;
  created_at?: string;
  updated_at?: string;
}

const UNIDADES_PADRAO = [
  { nome: 'Centímetros', sigla: 'cm' },
  { nome: 'Gramas', sigla: 'g' },
  { nome: 'Mililitros', sigla: 'ml' },
  { nome: 'Unidades', sigla: 'un' },
];

export function useUnidadesMedida() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  const gerarProximoCodigo = async (): Promise<string> => {
    const { data, error } = await supabase
      .from('unidades_medida')
      .select('codigo')
      .eq('usuario_id', userId)
      .order('codigo', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return '001';
    const ultimoCodigo = data[0].codigo;
    if (!ultimoCodigo) return '001';
    const proximoNumero = parseInt(ultimoCodigo) + 1;
    return proximoNumero.toString().padStart(3, '0');
  };

  const { data: unidades = [], isLoading: loading } = useQuery({
    queryKey: ['unidades_medida', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('unidades_medida')
        .select('*')
        .eq('usuario_id', userId)
        .order('nome', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        // Seed unidades padrão
        const unidadesComUsuario = UNIDADES_PADRAO.map((u, index) => ({
          ...u,
          usuario_id: userId,
          codigo: (index + 1).toString().padStart(3, '0'),
          e_padrao: true,
          ativo: true,
        }));

        const { data: inserted, error: insertError } = await supabase
          .from('unidades_medida')
          .insert(unidadesComUsuario)
          .select();

        if (insertError) {
          console.error('Erro ao criar unidades padrão:', insertError);
          return [];
        }
        return (inserted || []) as UnidadeMedida[];
      }

      return data as UnidadeMedida[];
    },
    enabled: !!userId,
  });

  const createUnidadeMutation = useMutation({
    mutationFn: async (
      unidade: Omit<UnidadeMedida, 'id' | 'usuario_id' | 'created_at' | 'updated_at' | 'codigo' | 'ativo'>
    ) => {
      const codigo = await gerarProximoCodigo();
      const { data, error } = await supabase
        .from('unidades_medida')
        .insert({ ...unidade, usuario_id: userId, codigo, ativo: true })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades_medida'] });
      toast.success('Unidade criada com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao criar unidade:', err);
      toast.error('Erro ao criar unidade: ' + err.message);
    },
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const unidade = unidades.find(u => u.id === id);
      if (unidade?.e_padrao && !ativo) {
        throw new Error('Não é possível desabilitar unidades padrão do sistema');
      }

      const { data, error } = await supabase
        .from('unidades_medida')
        .update({ ativo })
        .eq('id', id)
        .eq('usuario_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['unidades_medida'] });
      toast.success(variables.ativo ? 'Unidade reativada!' : 'Unidade desabilitada!');
    },
    onError: (err: any) => {
      console.error('Erro ao alterar unidade:', err);
      toast.error(err.message || 'Erro ao alterar unidade');
    },
  });

  const updateUnidadeMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UnidadeMedida> }) => {
      const unidade = unidades.find(u => u.id === id);
      const updatesToApply = unidade?.e_padrao
        ? (({ e_padrao, nome, ativo, ...rest }) => rest)(updates)
        : updates;

      const { data, error } = await supabase
        .from('unidades_medida')
        .update(updatesToApply)
        .eq('id', id)
        .eq('usuario_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades_medida'] });
      toast.success('Unidade atualizada!');
    },
    onError: (err: any) => {
      console.error('Erro ao atualizar unidade:', err);
      toast.error('Erro ao atualizar unidade: ' + err.message);
    },
  });

  const deleteUnidadeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('unidades_medida')
        .delete()
        .eq('id', id)
        .eq('usuario_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades_medida'] });
      toast.success('Unidade deletada!');
    },
    onError: (err: any) => {
      console.error('Erro ao deletar unidade:', err);
      toast.error('Erro ao deletar unidade: ' + err.message);
    },
  });

  // Wrappers para preservar a mesma assinatura usada pelos consumidores
  const createUnidade = (
    unidade: Omit<UnidadeMedida, 'id' | 'usuario_id' | 'created_at' | 'updated_at' | 'codigo' | 'ativo'>
  ) => createUnidadeMutation.mutateAsync(unidade);

  const toggleAtivo = (id: string, ativo: boolean) =>
    toggleAtivoMutation.mutateAsync({ id, ativo });

  const updateUnidade = (id: string, updates: Partial<UnidadeMedida>) =>
    updateUnidadeMutation.mutateAsync({ id, updates });

  const deleteUnidade = (id: string) => deleteUnidadeMutation.mutateAsync(id);

  const refetch = () =>
    queryClient.invalidateQueries({ queryKey: ['unidades_medida', userId] });

  return {
    unidades,
    loading,
    isLoading: loading,
    createUnidade,
    updateUnidade,
    deleteUnidade,
    toggleAtivo,
    refetch,
  };
}
