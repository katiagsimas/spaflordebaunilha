import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import type { StatusEstoque } from "@/types/estoque";

interface BadgeStatusProps {
  status: StatusEstoque;
  saldo?: number;
}

export function BadgeStatus({ status, saldo }: BadgeStatusProps) {
  const configs = {
    ok: {
      label: "OK",
      variant: "default" as const,
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
      icon: CheckCircle2
    },
    atencao: {
      label: "Atenção",
      variant: "default" as const,
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      icon: AlertTriangle
    },
    baixo: {
      label: "Baixo",
      variant: "default" as const,
      className: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
      icon: AlertCircle
    },
    zerado: {
      label: "Zerado",
      variant: "destructive" as const,
      className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
      icon: XCircle
    },
    sem_rastreio: {
      label: "Sem rastreio",
      variant: "outline" as const,
      className: "text-muted-foreground",
      icon: MinusCircle
    }
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
      {saldo !== undefined && status !== 'sem_rastreio' && (
        <span className="ml-1 font-mono">({saldo})</span>
      )}
    </Badge>
  );
}
