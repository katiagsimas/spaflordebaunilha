import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerField } from '@/components/DatePickerField';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Crown } from 'lucide-react';
import { formatDateToISO, parseISOToDate, addDaysToDate, getTodayISO } from '@/lib/dateUtils';


interface CriarUsuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Cria SEMPRE um usuário **mestre** (admin) — um novo grupo é gerado
 * automaticamente com o nome da confeitaria. Usuários comuns vinculados
 * a um grupo existente devem ser criados a partir do próprio grupo
 * (Governança → grupo → "Adicionar membro").
 */
export function CriarUsuarioDialog({ open, onOpenChange, onSuccess }: CriarUsuarioDialogProps) {
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [nomeConfeitaria, setNomeConfeitaria] = useState('');
  const [planoId, setPlanoId] = useState('base');
  const [planoTipo, setPlanoTipo] = useState('anual');
  const [planoInicio, setPlanoInicio] = useState<Date | undefined>(new Date());
  const [planoFim, setPlanoFim] = useState<Date | undefined>(undefined);
  const [imersaoTurma, setImersaoTurma] = useState('');

  const isImersao = planoId === 'aluna_imersao';

  useEffect(() => {
    if (planoId === 'base') setPlanoTipo('anual');
    if (planoId === 'aluna_imersao') setPlanoTipo('imersao');
    if (planoId === 'negocio' && (planoTipo !== 'mensal' && planoTipo !== 'anual')) {
      setPlanoTipo('anual');
    }
  }, [planoId]);

  useEffect(() => {
    if (!planoInicio) return;
    const inicioISO = formatDateToISO(planoInicio);
    const diasMap: Record<string, number> = { anual: 365, mensal: 30, imersao: IMERSAO_DIAS_ACESSO };
    const dias = diasMap[planoTipo] ?? 365;
    setPlanoFim(parseISOToDate(addDaysToDate(inicioISO, dias)));
  }, [planoInicio, planoTipo]);

  const resetForm = () => {
    setEmail('');
    setNomeCompleto('');
    setNomeConfeitaria('');
    setPlanoId('base');
    setPlanoTipo('anual');
    setPlanoInicio(new Date());
    setPlanoFim(undefined);
    setImersaoTurma('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: 'Email obrigatório', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const body: any = {
        email: email.trim().toLowerCase(),
        nomeCompleto: nomeCompleto.trim() || null,
        nomeConfeitaria: nomeConfeitaria.trim() || null,
        tipoUsuario: 'mestre',
        planoId,
        planoTipo,
        planoInicio: planoInicio ? formatDateToISO(planoInicio) : getTodayISO(),
        planoFim: planoFim ? formatDateToISO(planoFim) : null,
        imersaoTurma: isImersao ? (imersaoTurma.trim() || null) : null,
      };

      const { data, error } = await supabase.functions.invoke('criar-usuario', { body });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao criar usuário');

      toast({
        title: data.updated ? '✅ Usuário atualizado' : data.reactivated ? '✅ Usuário reativado' : '✅ Usuário criado',
        description: isImersao
          ? `Aluna da Imersão criada com ${IMERSAO_DIAS_ACESSO} dias de acesso completo. Grupo criado automaticamente.`
          : 'Usuário mestre criado. Novo grupo gerado com o nome da confeitaria. Email de boas-vindas enviado.',
      });

      resetForm();
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
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-cda-dourado" />
            Criar Novo Usuário (Mestre)
          </DialogTitle>
          <DialogDescription>
            Todo novo usuário nasce como <strong>mestre</strong> e tem um grupo criado automaticamente com o nome da confeitaria.
            Para criar usuários comuns vinculados a um grupo, acesse <strong>Governança → grupo → "Adicionar membro"</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" placeholder="confeiteira@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input id="nome" placeholder="Maria da Silva" value={nomeCompleto} onChange={e => setNomeCompleto(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confeitaria">Nome da Confeitaria (será o nome do grupo)</Label>
            <Input id="confeitaria" placeholder="Doces da Maria" value={nomeConfeitaria} onChange={e => setNomeConfeitaria(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Plano</Label>
              <Select value={planoId} onValueChange={setPlanoId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="base">Caixa Lite</SelectItem>
                  <SelectItem value="negocio">Caixa Business</SelectItem>
                  <SelectItem value="aluna_imersao">Aluna da Imersão (30 dias)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Periodicidade</Label>
              <Select value={planoTipo} onValueChange={setPlanoTipo} disabled={planoId === 'base' || isImersao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {planoId === 'negocio' && <SelectItem value="mensal">Mensal (30 dias)</SelectItem>}
                  {(planoId === 'base' || planoId === 'negocio') && <SelectItem value="anual">Anual (365 dias)</SelectItem>}
                  {isImersao && <SelectItem value="imersao">Imersão ({IMERSAO_DIAS_ACESSO} dias)</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isImersao && (
            <div className="rounded-md border border-cda-dourado/40 bg-cda-dourado/10 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-cda-preto">
                <Sparkles className="h-4 w-4 text-cda-dourado" />
                Aluna da Imersão A Receita que Faltava
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="imersao-turma" className="text-xs">Turma (opcional)</Label>
                <Input id="imersao-turma" placeholder="Ex.: Turma 01 — Out/2026" value={imersaoTurma} onChange={e => setImersaoTurma(e.target.value)} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <DatePickerField value={planoInicio} onChange={setPlanoInicio} placeholder="Data início..." />
            </div>
            <div className="space-y-2">
              <Label>Data Expiração</Label>
              <DatePickerField value={planoFim} onChange={setPlanoFim} placeholder="Data expiração..." />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Mestre
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
