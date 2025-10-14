import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para obter o ID do usuário autenticado
 * Lança erro se o usuário não estiver autenticado
 */
export function useUserId() {
  const { user } = useAuth();
  
  if (!user) {
    throw new Error('Usuário não autenticado. Por favor, faça login.');
  }
  
  return user.id;
}
