import { Navigate } from "react-router-dom";
import { useGroup } from "@/contexts/GroupContext";

/**
 * Bloqueia rotas que devem ser acessíveis apenas para o usuário MÃE (admin global).
 * Redireciona para /upgrade caso o usuário não seja MOTHER.
 */
export function MotherGuard({ children }: { children: React.ReactNode }) {
  const { isMother } = useGroup();
  if (!isMother) return <Navigate to="/upgrade" replace />;
  return <>{children}</>;
}
