import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff } from 'lucide-react';

const senhaSchema = z.object({
  novaSenha: z.string()
    .length(6, { message: "A senha deve ter exatamente 6 dígitos" })
    .regex(/^\d+$/, { message: "A senha deve conter apenas números" }),
  confirmaSenha: z.string(),
}).refine((data) => data.novaSenha === data.confirmaSenha, {
  message: "As senhas não conferem",
  path: ["confirmaSenha"],
});

interface AlterarSenhaObrigatoriaProps {
  open: boolean;
}

export function AlterarSenhaObrigatoria({ open }: AlterarSenhaObrigatoriaProps) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmaSenha, setMostrarConfirmaSenha] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar com zod
      const validacao = senhaSchema.safeParse({ novaSenha, confirmaSenha });
      
      if (!validacao.success) {
        toast.error(validacao.error.issues[0].message);
        setLoading(false);
        return;
      }

      // Verificar se não está usando senha padrão
      if (novaSenha === '123456') {
        toast.error('Você não pode usar a senha padrão. Escolha uma senha diferente.');
        setLoading(false);
        return;
      }

      // Atualizar senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (updateError) throw updateError;

      // Atualizar perfil para marcar que não é mais primeiro acesso
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ primeiro_acesso: false })
          .eq('id', user.id);

        if (profileError) throw profileError;
      }

      toast.success('Senha alterada com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} modal={true}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Alteração de Senha Obrigatória
          </DialogTitle>
          <DialogDescription>
            Por segurança, você precisa alterar a senha padrão antes de continuar.
            A nova senha deve ter exatamente 6 dígitos numéricos.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="novaSenha">Nova Senha (6 dígitos)</Label>
            <div className="relative">
              <Input
                id="novaSenha"
                type={mostrarNovaSenha ? 'text' : 'password'}
                placeholder="Digite 6 dígitos"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                maxLength={6}
                required
                className="pr-10"
                inputMode="numeric"
                pattern="\d*"
              />
              <button
                type="button"
                onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {mostrarNovaSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmaSenha">Confirmar Nova Senha</Label>
            <div className="relative">
              <Input
                id="confirmaSenha"
                type={mostrarConfirmaSenha ? 'text' : 'password'}
                placeholder="Digite novamente os 6 dígitos"
                value={confirmaSenha}
                onChange={(e) => setConfirmaSenha(e.target.value)}
                maxLength={6}
                required
                className="pr-10"
                inputMode="numeric"
                pattern="\d*"
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmaSenha(!mostrarConfirmaSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {mostrarConfirmaSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Alterando...' : 'Confirmar Nova Senha'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
