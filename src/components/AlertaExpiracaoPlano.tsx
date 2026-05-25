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

  const { data: planoInfo } = useQuery({
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
      return { diasRestantes: diff };
    },
    enabled: !!user?.id && !isAdmin,
    staleTime: 1000 * 60 * 30,
    refetchInterval: 1000 * 60 * 60,
  });

  const diasRestantes = planoInfo?.diasRestantes;

  if (dismissed || isAdmin || diasRestantes === null || diasRestantes === undefined || diasRestantes > 7 || diasRestantes < 0) {
    return null;
  }

  const mensagem = diasRestantes === 0
    ? 'Seu acesso expira hoje! Renove agora para continuar usando o sistema.'
    : diasRestantes === 1
      ? 'Seu acesso expira amanhã! Renove para não perder seus dados.'
      : `Seu acesso expira em ${diasRestantes} dias. Renove para continuar usando o sistema.`;

  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-cda-dourado border-cda-dourado text-cda-preto">
      <div className="flex items-center justify-between w-full gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <AlertCircle className="h-4 w-4 text-cda-preto shrink-0" />
          <AlertDescription className="text-sm font-medium text-cda-preto">
            ⚠️ {mensagem}
          </AlertDescription>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-cda-preto/10 rounded transition-colors shrink-0"
            aria-label="Fechar alerta"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Alert>
  );
}
