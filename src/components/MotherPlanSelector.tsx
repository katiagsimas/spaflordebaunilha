import { Crown, Eye } from "lucide-react";
import { toast } from "sonner";
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
    const newView = v === "default" ? null : (v as MotherViewPlan);
    setMotherView(newView);
    // Atualiza queries que dependem do plano (sidebar, dashboards, gates)
    queryClient.invalidateQueries({ queryKey: ["plano"] });

    const label = OPCOES.find((o) => o.value === v)?.label ?? "Modo alterado";
    toast.success(label, {
      description: "Visualização atualizada. O sistema recarregará as permissões conforme o plano selecionado.",
      duration: 4000,
    });
  };

  return (
    <div className="hidden md:flex items-center gap-2">
      <Crown className="h-4 w-4 text-sfb-dourado" aria-hidden />
      <Select value={current} onValueChange={handleChange}>
        <SelectTrigger
          className="h-8 w-[240px] bg-sfb-vinho-escuro/60 border-sfb-dourado/40 text-sfb-creme text-xs font-body"
          aria-label="Modo de visualização do MOTHER"
        >
          <div className="flex items-center gap-1.5 truncate">
            <Eye className="h-3.5 w-3.5 text-sfb-dourado/80" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-sfb-creme border-sfb-dourado/40">
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
