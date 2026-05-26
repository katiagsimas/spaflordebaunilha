import { usePlano } from "@/hooks/usePlano";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useLocation, Navigate } from "react-router-dom";

export function PlanoGuard({ children }: { children: React.ReactNode }) {
  const { temAcesso, isLoading: isLoadingPlano } = usePlano();
  const { isAdmin, isLoading: isLoadingAdmin } = useIsAdmin();
  const { pathname } = useLocation();

  if (isLoadingPlano || isLoadingAdmin) return null;
  if (isAdmin) return <>{children}</>;
  if (pathname === "/configuracoes") return <>{children}</>;

  // Estoque agora liberado no Lite. Planejamento e Meu Salário continuam restritos.
  if (
    !temAcesso(pathname) ||
    (pathname.startsWith("/planejamento") && !temAcesso("/planejamento")) ||
    (pathname.startsWith("/meu-salario") && !temAcesso("/meu-salario"))
  ) {
    return <Navigate to="/upgrade" replace />;
  }

  return <>{children}</>;
}
