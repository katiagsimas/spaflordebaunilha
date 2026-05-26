import { usePlano } from "@/hooks/usePlano";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { URL_UPGRADE_EXTERNO } from "@/lib/constants";

export function PlanoGuard({ children }: { children: React.ReactNode }) {
  const { plano, temAcesso, isLoading: isLoadingPlano } = usePlano();
  const { isAdmin, isLoading: isLoadingAdmin } = useIsAdmin();
  const { pathname } = useLocation();

  const ehImersao = plano?.id === "aluna_imersao";

  // Bloqueada para Imersão → URL externa (não usa a página /upgrade interna)
  const rotaBloqueadaImersao =
    ehImersao &&
    (pathname.startsWith("/estoque") ||
      pathname.startsWith("/planejamento") ||
      pathname.startsWith("/meu-salario") ||
      !temAcesso(pathname));

  useEffect(() => {
    if (rotaBloqueadaImersao && pathname !== "/configuracoes") {
      window.location.href = URL_UPGRADE_EXTERNO;
    }
  }, [rotaBloqueadaImersao, pathname]);

  if (isLoadingPlano || isLoadingAdmin) return null;
  if (isAdmin) return <>{children}</>;
  if (pathname === "/configuracoes") return <>{children}</>;

  // Imersão: redireciona via useEffect; renderiza null enquanto isso
  if (ehImersao) {
    if (
      pathname.startsWith("/estoque") ||
      pathname.startsWith("/planejamento") ||
      pathname.startsWith("/meu-salario")
    ) {
      // Imersão TEM acesso a esses módulos (mesmo do Business). Não bloqueia.
      // Mantém o fall-through normal.
    } else if (!temAcesso(pathname)) {
      return null;
    }
  }

  // Demais planos: comportamento original
  if (
    pathname.startsWith("/estoque") ||
    pathname.startsWith("/planejamento") ||
    pathname.startsWith("/meu-salario")
  ) {
    if (!ehImersao) return <Navigate to="/upgrade" replace />;
  }

  if (!temAcesso(pathname)) {
    return <Navigate to="/upgrade" replace />;
  }

  return <>{children}</>;
}
