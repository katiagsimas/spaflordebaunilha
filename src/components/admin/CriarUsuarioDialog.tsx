import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerField } from '@/components/DatePickerField';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { formatDateToISO, parseISOToDate, addDaysToDate, getTodayISO } from '@/lib/dateUtils';

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
  const [planoId, setPlanoId] = useState('base');
  const [planoTipo, setPlanoTipo] = useState('mensal');
  const [planoInicio, setPlanoInicio] = useState<Date | undefined>(new Date());
  const [planoFim, setPlanoFim] = useState<Date | undefined>(undefined);

  // Auto-calculate planoFim when planoInicio or planoTipo changes
  useEffect(() => {
    if (planoInicio) {
      const inicioISO = formatDateToISO(planoInicio);
      const dias = planoTipo === 'anual' ? 365 : 30;
      const fimISO = addDaysToDate(inicioISO, dias);
      setPlanoFim(parseISOToDate(fimISO));
    }
  }, [planoInicio, planoTipo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: 'Email obrigatório', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('criar-usuario', {
        body: {
          email: email.trim().toLowerCase(),
          nomeCompleto: nomeCompleto.trim() || null,
          nomeConfeitaria: nomeConfeitaria.trim() || null,
          planoId,
          planoTipo,
          planoInicio: planoInicio ? formatDateToISO(planoInicio) : getTodayISO(),
          planoFim: planoFim ? formatDateToISO(planoFim) : null,
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao criar usuário');

      toast({
        title: data.updated ? '✅ Plano atualizado' : data.reactivated ? '✅ Usuário reativado' : '✅ Usuário criado',
        description: data.updated
          ? 'O plano do usuário foi atualizado com sucesso.'
          : 'O usuário foi criado e um email de boas-vindas foi enviado.',
      });

      setEmail('');
      setNomeCompleto('');
      setNomeConfeitaria('');
      setPlanoId('base');
      setPlanoTipo('mensal');
      setPlanoInicio(new Date());
      setPlanoFim(undefined);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({
        title: 'Erro ao criar usuário',
        description: err.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
          <DialogDescription>
            O usuário será criado e receberá um email de boas-vindas com link de acesso.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="confeiteira@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              placeholder="Maria da Silva"
              value={nomeCompleto}
              onChange={e => setNomeCompleto(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confeitaria">Nome da Confeitaria</Label>
            <Input
              id="confeitaria"
              placeholder="Doces da Maria"
              value={nomeConfeitaria}
              onChange={e => setNomeConfeitaria(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Plano</Label>
              <Select value={planoId} onValueChange={setPlanoId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="base">Plano Base</SelectItem>
                  <SelectItem value="negocio">Plano Negócio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Periodicidade</Label>
              <Select value={planoTipo} onValueChange={setPlanoTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal (30 dias)</SelectItem>
                  <SelectItem value="anual">Anual (365 dias)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <DatePickerField
                value={planoInicio}
                onChange={setPlanoInicio}
                placeholder="Data início..."
              />
            </div>
            <div className="space-y-2">
              <Label>Data Expiração</Label>
              <DatePickerField
                value={planoFim}
                onChange={setPlanoFim}
                placeholder="Data expiração..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Usuário
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
