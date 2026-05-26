import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { URL_UPGRADE_EXTERNO } from '@/lib/constants';

const SESSION_KEY = 'cda-modal-imersao-shown';

/**
 * Modal de aviso forte para alunas da Imersão em D-1 e D-0.
 * Aparece uma vez por sessão para não atrapalhar o uso.
 */
export function ModalExpiracaoImersao() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['imersao-modal-check', user?.id],
    queryFn: async () => {
      const { data: p } = await supabase
        .from('profiles')
        .select('plano_id, plano_fim')
        .eq('id', user!.id)
        .maybeSingle();
      if (!p || p.plano_id !== 'aluna_imersao' || !p.plano_fim) return null;
      const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
      const fim = new Date(p.plano_fim + 'T00:00:00');
      const dias = Math.ceil((fim.getTime() - hoje.getTime()) / 86400000);
      return { dias };
    },
    enabled: !!user?.id && !isAdmin,
    staleTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    if (!data) return;
    if (data.dias > 1 || data.dias < 0) return;
    if (sessionStorage.getItem(SESSION_KEY) === '1') return;
    setOpen(true);
    sessionStorage.setItem(SESSION_KEY, '1');
  }, [data]);

  if (!data) return null;

  const titulo = data.dias === 0
    ? 'Seu acesso à Imersão termina hoje'
    : 'Seu acesso à Imersão termina amanhã';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-cda-creme border-cda-dourado">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-cda-dourado/20 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-cda-vinho" />
            </div>
            <DialogTitle className="text-cda-vinho">{titulo}</DialogTitle>
          </div>
          <DialogDescription className="text-cda-preto/80 text-base">
            Para continuar usando o <strong>Caixa de Açúcar</strong> sem perder seus cadastros e histórico,
            renove agora seu acesso anual.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Agora não
          </Button>
          <Button
            className="bg-cda-coral hover:bg-cda-coral/90 text-cda-branco"
            onClick={() => window.open(URL_UPGRADE_EXTERNO, '_blank', 'noopener')}
          >
            Renovar acesso
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
