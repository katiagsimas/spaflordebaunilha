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

  // Meus Insumos, Meu Planejamento, Meu Salário e Conversa Doce bloqueados para não-admin
  if (
    pathname.startsWith("/estoque") ||
    pathname.startsWith("/planejamento") ||
    pathname.startsWith("/meu-salario") ||
    pathname.startsWith("/conversa-doce")
  ) {
    return <Navigate to="/upgrade" replace />;
  }

  if (!temAcesso(pathname)) {
    return <Navigate to="/upgrade" replace />;
  }

  return <>{children}</>;
}
