import { useGroup } from '@/contexts/GroupContext';
import { useCallback } from 'react';

/**
 * Hook para filtrar queries pelo grupo ativo
 * Retorna funções auxiliares para adicionar filtro de grupo nas queries
 */
export function useGroupFilter() {
  const { activeGroupId, sessionMode } = useGroup();

  /**
   * Retorna o ID do grupo ativo para filtrar queries
   * Retorna null se estiver em modo sistema (sem acesso a dados operacionais)
   */
  const getGroupId = useCallback(() => {
    if (sessionMode === 'system') {
      return null;
    }
    return activeGroupId;
  }, [activeGroupId, sessionMode]);

  /**
   * Verifica se pode acessar dados operacionais
   * Retorna false se estiver em modo sistema
   */
  const canAccessData = useCallback(() => {
    return sessionMode === 'group' && !!activeGroupId;
  }, [sessionMode, activeGroupId]);

  /**
   * Adiciona filtro de grupo a uma query do Supabase
   * @param query - Query do Supabase
   * @param column - Nome da coluna do grupo (padrão: owner_group_id)
   */
  const addGroupFilter = useCallback(<T>(
    query: T,
    column: string = 'owner_group_id'
  ): T => {
    if (!activeGroupId || sessionMode === 'system') {
      // Em modo sistema, não deve acessar dados operacionais
      // Retorna query com filtro impossível para não retornar dados
      return (query as any).eq(column, '00000000-0000-0000-0000-000000000000');
    }
    return (query as any).eq(column, activeGroupId);
  }, [activeGroupId, sessionMode]);

  /**
   * Retorna objeto com owner_group_id para inserção
   */
  const getGroupInsertData = useCallback(() => {
    if (!activeGroupId || sessionMode === 'system') {
      throw new Error('Não é possível inserir dados em modo sistema ou sem grupo ativo');
    }
    return { owner_group_id: activeGroupId };
  }, [activeGroupId, sessionMode]);

  return {
    activeGroupId,
    sessionMode,
    getGroupId,
    canAccessData,
    addGroupFilter,
    getGroupInsertData,
  };
}
