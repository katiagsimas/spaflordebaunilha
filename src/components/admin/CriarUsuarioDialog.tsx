import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Crown } from 'lucide-react';

interface CriarUsuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CriarUsuarioDialog({ open, onOpenChange, onSuccess }: CriarUsuarioDialogProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [nomeConfeitaria, setNomeConfeitaria] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return toast({ title: 'Email obrigatório', variant: 'destructive' });

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('criar-usuario', {
        body: {
          email: email.trim().toLowerCase(),
          nomeCompleto: nomeCompleto.trim() || null,
          nomeConfeitaria: nomeConfeitaria.trim() || null,
          tipoUsuario: 'mestre',
        }
      });
      if (error || !data?.success) throw new Error(error?.message || data?.error || 'Erro ao criar usuário');

      toast({ title: '✅ Usuário criado', description: 'Usuário mestre criado com sucesso.' });
      setEmail(''); setNomeCompleto(''); setNomeConfeitaria('');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({ title: 'Erro ao criar usuário', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Crown className="h-5 w-5" /> Criar Usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={nomeCompleto} onChange={e => setNomeCompleto(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Confeitaria</Label>
            <Input value={nomeConfeitaria} onChange={e => setNomeConfeitaria(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Criar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
