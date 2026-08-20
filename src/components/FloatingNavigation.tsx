import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Botões flutuantes globais:
 * - "Voltar": usa histórico do navegador (navigate(-1)) — sempre volta para a página real anterior.
 * - "Voltar ao topo": aparece após rolar a página.
 *
 * Ocultos em rotas de autenticação e no Dashboard (raiz lógica do app).
 */
export function FloatingNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showTop, setShowTop] = useState(false);

  const isAuthRoute = location.pathname.startsWith("/auth/");
  const isDashboard = location.pathname === "/" || location.pathname === "/dashboard";

  useEffect(() => {
    const getScrolled = () => {
      const mainEl = document.querySelector("main");
      const docEl = document.documentElement;
      return (
        window.scrollY > 300 ||
        docEl.scrollTop > 300 ||
        document.body.scrollTop > 300 ||
        (mainEl && mainEl.scrollTop > 300)
      );
    };

    const onScroll = () => setShowTop(Boolean(getScrolled()));

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const mainEl = document.querySelector("main");
    mainEl?.addEventListener("scroll", onScroll, { passive: true } as any);

    return () => {
      window.removeEventListener("scroll", onScroll);
      mainEl?.removeEventListener("scroll", onScroll as any);
    };
  }, [location.pathname]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  const handleTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const mainEl = document.querySelector("main");
    mainEl?.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isAuthRoute) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 print:hidden">
      {!isDashboard && (
        <Button
          onClick={handleBack}
          size="icon"
          aria-label="Voltar"
          title="Voltar"
          className="h-11 w-11 rounded-full bg-sfb-vinho text-sfb-creme shadow-elevated hover:bg-sfb-vinho-escuro hover:text-sfb-creme"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      <Button
        onClick={handleTop}
        size="icon"
        aria-label="Voltar ao topo"
        title="Voltar ao topo"
        className={cn(
          "h-11 w-11 rounded-full bg-sfb-dourado text-sfb-preto shadow-elevated hover:brightness-95 transition-opacity",
          showTop ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
    </div>
  );
}
