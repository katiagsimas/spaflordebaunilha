import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email('Email inválido'),
  nomeCompleto: z.string().min(2, 'Nome completo é obrigatório'),
  nomeConfeitaria: z.string().min(2, 'Nome da confeitaria é obrigatório'),
  role: z.string(),
  ativo: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface EditarUsuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userData: any;
  userRole: string;
}

export function EditarUsuarioDialog({ open, onOpenChange, userId, userData, userRole }: EditarUsuarioDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', nomeCompleto: '', nomeConfeitaria: '', role: 'user', ativo: true },
  });

  useEffect(() => {
    if (userData && open) {
      form.reset({
        email: userData.email,
        nomeCompleto: userData.nome_completo || '',
        nomeConfeitaria: userData.nome_confeitaria || '',
        role: userRole,
        ativo: userData.ativo ?? true,
      });
    }
  }, [userData, userRole, open, form]);

  const atualizarUsuarioMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!userId) throw new Error('ID do usuário não fornecido');
      setIsLoading(true);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome_completo: data.nomeCompleto,
          nome_confeitaria: data.nomeConfeitaria,
          ativo: data.ativo,
        } as any)
        .eq('id', userId);

      if (profileError) throw profileError;
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Usuário atualizado.' });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
    onSettled: () => setIsLoading(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar Usuário</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => atualizarUsuarioMutation.mutate(d))} className="space-y-4">
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} disabled /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="nomeCompleto" render={({ field }) => (
              <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="nomeConfeitaria" render={({ field }) => (
              <FormItem><FormLabel>Confeitaria</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="ativo" render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl><input type="checkbox" checked={field.value} onChange={field.onChange} /></FormControl>
                <FormLabel>Ativo</FormLabel>
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
