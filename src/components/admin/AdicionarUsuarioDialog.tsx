import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  nomeCompleto: z.string().min(2, 'Nome completo é obrigatório'),
  nomeConfeitaria: z.string().min(2, 'Nome da confeitaria é obrigatório'),
  role: z.string(),
});

type FormData = z.infer<typeof formSchema>;

interface AdicionarUsuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdicionarUsuarioDialog({ open, onOpenChange }: AdicionarUsuarioDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      senha: '',
      nomeCompleto: '',
      nomeConfeitaria: '',
      role: 'user',
    },
  });

  const criarUsuarioMutation = useMutation({
    mutationFn: async (data: FormData) => {
      setIsLoading(true);

      console.log('Invocando edge function criar-usuario...');
      console.log('Dados enviados:', {
        email: data.email,
        nomeCompleto: data.nomeCompleto,
        nomeConfeitaria: data.nomeConfeitaria,
        role: data.role,
      });

      // Chamar Edge Function para criar usuário
      const { data: result, error } = await supabase.functions.invoke('criar-usuario', {
        body: {
          email: data.email,
          senha: data.senha,
          nomeCompleto: data.nomeCompleto,
          nomeConfeitaria: data.nomeConfeitaria,
          role: data.role,
        },
      });

      console.log('Resposta da edge function:', { result, error });

      if (error) {
        console.error('Erro ao invocar função:', error);
        throw error;
      }
      
      if (result && !result.success && result.error) {
        console.error('Erro retornado pela função:', result.error);
        throw new Error(result.error);
      }

      return result;
    },
    onSuccess: (data) => {
      const wasReactivated = data?.reactivated === true;
      
      toast({
        title: wasReactivated ? 'Usuário reativado com sucesso' : 'Usuário criado com sucesso',
        description: wasReactivated 
          ? 'O usuário foi reativado e já pode fazer login no sistema.' 
          : 'O novo usuário já pode fazer login no sistema.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      let message = 'Ocorreu um erro ao criar o usuário.';
      
      // Tentar extrair a mensagem de erro do resultado
      if (error.message) {
        if (error.message.includes('already been registered') || error.message.includes('email_exists')) {
          message = 'Este email já está cadastrado no sistema.';
        } else if (error.message.includes('Invalid email')) {
          message = 'Email inválido.';
        } else if (error.message.includes('Password')) {
          message = 'A senha deve ter pelo menos 6 caracteres.';
        } else {
          message = error.message;
        }
      }
      
      toast({
        title: 'Erro ao criar usuário',
        description: message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const onSubmit = (data: FormData) => {
    criarUsuarioMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Usuário</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar um novo usuário no sistema.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="usuario@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nomeCompleto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="João da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nomeConfeitaria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Confeitaria</FormLabel>
                  <FormControl>
                    <Input placeholder="Doces & Delicias" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permissão</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma permissão" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Usuário
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
