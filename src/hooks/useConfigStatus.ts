import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface ConfigStatus {
  seusDados: boolean;
  categorias: boolean;
  unidadesMedida: boolean;
  bancos: boolean;
  tiposDocumento: boolean;
  tiposInsumosEmbalagens: boolean;
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
          tiposInsumosEmbalagens: false,
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

      // Verificar categorias no localStorage
      const categoriasStorage = localStorage.getItem('sugarbox_categorias_receitas');
      let hasCategorias = true; // Sempre true pois o sistema tem categorias pré-cadastradas
      
      // Só verifica se realmente está vazio (usuária deletou todas)
      if (categoriasStorage) {
        try {
          const categorias = JSON.parse(categoriasStorage);
          // Se existe no storage, verifica se tem pelo menos 1
          hasCategorias = Array.isArray(categorias) && categorias.length > 0;
        } catch (e) {
          hasCategorias = true; // Em caso de erro, assume que tem as padrão
        }
      }

      // Verificar unidades de medida no Supabase
      const { count: unidadesCount } = await supabase
        .from('unidades_medida')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', user.id);

      // Verificar tipos de insumos e embalagens no Supabase
      const { count: tiposInsumosCount } = await supabase
        .from('tipos_insumos')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', user.id);

      const { count: tiposEmbalagenCount } = await supabase
        .from('tipos_embalagens')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', user.id);

      const hasTiposInsumosEmbalagens = (tiposInsumosCount || 0) > 0 && (tiposEmbalagenCount || 0) > 0;

      // Verificar bancos no localStorage (igual aos tipos de documento)
      const bancosStorage = localStorage.getItem('sugarbox_bancos');
      let hasBancos = false;
      
      if (bancosStorage) {
        try {
          const bancos = JSON.parse(bancosStorage);
          hasBancos = Array.isArray(bancos) && bancos.length > 0;
        } catch (e) {
          hasBancos = false;
        }
      } else {
        // Se não existe no localStorage, considera os valores padrão como já configurados
        hasBancos = true; // Sistema vem com 11 bancos pré-cadastrados
      }

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
        categorias: hasCategorias,
        unidadesMedida: (unidadesCount || 0) > 0,
        bancos: hasBancos,
        tiposDocumento: hasTiposDocumento,
        tiposInsumosEmbalagens: hasTiposInsumosEmbalagens,
      };
    },
    enabled: !!user,
  });

  return { status, isLoading };
}
