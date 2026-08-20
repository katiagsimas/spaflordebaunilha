import { useNavigate, useLocation } from "react-router-dom";
import {
  Layers,
  ArrowDownToLine,
  ArrowUpFromLine,
  LineChart,
  FileBarChart,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** rota considerada "ativa" — coincidência exata ou prefixo */
  match: string;
}

const ALL_ITEMS: NavItem[] = [
  { label: "Cadastros", to: "/financeiro/cadastros", icon: Layers, match: "/financeiro/cadastros" },
  { label: "Contas a Receber", to: "/financeiro/contas-receber", icon: ArrowDownToLine, match: "/financeiro/contas-receber" },
  { label: "Contas a Pagar", to: "/financeiro/contas-pagar", icon: ArrowUpFromLine, match: "/financeiro/contas-pagar" },
  { label: "Fluxo de Caixa", to: "/financeiro/fluxo-caixa", icon: LineChart, match: "/financeiro/fluxo-caixa" },
  { label: "DRE", to: "/financeiro/dre", icon: FileBarChart, match: "/financeiro/dre" },
  { label: "Fechamento", to: "/financeiro/fechamento-mes", icon: CalendarCheck, match: "/financeiro/fechamento-mes" },
];

interface FinanceiroNavProps {
  /** rota atual (será excluída dos botões). Se omitido, usa location atual */
  current?: string;
  className?: string;
}

/**
 * Navegação minimalista entre as páginas do módulo Financeiro.
 * Renderiza ícone + label em botões "chip" autoclicáveis,
 * para uso ao lado do botão Voltar no cabeçalho da página.
 */
export function FinanceiroNav({ current, className }: FinanceiroNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const activePath = current ?? location.pathname;

  const items = ALL_ITEMS.filter((item) => !activePath.startsWith(item.match));

  return (
    <nav
      className={cn(
        "flex flex-wrap items-center gap-1.5",
        className
      )}
      aria-label="Navegação Financeiro"
    >
      {items.map(({ label, to, icon: Icon }) => (
        <button
          key={to}
          type="button"
          onClick={() => navigate(to)}
          className={cn(
            "group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
            "text-xs font-medium font-body text-sfb-vinho/80",
            "bg-sfb-creme/60 border border-sfb-dourado/40",
            "transition-all duration-200",
            "hover:bg-sfb-vinho hover:text-sfb-branco hover:border-sfb-vinho hover:shadow-sm",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-sfb-dourado focus-visible:ring-offset-1"
          )}
        >
          <Icon className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
          <span className="whitespace-nowrap">{label}</span>
        </button>
      ))}
    </nav>
  );
}
