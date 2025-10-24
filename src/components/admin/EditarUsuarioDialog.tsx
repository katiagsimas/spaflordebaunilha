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
import { Loader2, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ConfirmDialog } from '@/components/ConfirmDialog';

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
  userData: {
    email: string;
    nome_completo: string | null;
    nome_confeitaria: string | null;
    ativo?: boolean;
  } | null;
  userRole: string;
}

export function EditarUsuarioDialog({
  open,
  onOpenChange,
  userId,
  userData,
  userRole,
}: EditarUsuarioDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDataConfirm, setShowDeleteDataConfirm] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      nomeCompleto: '',
      nomeConfeitaria: '',
      role: 'user',
      ativo: true,
    },
  });

  useEffect(() => {
    if (userData && open) {
      form.reset({
        email: userData.email,
        nomeCompleto: userData.nome_completo || '',
        nomeConfeitaria: userData.nome_confeitaria || '',
        role: userRole as any,
        ativo: userData.ativo ?? true,
      });
    }
  }, [userData, userRole, open, form]);

  const atualizarUsuarioMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!userId) throw new Error('ID do usuário não fornecido');
      setIsLoading(true);

      // Atualizar email se mudou
      if (data.email !== userData?.email) {
        const { error: emailError } = await supabase.auth.admin.updateUserById(userId, {
          email: data.email,
        });
        if (emailError) throw emailError;
      }

      // Atualizar profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome_completo: data.nomeCompleto,
          nome_confeitaria: data.nomeConfeitaria,
          ativo: data.ativo,
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Atualizar role se mudou
      if (data.role !== userRole) {
        // Deletar role antiga
        await supabase.from('user_roles').delete().eq('user_id', userId);

        // Inserir nova role
        const { error: roleError } = await supabase.from('user_roles').insert([{
          user_id: userId,
          role: data.role as any,
        }]);

        if (roleError) throw roleError;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Usuário atualizado com sucesso',
        description: 'As alterações foram salvas.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar usuário',
        description: error.message || 'Ocorreu um erro ao atualizar o usuário.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const deletarDadosUsuarioMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('ID do usuário não fornecido');

      // Deletar dados das tabelas principais (mantendo configurações)
      // Nota: Alguns deletes podem falhar se não houver dados, mas isso é esperado
      try {
        await supabase.from('encomenda_itens').delete().eq('usuario_id', userId);
        await supabase.from('encomendas').delete().eq('usuario_id', userId);
        await supabase.from('contas_receber').delete().eq('usuario_id', userId);
        await supabase.from('contas_pagar').delete().eq('usuario_id', userId);
        await supabase.from('movimentacoes_estoque').delete().eq('usuario_id', userId);
        await supabase.from('receitas').delete().eq('usuario_id', userId);
        await supabase.from('sub_receitas').delete().eq('usuario_id', userId);
        await supabase.from('ingredientes').delete().eq('usuario_id', userId);
        await supabase.from('embalagens').delete().eq('usuario_id', userId);
        await supabase.from('clientes').delete().eq('usuario_id', userId);
        await supabase.from('fornecedores').delete().eq('usuario_id', userId);
      } catch (error) {
        console.error('Erro ao deletar alguns dados:', error);
      }
    },
    onSuccess: () => {
      toast({
        title: 'Dados deletados com sucesso',
        description: 'Todos os cadastros do usuário foram removidos.',
      });
      setShowDeleteDataConfirm(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao deletar dados',
        description: error.message || 'Ocorreu um erro ao deletar os dados do usuário.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormData) => {
    atualizarUsuarioMutation.mutate(data);
  };

  const handleDeleteUserData = () => {
    deletarDadosUsuarioMutation.mutate();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere os dados do usuário conforme necessário.
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
                    <Select onValueChange={field.onChange} value={field.value}>
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

              <FormField
                control={form.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0 cursor-pointer">Usuário Ativo</FormLabel>
                  </FormItem>
                )}
              />

              <Separator className="my-4" />

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Zona de Perigo</h4>
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>Deletar Cadastros do Usuário:</strong> Esta ação irá remover todos os
                    dados cadastrados pelo usuário (clientes, receitas, encomendas, etc.), mas
                    manterá as configurações do sistema.
                  </AlertDescription>
                </Alert>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDataConfirm(true)}
                  className="w-full"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deletar Cadastros do Usuário
                </Button>
              </div>

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
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDeleteDataConfirm}
        onOpenChange={setShowDeleteDataConfirm}
        onConfirm={handleDeleteUserData}
        title="Deletar Cadastros do Usuário"
        description="Tem certeza que deseja deletar todos os cadastros deste usuário? Esta ação não pode ser desfeita. As configurações do sistema serão mantidas."
        confirmLabel="Deletar Cadastros"
        cancelLabel="Cancelar"
      />
    </>
  );
}
