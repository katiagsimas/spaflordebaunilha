import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export type RoleGroup = 'ADMIN' | 'USER';
export type SessionMode = 'system' | 'group';

export interface Group {
  id: string;
  name: string;
  created_by_user_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserGroupRole {
  id: string;
  user_id: string;
  group_id: string;
  role_group: RoleGroup;
  permission_flags: PermissionFlags;
  is_active: boolean;
  group?: Group;
}

export interface PermissionFlags {
  financeiro_view: boolean;
  financeiro_edit: boolean;
  metas_view: boolean;
  metas_edit: boolean;
  tarefas_view: boolean;
  tarefas_edit: boolean;
  cadastros_view: boolean;
  cadastros_edit: boolean;
  receitas_view: boolean;
  receitas_edit: boolean;
  encomendas_view: boolean;
  encomendas_edit: boolean;
  precificacao_view: boolean;
  precificacao_edit: boolean;
  admin_users_manage: boolean;
}

interface GroupContextType {
  // Estado
  groups: Group[];
  userGroupRoles: UserGroupRole[];
  activeGroupId: string | null;
  activeGroup: Group | null;
  activeRole: RoleGroup | null;
  sessionMode: SessionMode;
  isMother: boolean;
  isLoading: boolean;
  
  // Ações
  setActiveGroup: (groupId: string) => Promise<void>;
  setSessionMode: (mode: SessionMode) => Promise<void>;
  refreshGroups: () => Promise<void>;
  
  // Helpers de permissão
  hasPermission: (permission: keyof PermissionFlags) => boolean;
  isGroupAdmin: () => boolean;
  canManageUsers: () => boolean;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [userGroupRoles, setUserGroupRoles] = useState<UserGroupRole[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [sessionMode, setSessionModeState] = useState<SessionMode>('group');
  const [isMother, setIsMother] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Grupo ativo
  const activeGroup = groups.find(g => g.id === activeGroupId) || null;
  const activeUserRole = userGroupRoles.find(r => r.group_id === activeGroupId);
  const activeRole = activeUserRole?.role_group || null;

  // Carregar dados do usuário
  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      resetState();
    }
  }, [user]);

  const resetState = () => {
    setGroups([]);
    setUserGroupRoles([]);
    setActiveGroupId(null);
    setSessionModeState('group');
    setIsMother(false);
    setIsLoading(false);
  };

  const loadUserData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Verificar se é MOTHER
      const { data: globalRole } = await supabase
        .from('user_global_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      
      setIsMother(!!globalRole);

      // Buscar papéis do usuário em grupos
      const { data: roles, error: rolesError } = await supabase
        .from('user_group_roles')
        .select(`
          *,
          group:groups(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (rolesError) throw rolesError;

      const typedRoles = (roles || []).map(r => ({
        ...r,
        role_group: r.role_group as RoleGroup,
        permission_flags: r.permission_flags as unknown as PermissionFlags,
        group: r.group as Group
      }));

      setUserGroupRoles(typedRoles);
      
      // Extrair grupos únicos
      const uniqueGroups = typedRoles
        .filter(r => r.group)
        .map(r => r.group as Group);
      setGroups(uniqueGroups);

      // Buscar sessão ativa
      const { data: session } = await supabase
        .from('user_active_session')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (session) {
        setActiveGroupId(session.active_group_id);
        setSessionModeState((session.mode as SessionMode) || 'group');
      } else if (uniqueGroups.length > 0) {
        // Criar sessão se não existir
        const firstGroupId = uniqueGroups[0].id;
        await supabase
          .from('user_active_session')
          .insert({
            user_id: user.id,
            active_group_id: firstGroupId,
            mode: 'group'
          });
        setActiveGroupId(firstGroupId);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do grupo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setActiveGroup = async (groupId: string) => {
    if (!user) return;
    
    try {
      await supabase
        .from('user_active_session')
        .upsert({
          user_id: user.id,
          active_group_id: groupId,
          mode: 'group',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      setActiveGroupId(groupId);
      setSessionModeState('group');
    } catch (error) {
      console.error('Erro ao trocar grupo:', error);
    }
  };

  const setSessionMode = async (mode: SessionMode) => {
    if (!user || !isMother) return;
    
    try {
      await supabase
        .from('user_active_session')
        .upsert({
          user_id: user.id,
          active_group_id: mode === 'system' ? null : activeGroupId,
          mode,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      setSessionModeState(mode);
      if (mode === 'system') {
        setActiveGroupId(null);
      }
    } catch (error) {
      console.error('Erro ao trocar modo:', error);
    }
  };

  const refreshGroups = async () => {
    await loadUserData();
  };

  // Helpers de permissão
  const hasPermission = (permission: keyof PermissionFlags): boolean => {
    if (!activeUserRole) return false;
    if (activeRole === 'ADMIN') return true;
    return activeUserRole.permission_flags?.[permission] ?? false;
  };

  const isGroupAdmin = (): boolean => {
    return activeRole === 'ADMIN';
  };

  const canManageUsers = (): boolean => {
    return isGroupAdmin() || hasPermission('admin_users_manage');
  };

  return (
    <GroupContext.Provider
      value={{
        groups,
        userGroupRoles,
        activeGroupId,
        activeGroup,
        activeRole,
        sessionMode,
        isMother,
        isLoading,
        setActiveGroup,
        setSessionMode,
        refreshGroups,
        hasPermission,
        isGroupAdmin,
        canManageUsers,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
}
