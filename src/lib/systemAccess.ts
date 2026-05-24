/**
 * Controle de acesso a telas internas do sistema (uso exclusivo do próprio sistema).
 *
 * Estas telas NÃO devem ser acessíveis diretamente via URL, mesmo por usuários
 * com role MOTHER ou ADMIN. O acesso só é liberado quando o próprio sistema
 * concede um token de acesso (one-shot) antes de navegar para a rota.
 *
 * Uso:
 *   import { grantSystemAccess, consumeSystemAccess } from '@/lib/systemAccess';
 *
 *   // No fluxo interno do sistema, antes de navegar:
 *   grantSystemAccess('tipos-insumos');
 *   navigate('/configuracoes/tipos-insumos');
 *
 *   // Dentro da página protegida (no mount):
 *   if (!consumeSystemAccess('tipos-insumos')) navigate('/');
 */

const STORAGE_KEY = '__cda_system_access__';

export type SystemRoute = 'tipos-insumos';

export function grantSystemAccess(route: SystemRoute) {
  try {
    sessionStorage.setItem(STORAGE_KEY, route);
  } catch {
    // sessionStorage indisponível — ignora silenciosamente
  }
}

/**
 * Consome o token de acesso (one-shot). Retorna true se válido,
 * false caso contrário. O token é removido após a leitura.
 */
export function consumeSystemAccess(route: SystemRoute): boolean {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    if (value === route) {
      sessionStorage.removeItem(STORAGE_KEY);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
