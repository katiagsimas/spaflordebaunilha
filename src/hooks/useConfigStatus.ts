import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface ConfigStatus {
  seusDados: boolean;
  categorias: boolean;
  unidadesMedida: boolean;
  bancos: boolean;
}

/**
 * Hook para verificar o status de conclusão das configurações
 */
export function useConfigStatus() {
  const { user } = useAuth();

  const { data: status, isLoading } = useQuery<ConfigStatus>({
    queryKey: ['configStatus', user?.id],
    queryFn: async () => {
      if (!user) {
        return {
          seusDados: false,
          categorias: false,
          unidadesMedida: false,
          bancos: false,
        };
      }

      // Verificar se profile está completo
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome_confeitaria, cpf, telefone, endereco')
        .eq('id', user.id)
        .single();

      const seusDados = !!(
        profile?.nome_confeitaria &&
        profile?.cpf &&
        profile?.telefone &&
        profile?.endereco
      );

      // Verificar se tem categorias
      const { count: categoriasCount } = await supabase
        .from('categorias')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', user.id);

      // Verificar se tem unidades de medida
      const { count: unidadesCount } = await supabase
        .from('unidades_medida')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', user.id);

      // Verificar se tem bancos
      const { count: bancosCount } = await supabase
        .from('bancos')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', user.id);

      return {
        seusDados,
        categorias: (categoriasCount || 0) > 0,
        unidadesMedida: (unidadesCount || 0) > 0,
        bancos: (bancosCount || 0) > 0,
      };
    },
    enabled: !!user,
  });

  return { status, isLoading };
}
