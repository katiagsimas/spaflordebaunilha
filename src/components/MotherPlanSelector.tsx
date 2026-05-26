import { Crown, Eye } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMotherView, type MotherViewPlan } from "@/hooks/useMotherView";
import { useQueryClient } from "@tanstack/react-query";

const OPCOES: Array<{ value: "default" | NonNullable<MotherViewPlan>; label: string }> = [
  { value: "default", label: "MOTHER · Acesso total" },
  { value: "base", label: "Visualizar como Caixa Lite" },
  { value: "negocio", label: "Visualizar como Caixa Business" },
  { value: "aluna_imersao", label: "Visualizar como Aluna da Imersão" },
];

/**
 * Seletor de "visualizar como" exclusivo do usuário MOTHER.
 * Permite que o MOTHER experimente o sistema sob a ótica de cada plano.
 */
export function MotherPlanSelector() {
  const { enabled, view, setMotherView } = useMotherView();
  const queryClient = useQueryClient();

  if (!enabled) return null;

  const current: string = view ?? "default";

  const handleChange = (v: string) => {
    setMotherView(v === "default" ? null : (v as MotherViewPlan));
    // Atualiza queries que dependem do plano (sidebar, dashboards, gates)
    queryClient.invalidateQueries({ queryKey: ["plano"] });
  };

  return (
    <div className="hidden md:flex items-center gap-2">
      <Crown className="h-4 w-4 text-cda-dourado" aria-hidden />
      <Select value={current} onValueChange={handleChange}>
        <SelectTrigger
          className="h-8 w-[240px] bg-cda-vinho-escuro/60 border-cda-dourado/40 text-cda-creme text-xs font-body"
          aria-label="Modo de visualização do MOTHER"
        >
          <div className="flex items-center gap-1.5 truncate">
            <Eye className="h-3.5 w-3.5 text-cda-dourado/80" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-cda-creme border-cda-dourado/40">
          {OPCOES.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-xs font-body">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
