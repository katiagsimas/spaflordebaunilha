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

      // Verificar tipos de documento no localStorage
      const tiposDocumentoStorage = localStorage.getItem('sugarbox_tipos_documento');
      let hasTiposDocumento = false;
      
      if (tiposDocumentoStorage) {
        try {
          const tipos = JSON.parse(tiposDocumentoStorage);
          hasTiposDocumento = Array.isArray(tipos) && tipos.length > 0;
        } catch (e) {
          hasTiposDocumento = false;
        }
      } else {
        // Se não existe no localStorage, considera os valores padrão como já configurados
        hasTiposDocumento = true; // Sistema vem com 7 tipos pré-cadastrados
      }

      return {
        seusDados,
        categorias: (categoriasCount || 0) > 0,
        unidadesMedida: (unidadesCount || 0) > 0,
        bancos: (bancosCount || 0) > 0,
        tiposDocumento: hasTiposDocumento,
      };
    },
    enabled: !!user,
  });

  return { status, isLoading };
}
