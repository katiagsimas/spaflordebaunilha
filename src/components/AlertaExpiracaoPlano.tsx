import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, X } from 'lucide-react';
import { useState } from 'react';
import { useIsAdmin } from '@/hooks/useIsAdmin';

export function AlertaExpiracaoPlano() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [dismissed, setDismissed] = useState(false);

  const { data: diasRestantes } = useQuery({
    queryKey: ['plano-expiracao', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('plano_fim')
        .eq('id', user!.id)
        .single();

      if (!data?.plano_fim) return null;

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const fim = new Date(data.plano_fim + 'T00:00:00');
      const diff = Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      return diff;
    },
    enabled: !!user?.id && !isAdmin,
    staleTime: 1000 * 60 * 30,
    refetchInterval: 1000 * 60 * 60,
  });

  if (dismissed || isAdmin || diasRestantes === null || diasRestantes === undefined || diasRestantes > 7 || diasRestantes < 0) {
    return null;
  }

  const mensagem = diasRestantes === 0
    ? 'Seu acesso expira hoje! Renove agora para continuar usando o sistema.'
    : diasRestantes === 1
      ? 'Seu acesso expira amanhã! Renove para não perder seus dados.'
      : `Seu acesso expira em ${diasRestantes} dias. Renove para continuar usando o sistema.`;

  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <AlertDescription className="text-sm font-medium">
            ⚠️ {mensagem}
          </AlertDescription>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-amber-200/50 rounded transition-colors shrink-0"
          aria-label="Fechar alerta"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </Alert>
  );
}
