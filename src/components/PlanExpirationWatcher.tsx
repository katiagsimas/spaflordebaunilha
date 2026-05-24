import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Vigia a expiração do plano do usuário logado.
 *
 * - Roda no carregamento do app e a cada mudança de rota.
 * - Se `plano_fim < hoje`: atualiza `profiles.ativo = false` (o trigger
 *   no banco também garante isso) e faz signOut imediato, redirecionando
 *   para o login com mensagem clara.
 *
 * Componente "headless": não renderiza nada.
 */
export function PlanExpirationWatcher() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const checkingRef = useRef(false);

  useEffect(() => {
    if (!user || checkingRef.current) return;
    checkingRef.current = true;

    (async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('ativo, plano_fim')
          .eq('id', user.id)
          .single();

        if (!profile) return;

        const hoje = new Date().toISOString().split('T')[0];
        const expirado = !!profile.plano_fim && profile.plano_fim < hoje;

        if (expirado && profile.ativo !== false) {
          await supabase
            .from('profiles')
            .update({ ativo: false })
            .eq('id', user.id);
        }

        if (expirado || profile.ativo === false) {
          toast.error(
            expirado
              ? 'Seu plano expirou. Acesso bloqueado.'
              : 'Sua conta foi desabilitada.',
            { description: 'Entre em contato com o administrador.' }
          );
          await signOut();
        }
      } catch (err) {
        console.error('[PlanExpirationWatcher] erro:', err);
      } finally {
        checkingRef.current = false;
      }
    })();
  }, [user?.id, location.pathname, signOut]);

  return null;
}
