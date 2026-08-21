import { supabase } from '@/integrations/supabase/client';

/**
 * Retorna o grupo ativo do usuário autenticado.
 * Obrigatório em todos os inserts de tabelas com RLS por owner_group_id.
 */
export async function getActiveGroupId(userId: string): Promise<string> {
  const { data, error } = await supabase.rpc('get_active_group_id', { _user_id: userId });

  if (!error && data) return data as string;

  // Fallback: primeiro grupo ativo do usuário
  const { data: roles, error: rolesError } = await supabase
    .from('user_group_roles')
    .select('group_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1);

  if (rolesError) throw rolesError;
  const groupId = roles?.[0]?.group_id;
  if (!groupId) throw new Error('Nenhum grupo ativo encontrado para este usuário.');
  return groupId as string;
}
