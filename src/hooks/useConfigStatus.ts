import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface ConfigStatus {
  seusDados: boolean;
  categorias: boolean;
  unidadesMedida: boolean;
  bancos: boolean;
  tiposDocumento: boolean;
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
          tiposDocumento: false,
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

      // Categorias sempre existem (pré-cadastradas no sistema)
      const hasCategorias = true;

      // Verificar unidades de medida no Supabase
      const { count: unidadesCount } = await supabase
        .from('unidades_medida')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', user.id);

      // Verificar bancos no banco de dados
      const { data: bancos } = await supabase
        .from('bancos')
        .select('id')
        .eq('usuario_id', user.id)
        .limit(1);
      
      const hasBancos = bancos && bancos.length > 0;

      // Verificar tipos de documento no banco de dados
      const { data: tiposDocumento } = await supabase
        .from('tipos_documento')
        .select('id')
        .eq('usuario_id', user.id)
        .limit(1);
      
      const hasTiposDocumento = tiposDocumento && tiposDocumento.length > 0;

      return {
        seusDados,
        categorias: hasCategorias,
        unidadesMedida: (unidadesCount || 0) > 0,
        bancos: hasBancos,
        tiposDocumento: hasTiposDocumento,
      };
    },
    enabled: !!user,
  });

  return { status, isLoading };
}
