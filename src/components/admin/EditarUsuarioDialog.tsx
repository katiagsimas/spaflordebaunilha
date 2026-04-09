import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { DatePickerField } from '@/components/DatePickerField';
import { formatDateToISO, parseISOToDate, addDaysToDate } from '@/lib/dateUtils';
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
import { Checkbox } from '@/components/ui/checkbox';
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
  AlertTriangle,
  Settings,
  Tag,
  History,
  CalendarDays,
  Globe
} from 'lucide-react';

const formSchema = z.object({
  email: z.string().email('Email inválido'),
  nomeCompleto: z.string().min(2, 'Nome completo é obrigatório'),
  nomeConfeitaria: z.string().min(2, 'Nome da confeitaria é obrigatório'),
  role: z.string(),
  ativo: z.boolean(),
  planoId: z.string(),
  planoTipo: z.string(),
});

type FormData = z.infer<typeof formSchema>;

interface HistoricoPlano {
  id: string;
  plano_anterior: string | null;
  plano_novo: string | null;
  plano_tipo_anterior: string | null;
  plano_tipo_novo: string | null;
  plano_inicio: string | null;
  plano_fim: string | null;
  tipo_evento: string;
  origem: string;
  observacao: string | null;
  created_at: string;
}

interface EditarUsuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userData: {
    email: string;
    nome_completo: string | null;
    nome_confeitaria: string | null;
    ativo?: boolean;
    plano_id?: string | null;
    plano_tipo?: string | null;
    plano_inicio?: string | null;
    plano_fim?: string | null;
    created_at?: string;
    origem_criacao?: string | null;
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
  const [itensSelecionados, setItensSelecionados] = useState({
    clientes: true,
    encomendas: true,
    receitas: true,
    fornecedores: true,
    contasReceber: true,
    contasPagar: true,
    categorias: false,
    unidadesMedida: false,
    custosFixos: false,
    tiposInsumos: false,
    ingredientes: false,
    embalagens: false,
    bancos: false,
    tiposDocumento: false,
    planoContas: false,
    tagsEncomendas: false,
  });
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      nomeCompleto: '',
      nomeConfeitaria: '',
      role: 'user',
      ativo: true,
      planoId: 'base',
    },
  });

  // Buscar estatísticas do usuário
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['user-statistics', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const [
        clientesRes,
        encomendasRes,
        receitasRes,
        fornecedoresRes,
        contasReceberRes,
        contasPagarRes,
        categoriasRes,
        unidadesMedidaRes,
        custosFixosRes,
        tiposInsumosRes,
        ingredientesRes,
        embalagensRes,
        bancosRes,
        tiposDocumentoRes,
        categoriasPlanoRes,
        tagsEncomendasRes,
      ] = await Promise.all([
        supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('encomendas').select('valor', { count: 'exact' }).eq('usuario_id', userId),
        supabase.from('receitas').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('fornecedores').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('contas_receber').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('contas_pagar').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('categorias').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('unidades_medida').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('custos_fixos').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        
        supabase.from('tipos_insumos').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('ingredientes').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('embalagens').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('bancos').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('tipos_documento').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('categorias_plano_contas').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('tags_encomendas').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      ]);

      const valorTotalEncomendas = encomendasRes.data?.reduce((acc: number, enc: any) => acc + (Number(enc.valor) || 0), 0) || 0;
      
      return {
        total_clientes: clientesRes.count || 0,
        total_encomendas: encomendasRes.count || 0,
        total_receitas: receitasRes.count || 0,
        total_fornecedores: fornecedoresRes.count || 0,
        total_contas_receber: contasReceberRes.count || 0,
        total_contas_pagar: contasPagarRes.count || 0,
        total_categorias: categoriasRes.count || 0,
        total_unidades_medida: unidadesMedidaRes.count || 0,
        total_custos_fixos: custosFixosRes.count || 0,
        
        total_tipos_insumos: tiposInsumosRes.count || 0,
        total_ingredientes: ingredientesRes.count || 0,
        total_embalagens: embalagensRes.count || 0,
        total_bancos: bancosRes.count || 0,
        total_tipos_documento: tiposDocumentoRes.count || 0,
        total_plano_contas: categoriasPlanoRes.count || 0,
        total_tags_encomendas: tagsEncomendasRes.count || 0,
        valor_total_encomendas: valorTotalEncomendas
      };
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
        planoId: userData.plano_id || 'base',
      });
    }
  }, [userData, userRole, open, form]);

  const atualizarUsuarioMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!userId) throw new Error('ID do usuário não fornecido');
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      const roleAnterior = userRole;

      if (data.email !== userData?.email) {
        const { error: emailError } = await supabase.auth.admin.updateUserById(userId, {
          email: data.email,
        });
        if (emailError) throw emailError;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome_completo: data.nomeCompleto,
          nome_confeitaria: data.nomeConfeitaria,
          ativo: data.ativo,
          plano_id: data.planoId,
        } as any)
        .eq('id', userId);

      if (profileError) throw profileError;

      if (data.role !== userRole) {
        await supabase.from('user_roles').delete().eq('user_id', userId);

        const { error: roleError } = await supabase.from('user_roles').insert([{
          user_id: userId,
          role: data.role as any,
        }]);

        if (roleError) throw roleError;

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

      // Log de alteração de plano
      const planoAnterior = userData?.plano_id || 'base';
      if (data.planoId !== planoAnterior) {
        if (user && userData) {
          await supabase.from('admin_logs').insert({
            admin_id: user.id,
            admin_email: user.email!,
            acao: 'alterou_plano',
            usuario_afetado_id: userId,
            usuario_afetado_email: userData.email,
            detalhes: {
              plano_anterior: planoAnterior,
              plano_novo: data.planoId
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
      queryClient.invalidateQueries({ queryKey: ['plano'] });
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

      if (emailConfirmacao !== userData?.email) {
        throw new Error('Email de confirmação incorreto!');
      }

      const { data: { user } } = await supabase.auth.getUser();
      const deletePromises = [];

      if (itensSelecionados.clientes) {
        deletePromises.push(supabase.from('clientes').delete().eq('usuario_id', userId));
      }
      if (itensSelecionados.encomendas) {
        deletePromises.push(supabase.from('encomenda_itens').delete().eq('usuario_id', userId));
        deletePromises.push(supabase.from('encomendas').delete().eq('usuario_id', userId));
      }
      if (itensSelecionados.receitas) {
        deletePromises.push(supabase.from('receitas').delete().eq('usuario_id', userId));
      }
      if (itensSelecionados.fornecedores) {
        deletePromises.push(supabase.from('fornecedores').delete().eq('usuario_id', userId));
      }
      if (itensSelecionados.contasReceber) {
        deletePromises.push(supabase.from('contas_receber').delete().eq('usuario_id', userId));
      }
      if (itensSelecionados.contasPagar) {
        deletePromises.push(supabase.from('contas_pagar').delete().eq('usuario_id', userId));
      }
      if (itensSelecionados.categorias) {
        deletePromises.push(supabase.from('categorias').delete().eq('usuario_id', userId));
      }
      if (itensSelecionados.unidadesMedida) {
        deletePromises.push(supabase.from('unidades_medida').delete().eq('usuario_id', userId));
      }
      if (itensSelecionados.custosFixos) {
        deletePromises.push(supabase.from('custos_fixos').delete().eq('usuario_id', userId));
      }
      if (itensSelecionados.tiposInsumos) {
        deletePromises.push(supabase.from('tipos_insumos').delete().eq('usuario_id', userId));
      }
      if (itensSelecionados.ingredientes) {
        deletePromises.push(supabase.from('ingredientes').delete().eq('usuario_id', userId));
      }
      if (itensSelecionados.embalagens) {
        deletePromises.push(supabase.from('embalagens').delete().eq('usuario_id', userId));
      }
      if (itensSelecionados.bancos) {
        deletePromises.push(supabase.from('bancos').delete().eq('usuario_id', userId));
      }
      if (itensSelecionados.tiposDocumento) {
        deletePromises.push(supabase.from('tipos_documento').delete().eq('usuario_id', userId));
      }
      if (itensSelecionados.planoContas) {
        deletePromises.push(supabase.from('categorias_plano_contas').delete().eq('user_id', userId));
      }
      if (itensSelecionados.tagsEncomendas) {
        deletePromises.push(supabase.from('tags_encomendas').delete().eq('user_id', userId));
      }

      const deleteResults = await Promise.allSettled(deletePromises);
      
      const errors = deleteResults.filter(r => r.status === 'rejected');
      if (errors.length > 0) {
        console.error('Erros ao deletar:', errors);
        throw new Error('Alguns registros não puderam ser deletados');
      }

      if (user && userData) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          admin_email: user.email,
          acao: 'deletou_cadastros',
          usuario_afetado_id: userId,
          usuario_afetado_email: userData.email,
          detalhes: {
            registros_deletados: stats,
            itens_selecionados: itensSelecionados,
            data_acao: new Date().toISOString()
          }
        });
      }
    },
    onSuccess: () => {
      toast({
        title: 'Dados deletados com sucesso',
        description: 'Os cadastros selecionados foram removidos.',
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
                name="planoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plano</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um plano" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="base">Plano Base</SelectItem>
                        <SelectItem value="negocio">Plano Negócio</SelectItem>
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

              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Zona de Perigo
                </h4>
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>Deletar Cadastros do Usuário:</strong> Esta ação irá remover PERMANENTEMENTE os
                    dados selecionados do usuário.
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

      <Dialog open={mostrarPreview} onOpenChange={setMostrarPreview}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Exclusão de Cadastros
            </DialogTitle>
            <DialogDescription className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 animate-pulse">
              <span className="text-destructive font-semibold">Esta ação NÃO PODE ser desfeita. Os dados selecionados serão permanentemente deletados.</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção!</strong>
                <p className="mt-1">
                  Selecione os cadastros que deseja DELETAR PERMANENTEMENTE:
                </p>
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Cadastros Principais
              </h4>
              <div className="grid gap-2">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="clientes"
                      checked={itensSelecionados.clientes}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, clientes: checked as boolean })
                      }
                    />
                    <label htmlFor="clientes" className="text-sm cursor-pointer">
                      Clientes
                    </label>
                  </div>
                  <Badge variant={(stats?.total_clientes || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_clientes || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="encomendas"
                      checked={itensSelecionados.encomendas}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, encomendas: checked as boolean })
                      }
                    />
                    <label htmlFor="encomendas" className="text-sm cursor-pointer">
                      Encomendas
                    </label>
                  </div>
                  <Badge variant={(stats?.total_encomendas || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_encomendas || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="receitas"
                      checked={itensSelecionados.receitas}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, receitas: checked as boolean })
                      }
                    />
                    <label htmlFor="receitas" className="text-sm cursor-pointer">
                      Receitas
                    </label>
                  </div>
                  <Badge variant={(stats?.total_receitas || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_receitas || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="fornecedores"
                      checked={itensSelecionados.fornecedores}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, fornecedores: checked as boolean })
                      }
                    />
                    <label htmlFor="fornecedores" className="text-sm cursor-pointer">
                      Fornecedores
                    </label>
                  </div>
                  <Badge variant={(stats?.total_fornecedores || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_fornecedores || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="contasReceber"
                      checked={itensSelecionados.contasReceber}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, contasReceber: checked as boolean })
                      }
                    />
                    <label htmlFor="contasReceber" className="text-sm cursor-pointer">
                      Contas a Receber
                    </label>
                  </div>
                  <Badge variant={(stats?.total_contas_receber || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_contas_receber || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="contasPagar"
                      checked={itensSelecionados.contasPagar}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, contasPagar: checked as boolean })
                      }
                    />
                    <label htmlFor="contasPagar" className="text-sm cursor-pointer">
                      Contas a Pagar
                    </label>
                  </div>
                  <Badge variant={(stats?.total_contas_pagar || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_contas_pagar || 0}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configurações
              </h4>
              <div className="grid gap-2">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="categorias"
                      checked={itensSelecionados.categorias}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, categorias: checked as boolean })
                      }
                    />
                    <label htmlFor="categorias" className="text-sm cursor-pointer">
                      Categorias
                    </label>
                  </div>
                  <Badge variant="secondary">
                    {stats?.total_categorias || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="unidadesMedida"
                      checked={itensSelecionados.unidadesMedida}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, unidadesMedida: checked as boolean })
                      }
                    />
                    <label htmlFor="unidadesMedida" className="text-sm cursor-pointer">
                      Unidades de Medida
                    </label>
                  </div>
                  <Badge variant="secondary">
                    {stats?.total_unidades_medida || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="bancos"
                      checked={itensSelecionados.bancos}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, bancos: checked as boolean })
                      }
                    />
                    <label htmlFor="bancos" className="text-sm cursor-pointer">
                      Bancos
                    </label>
                  </div>
                  <Badge variant="secondary">
                    {stats?.total_bancos || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="tiposDocumento"
                      checked={itensSelecionados.tiposDocumento}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, tiposDocumento: checked as boolean })
                      }
                    />
                    <label htmlFor="tiposDocumento" className="text-sm cursor-pointer">
                      Tipos de Documento
                    </label>
                  </div>
                  <Badge variant="secondary">
                    {stats?.total_tipos_documento || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="planoContas"
                      checked={itensSelecionados.planoContas}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, planoContas: checked as boolean })
                      }
                    />
                    <label htmlFor="planoContas" className="text-sm cursor-pointer">
                      Plano de Contas
                    </label>
                  </div>
                  <Badge variant="secondary">
                    {stats?.total_plano_contas || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="tagsEncomendas"
                      checked={itensSelecionados.tagsEncomendas}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, tagsEncomendas: checked as boolean })
                      }
                    />
                    <label htmlFor="tagsEncomendas" className="text-sm cursor-pointer">
                      Tags de Encomendas
                    </label>
                  </div>
                  <Badge variant="secondary">
                    {stats?.total_tags_encomendas || 0}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Precificação
              </h4>
              <div className="grid gap-2">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="custosFixos"
                      checked={itensSelecionados.custosFixos}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, custosFixos: checked as boolean })
                      }
                    />
                    <label htmlFor="custosFixos" className="text-sm cursor-pointer">
                      Custos Fixos
                    </label>
                  </div>
                  <Badge variant="secondary">
                    {stats?.total_custos_fixos || 0}
                  </Badge>
                </div>


                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="tiposInsumos"
                      checked={itensSelecionados.tiposInsumos}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, tiposInsumos: checked as boolean })
                      }
                    />
                    <label htmlFor="tiposInsumos" className="text-sm cursor-pointer">
                      Insumos e Embalagens
                    </label>
                  </div>
                  <Badge variant="secondary">
                    {stats?.total_tipos_insumos || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="ingredientes"
                      checked={itensSelecionados.ingredientes}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, ingredientes: checked as boolean })
                      }
                    />
                    <label htmlFor="ingredientes" className="text-sm cursor-pointer">
                      Ingredientes
                    </label>
                  </div>
                  <Badge variant="secondary">
                    {stats?.total_ingredientes || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="embalagens"
                      checked={itensSelecionados.embalagens}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, embalagens: checked as boolean })
                      }
                    />
                    <label htmlFor="embalagens" className="text-sm cursor-pointer">
                      Embalagens
                    </label>
                  </div>
                  <Badge variant="secondary">
                    {stats?.total_embalagens || 0}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

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
              Sim, Deletar Selecionados
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
