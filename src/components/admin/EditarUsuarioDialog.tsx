import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  Trash2, 
  Users, 
  ShoppingBag, 
  FileText, 
  Building2, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

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
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [emailConfirmacao, setEmailConfirmacao] = useState("");
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

  // Buscar estatísticas do usuário
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['user-statistics', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Erro ao carregar estatísticas:', error);
        return {
          total_clientes: 0,
          total_encomendas: 0,
          total_receitas: 0,
          total_fornecedores: 0,
          total_contas_receber: 0,
          total_contas_pagar: 0,
          valor_total_encomendas: 0
        };
      }
      
      return data;
    },
    enabled: !!userId && open,
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

      const { data: { user } } = await supabase.auth.getUser();
      const roleAnterior = userRole;

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
        await supabase.from('user_roles').delete().eq('user_id', userId);

        const { error: roleError } = await supabase.from('user_roles').insert([{
          user_id: userId,
          role: data.role as any,
        }]);

        if (roleError) throw roleError;

        // Registrar log de alteração de permissão
        if (user && userData) {
          await supabase.from('admin_logs').insert({
            admin_id: user.id,
            admin_email: user.email,
            acao: 'alterou_permissao',
            usuario_afetado_id: userId,
            usuario_afetado_email: userData.email,
            detalhes: {
              permissao_anterior: roleAnterior,
              permissao_nova: data.role
            }
          });
        }
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

      // Validação: digitar email
      if (emailConfirmacao !== userData?.email) {
        throw new Error('Email de confirmação incorreto!');
      }

      const { data: { user } } = await supabase.auth.getUser();

      // Chamar função do banco de dados para deletar cadastros do usuário
      const { error } = await supabase.rpc('deletar_cadastros_usuario', {
        p_user_id: userId
      });

      if (error) throw error;

      // Registrar log
      if (user && userData) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          admin_email: user.email,
          acao: 'deletou_cadastros',
          usuario_afetado_id: userId,
          usuario_afetado_email: userData.email,
          detalhes: {
            registros_deletados: stats,
            data_acao: new Date().toISOString()
          }
        });
      }
    },
    onSuccess: () => {
      toast({
        title: 'Dados deletados com sucesso',
        description: 'Todos os cadastros do usuário foram removidos.',
      });
      setMostrarPreview(false);
      setEmailConfirmacao("");
      refetchStats();
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

  const handleAbrirPreview = async () => {
    await refetchStats();
    setMostrarPreview(true);
  };

  const handleDeletarCadastros = () => {
    deletarDadosUsuarioMutation.mutate();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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

              <Separator className="my-6" />

              {/* Estatísticas do Usuário */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Estatísticas do Usuário
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-2xl font-bold">{stats?.total_clientes || 0}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Clientes</span>
                    </div>

                    <div className="flex flex-col gap-1 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-2xl font-bold">{stats?.total_encomendas || 0}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Encomendas</span>
                    </div>

                    <div className="flex flex-col gap-1 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-2xl font-bold">{stats?.total_receitas || 0}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Receitas</span>
                    </div>

                    <div className="flex flex-col gap-1 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-2xl font-bold">{stats?.total_fornecedores || 0}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Fornecedores</span>
                    </div>

                    <div className="flex flex-col gap-1 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-2xl font-bold">{stats?.total_contas_receber || 0}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Contas a Receber</span>
                    </div>

                    <div className="flex flex-col gap-1 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        <span className="text-2xl font-bold">{stats?.total_contas_pagar || 0}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Contas a Pagar</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Valor Total em Encomendas</span>
                      </div>
                      <span className="text-lg font-bold">
                        R$ {(stats?.valor_total_encomendas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator className="my-6" />

              {/* Zona de Perigo */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Zona de Perigo
                </h4>
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>Deletar Cadastros do Usuário:</strong> Esta ação irá remover PERMANENTEMENTE todos os
                    dados cadastrados pelo usuário (clientes, receitas, encomendas, etc.), mas
                    manterá as configurações do sistema.
                  </AlertDescription>
                </Alert>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleAbrirPreview}
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

      {/* Modal de Preview e Confirmação */}
      <Dialog open={mostrarPreview} onOpenChange={setMostrarPreview}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Exclusão de Cadastros
            </DialogTitle>
            <DialogDescription>
              Esta ação NÃO PODE ser desfeita. Todos os dados serão permanentemente deletados.
            </DialogDescription>
          </DialogHeader>

          {/* Preview dos dados que serão deletados */}
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção!</strong>
                <p className="mt-1">
                  Os seguintes registros serão PERMANENTEMENTE deletados:
                </p>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between p-2 bg-muted rounded">
                <span className="text-sm">Clientes:</span>
                <Badge variant={(stats?.total_clientes || 0) > 0 ? "destructive" : "secondary"}>
                  {stats?.total_clientes || 0}
                </Badge>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span className="text-sm">Encomendas:</span>
                <Badge variant={(stats?.total_encomendas || 0) > 0 ? "destructive" : "secondary"}>
                  {stats?.total_encomendas || 0}
                </Badge>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span className="text-sm">Receitas:</span>
                <Badge variant={(stats?.total_receitas || 0) > 0 ? "destructive" : "secondary"}>
                  {stats?.total_receitas || 0}
                </Badge>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span className="text-sm">Fornecedores:</span>
                <Badge variant={(stats?.total_fornecedores || 0) > 0 ? "destructive" : "secondary"}>
                  {stats?.total_fornecedores || 0}
                </Badge>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span className="text-sm">Contas a Receber:</span>
                <Badge variant={(stats?.total_contas_receber || 0) > 0 ? "destructive" : "secondary"}>
                  {stats?.total_contas_receber || 0}
                </Badge>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span className="text-sm">Contas a Pagar:</span>
                <Badge variant={(stats?.total_contas_pagar || 0) > 0 ? "destructive" : "secondary"}>
                  {stats?.total_contas_pagar || 0}
                </Badge>
              </div>
            </div>

            {/* Confirmação digitando email */}
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Para confirmar, digite o email do usuário:
              </p>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                  {userData?.email}
                </p>
                <Input
                  type="email"
                  placeholder="Digite o email para confirmar"
                  value={emailConfirmacao}
                  onChange={(e) => setEmailConfirmacao(e.target.value)}
                  className={emailConfirmacao && emailConfirmacao !== userData?.email ? "border-destructive" : ""}
                />
              </div>
            </div>

            {/* Informação sobre backup */}
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>Backup automático:</strong> Antes de deletar, um registro dos dados será criado automaticamente nos logs de administração.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMostrarPreview(false);
                setEmailConfirmacao("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletarCadastros}
              disabled={emailConfirmacao !== userData?.email || deletarDadosUsuarioMutation.isPending}
            >
              {deletarDadosUsuarioMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sim, Deletar Tudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
