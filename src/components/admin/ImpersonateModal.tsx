import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { toast } from 'sonner';
import { AlertCircle, Loader2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  created_at: string;
  raw_user_meta_data?: any;
}

interface Props {
  user: User;
  open: boolean;
  onClose: () => void;
}

export function ImpersonateModal({ user, open, onClose }: Props) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { startImpersonation } = useImpersonation();

  const handleImpersonate = async () => {
    if (reason.length < 10) {
      toast.error('Motivo deve ter pelo menos 10 caracteres');
      return;
    }

    try {
      setLoading(true);
      
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Você precisa estar autenticado');
      }

      const { data, error } = await supabase.rpc('generate_admin_access_token', {
        p_target_user_id: user.id,
        p_admin_id: currentUser.user.id,
        p_reason: reason
      });

      if (error) throw error;

      // Parse response
      const response = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Iniciar impersonation
      startImpersonation(
        response.token,
        user,
        reason,
        new Date(response.expires_at)
      );
      
      toast.success(`Acessando conta de ${user.email}`);
      onClose();
      
      // Redirecionar para dashboard
      window.location.href = '/dashboard';
      
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-destructive" />
            Acessar Conta de Usuária
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dados da usuária */}
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Nome:</strong> {user.raw_user_meta_data?.nome || 'Não informado'}</p>
                <p><strong>Cadastro:</strong> {new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Motivo do Acesso *
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Configurar dashboard inicial, resolver erro de cálculo, investigar bug reportado..."
              rows={3}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Mínimo 10 caracteres ({reason.length}/10)
            </p>
          </div>

          {/* Avisos */}
          <Alert variant="destructive">
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>A usuária será <strong>notificada por email</strong></li>
                <li>Todas as suas ações serão <strong>registradas</strong></li>
                <li>Token expira em <strong>2 horas</strong></li>
                <li>Histórico será <strong>visível para a usuária</strong></li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Botões */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleImpersonate}
              disabled={loading || reason.length < 10}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando Token...
                </>
              ) : (
                'Acessar Conta'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
