import { Navigate } from "react-router-dom";
import { useConversaDoceAccess } from "@/hooks/useConversaDoceAccess";

/**
 * Protege rotas do módulo Conversa Doce.
 * Libera para admin-mãe ou usuárias com acesso manualmente habilitado e dentro
 * do período de validade. Caso contrário redireciona para /upgrade.
 */
export function ConversaDoceGuard({ children }: { children: React.ReactNode }) {
  const { temAcesso, isLoading } = useConversaDoceAccess();
  if (isLoading) return null;
  if (!temAcesso) return <Navigate to="/upgrade" replace />;
  return <>{children}</>;
}
