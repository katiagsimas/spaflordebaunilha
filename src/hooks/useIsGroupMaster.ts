import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Retorna informações sobre a "mestria" do usuário no grupo ativo.
 *
 * - `isMaster`: o usuário atual é o mestre (master_user_id) do grupo ativo.
 * - `masterId`: o ID do mestre do grupo ativo.
 * - `masterEmail` / `masterName`: dados do mestre (para mensagens "gerenciado por…").
 *
 * Quem NÃO é mestre é um MEMBRO (USER ou ADMIN secundário) — herda dados base
 * (Meus Dados, Mão de Obra, Backup) e plano do mestre.
 */
export function useIsGroupMaster() {
  const { user } = useAuth();
  const { activeGroupId, isMother } = useGroup();

  const { data, isLoading } = useQuery({
    queryKey: ['group-master', activeGroupId],
    queryFn: async () => {
      if (!activeGroupId) return null;
      const { data: group } = await supabase
        .from('groups')
        .select('master_user_id')
        .eq('id', activeGroupId)
        .maybeSingle();
      const masterId = (group as any)?.master_user_id || null;
      if (!masterId) return { masterId: null, masterEmail: null, masterName: null };
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, nome_completo')
        .eq('id', masterId)
        .maybeSingle();
      return {
        masterId,
        masterEmail: profile?.email || null,
        masterName: profile?.nome_completo || null,
      };
    },
    enabled: !!activeGroupId,
    staleTime: 1000 * 60 * 5,
  });

  const masterId = data?.masterId || null;
  // MOTHER tem comportamento de mestre por padrão (acesso total para edição de dados base).
  const isMaster = !!user && (isMother || (!!masterId && masterId === user.id));

  return {
    isMaster,
    isMember: !isMaster,
    masterId,
    masterEmail: data?.masterEmail || null,
    masterName: data?.masterName || null,
    isLoading,
  };
}
