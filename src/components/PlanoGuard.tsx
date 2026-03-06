import { usePlano } from "@/hooks/usePlano";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useLocation, Navigate } from "react-router-dom";

export function PlanoGuard({ children }: { children: React.ReactNode }) {
  const { temAcesso, isLoading: isLoadingPlano } = usePlano();
  const { isAdmin, isLoading: isLoadingAdmin } = useIsAdmin();
  const { pathname } = useLocation();

  // Aguardar carregamento
  if (isLoadingPlano || isLoadingAdmin) return null;

  // Admin tem acesso total independente do plano
  if (isAdmin) return <>{children}</>;

  // Configurações raiz é sempre acessível
  if (pathname === "/configuracoes") return <>{children}</>;

  if (!temAcesso(pathname)) {
    return <Navigate to="/upgrade" replace />;
  }

  return <>{children}</>;
}
