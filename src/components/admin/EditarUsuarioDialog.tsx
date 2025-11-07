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
  Tag
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
  const [itensSelecionados, setItensSelecionados] = useState({
    // PRECIFICAÇÃO
    ingredientes: false,
    embalagens: false,
    prePreparos: false,
    subReceitas: false,
    receitas: false,
    custosFixos: false,
    maoObra: false,
    tiposInsumos: false,
    
    // ESTOQUE
    movimentacoesEstoque: false,
    estoqueAtual: false,
    entradasDetalhadas: false,
    categoriasEstoque: false,
    
    // ENCOMENDAS
    encomendas: false,
    tagsEncomendas: false,
    
    // PRODUÇÃO
    producao: false,
    
    // CLIENTES
    clientes: false,
    
    // FORNECEDORES
    fornecedores: false,
    
    // FINANCEIRO
    contasReceber: false,
    contasPagar: false,
    planoContas: false,
    categoriasPlanoContas: false,
    categoriasReceita: false,
    cmvMensal: false,
    
    // BANCO
    banco: false,
    bancos: false,
    
    // CONFIGURAÇÕES
    categorias: false,
    unidadesMedida: false,
    tiposDocumento: false,
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
    },
  });

  // Buscar estatísticas do usuário
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['user-statistics', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const results: any[] = await Promise.all([
        supabase.from('ingredientes').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('embalagens').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('pre_preparos').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('sub_receitas').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('receitas').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('custos_fixos').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('configuracao_mao_obra').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('tipos_insumos').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        
        supabase.from('movimentacoes_estoque').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('estoque_atual').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('entradas_detalhadas').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        // @ts-expect-error - TypeScript type inference issue with complex queries
        supabase.from('categorias_estoque').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        
        supabase.from('encomendas').select('valor', { count: 'exact' }).eq('usuario_id', userId),
        // @ts-expect-error - TypeScript type inference issue with complex queries
        supabase.from('categorias_tags').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        
        supabase.from('producao_tarefas').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        
        supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        
        supabase.from('fornecedores').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        
        supabase.from('contas_receber').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('contas_pagar').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('plano_contas').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('categorias_plano_contas').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('categorias_financeiras').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('cmv_mensal').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        
        // @ts-expect-error - TypeScript type inference issue with complex queries
        supabase.from('bank_imports').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('bancos').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        
        supabase.from('categorias').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('unidades_medida').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('tipos_documento').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
      ]);
      
      const [
        ingredientesRes,
        embalagensRes,
        prePreparosRes,
        subReceitasRes,
        receitasRes,
        custosFixosRes,
        maoObraRes,
        tiposInsumosRes,
        
        movimentacoesRes,
        estoqueAtualRes,
        entradasDetalhadasRes,
        categoriasEstoqueRes,
        
        encomendasRes,
        tagsRes,
        
        producaoRes,
        
        clientesRes,
        
        fornecedoresRes,
        
        contasReceberRes,
        contasPagarRes,
        planoContasRes,
        categoriasPlanoRes,
        categoriasFinanceirasRes,
        cmvMensalRes,
        
        bankImportsRes,
        bancosRes,
        
        categoriasRes,
        unidadesMedidaRes,
        tiposDocumentoRes,
      ] = results;

      const valorTotalEncomendas = encomendasRes.data?.reduce((acc: number, enc: any) => acc + (Number(enc.valor) || 0), 0) || 0;
      
      return {
        // PRECIFICAÇÃO
        total_ingredientes: ingredientesRes.count || 0,
        total_embalagens: embalagensRes.count || 0,
        total_pre_preparos: prePreparosRes.count || 0,
        total_sub_receitas: subReceitasRes.count || 0,
        total_receitas: receitasRes.count || 0,
        total_custos_fixos: custosFixosRes.count || 0,
        total_mao_obra: maoObraRes.count || 0,
        total_tipos_insumos: tiposInsumosRes.count || 0,
        
        // ESTOQUE
        total_movimentacoes: movimentacoesRes.count || 0,
        total_estoque_atual: estoqueAtualRes.count || 0,
        total_entradas_detalhadas: entradasDetalhadasRes.count || 0,
        total_categorias_estoque: categoriasEstoqueRes.count || 0,
        
        // ENCOMENDAS
        total_encomendas: encomendasRes.count || 0,
        total_tags: tagsRes.count || 0,
        valor_total_encomendas: valorTotalEncomendas,
        
        // PRODUÇÃO
        total_producao: producaoRes.count || 0,
        
        // CLIENTES
        total_clientes: clientesRes.count || 0,
        
        // FORNECEDORES
        total_fornecedores: fornecedoresRes.count || 0,
        
        // FINANCEIRO
        total_contas_receber: contasReceberRes.count || 0,
        total_contas_pagar: contasPagarRes.count || 0,
        total_plano_contas: planoContasRes.count || 0,
        total_categorias_plano: categoriasPlanoRes.count || 0,
        total_categorias_financeiras: categoriasFinanceirasRes.count || 0,
        total_cmv_mensal: cmvMensalRes.count || 0,
        
        // BANCO
        total_bank_imports: bankImportsRes.count || 0,
        total_bancos: bancosRes.count || 0,
        
        // CONFIGURAÇÕES
        total_categorias: categoriasRes.count || 0,
        total_unidades_medida: unidadesMedidaRes.count || 0,
        total_tipos_documento: tiposDocumentoRes.count || 0,
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
        })
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

      if (emailConfirmacao !== userData?.email) {
        throw new Error('Email de confirmação incorreto!');
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      // Chamar função RPC para deletar seletivamente
      const { data, error } = await supabase.rpc('deletar_cadastros_seletivo', {
        p_user_id: userId,
        p_selecao: itensSelecionados
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
            registros_deletados: data,
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
            <DialogDescription className="bg-black text-white border border-destructive rounded-lg p-4 animate-pulse shadow-lg">
              <span className="font-bold text-base">⚠️ ATENÇÃO: Esta ação NÃO PODE ser desfeita. Os dados selecionados serão PERMANENTEMENTE DELETADOS do sistema.</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção!</strong>
                <p className="mt-1">
                  Selecione os módulos e cadastros que deseja DELETAR PERMANENTEMENTE (incluindo dados padrão do sistema):
                </p>
              </AlertDescription>
            </Alert>

            {/* MÓDULO: PRECIFICAÇÃO */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 bg-primary/10 p-2 rounded">
                <Tag className="h-4 w-4" />
                MÓDULO: PRECIFICAÇÃO
              </h4>
              <div className="grid gap-2 ml-4">
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
                  <Badge variant={(stats?.total_ingredientes || 0) > 0 ? "destructive" : "secondary"}>
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
                  <Badge variant={(stats?.total_embalagens || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_embalagens || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="prePreparos"
                      checked={itensSelecionados.prePreparos}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, prePreparos: checked as boolean })
                      }
                    />
                    <label htmlFor="prePreparos" className="text-sm cursor-pointer">
                      Pré-Preparos
                    </label>
                  </div>
                  <Badge variant={(stats?.total_pre_preparos || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_pre_preparos || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="subReceitas"
                      checked={itensSelecionados.subReceitas}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, subReceitas: checked as boolean })
                      }
                    />
                    <label htmlFor="subReceitas" className="text-sm cursor-pointer">
                      Sub-Receitas
                    </label>
                  </div>
                  <Badge variant={(stats?.total_sub_receitas || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_sub_receitas || 0}
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
                  <Badge variant={(stats?.total_custos_fixos || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_custos_fixos || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="maoObra"
                      checked={itensSelecionados.maoObra}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, maoObra: checked as boolean })
                      }
                    />
                    <label htmlFor="maoObra" className="text-sm cursor-pointer">
                      Mão de Obra
                    </label>
                  </div>
                  <Badge variant={(stats?.total_mao_obra || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_mao_obra || 0}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* MÓDULO: ESTOQUE */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 bg-primary/10 p-2 rounded">
                <FileText className="h-4 w-4" />
                MÓDULO: ESTOQUE
              </h4>
              <div className="grid gap-2 ml-4">
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
                      Itens de Estoque (Tipos de Insumos)
                    </label>
                  </div>
                  <Badge variant={(stats?.total_tipos_insumos || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_tipos_insumos || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="movimentacoesEstoque"
                      checked={itensSelecionados.movimentacoesEstoque}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, movimentacoesEstoque: checked as boolean })
                      }
                    />
                    <label htmlFor="movimentacoesEstoque" className="text-sm cursor-pointer">
                      Movimentações de Estoque
                    </label>
                  </div>
                  <Badge variant={(stats?.total_movimentacoes || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_movimentacoes || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="estoqueAtual"
                      checked={itensSelecionados.estoqueAtual}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, estoqueAtual: checked as boolean })
                      }
                    />
                    <label htmlFor="estoqueAtual" className="text-sm cursor-pointer">
                      Estoque Atual
                    </label>
                  </div>
                  <Badge variant={(stats?.total_estoque_atual || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_estoque_atual || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="entradasDetalhadas"
                      checked={itensSelecionados.entradasDetalhadas}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, entradasDetalhadas: checked as boolean })
                      }
                    />
                    <label htmlFor="entradasDetalhadas" className="text-sm cursor-pointer">
                      Entradas Detalhadas
                    </label>
                  </div>
                  <Badge variant={(stats?.total_entradas_detalhadas || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_entradas_detalhadas || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="categoriasEstoque"
                      checked={itensSelecionados.categoriasEstoque}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, categoriasEstoque: checked as boolean })
                      }
                    />
                    <label htmlFor="categoriasEstoque" className="text-sm cursor-pointer">
                      Categorias de Estoque
                    </label>
                  </div>
                  <Badge variant={(stats?.total_categorias_estoque || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_categorias_estoque || 0}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* MÓDULO: ENCOMENDAS */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 bg-primary/10 p-2 rounded">
                <ShoppingBag className="h-4 w-4" />
                MÓDULO: ENCOMENDAS
              </h4>
              <div className="grid gap-2 ml-4">
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
                  <Badge variant={(stats?.total_tags || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_tags || 0}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* MÓDULO: PRODUÇÃO */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 bg-primary/10 p-2 rounded">
                <Settings className="h-4 w-4" />
                MÓDULO: PRODUÇÃO
              </h4>
              <div className="grid gap-2 ml-4">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="producao"
                      checked={itensSelecionados.producao}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, producao: checked as boolean })
                      }
                    />
                    <label htmlFor="producao" className="text-sm cursor-pointer">
                      Tarefas de Produção
                    </label>
                  </div>
                  <Badge variant={(stats?.total_producao || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_producao || 0}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* MÓDULO: CLIENTES */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 bg-primary/10 p-2 rounded">
                <Users className="h-4 w-4" />
                MÓDULO: CLIENTES
              </h4>
              <div className="grid gap-2 ml-4">
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
                      Clientes (inclui Familiares e NPS)
                    </label>
                  </div>
                  <Badge variant={(stats?.total_clientes || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_clientes || 0}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* MÓDULO: FORNECEDORES */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 bg-primary/10 p-2 rounded">
                <Building2 className="h-4 w-4" />
                MÓDULO: FORNECEDORES
              </h4>
              <div className="grid gap-2 ml-4">
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
                      Fornecedores (inclui Contatos)
                    </label>
                  </div>
                  <Badge variant={(stats?.total_fornecedores || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_fornecedores || 0}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* MÓDULO: FINANCEIRO */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 bg-primary/10 p-2 rounded">
                <DollarSign className="h-4 w-4" />
                MÓDULO: FINANCEIRO
              </h4>
              <div className="grid gap-2 ml-4">
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
                      Plano de Contas (TODOS, incluindo padrão)
                    </label>
                  </div>
                  <Badge variant={(stats?.total_plano_contas || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_plano_contas || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="categoriasPlanoContas"
                      checked={itensSelecionados.categoriasPlanoContas}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, categoriasPlanoContas: checked as boolean })
                      }
                    />
                    <label htmlFor="categoriasPlanoContas" className="text-sm cursor-pointer">
                      Categorias Plano de Contas (TODAS, incluindo padrão)
                    </label>
                  </div>
                  <Badge variant={(stats?.total_categorias_plano || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_categorias_plano || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="categoriasReceita"
                      checked={itensSelecionados.categoriasReceita}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, categoriasReceita: checked as boolean })
                      }
                    />
                    <label htmlFor="categoriasReceita" className="text-sm cursor-pointer">
                      Categorias de Receita
                    </label>
                  </div>
                  <Badge variant={(stats?.total_categorias_financeiras || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_categorias_financeiras || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="cmvMensal"
                      checked={itensSelecionados.cmvMensal}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, cmvMensal: checked as boolean })
                      }
                    />
                    <label htmlFor="cmvMensal" className="text-sm cursor-pointer">
                      CMV Mensal
                    </label>
                  </div>
                  <Badge variant={(stats?.total_cmv_mensal || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_cmv_mensal || 0}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* MÓDULO: BANCO */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 bg-primary/10 p-2 rounded">
                <Building2 className="h-4 w-4" />
                MÓDULO: BANCO
              </h4>
              <div className="grid gap-2 ml-4">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="banco"
                      checked={itensSelecionados.banco}
                      onCheckedChange={(checked) =>
                        setItensSelecionados({ ...itensSelecionados, banco: checked as boolean })
                      }
                    />
                    <label htmlFor="banco" className="text-sm cursor-pointer">
                      Importações e Conciliações Bancárias
                    </label>
                  </div>
                  <Badge variant={(stats?.total_bank_imports || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_bank_imports || 0}
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
                      Bancos Cadastrados (TODOS, incluindo Caixa Empresa)
                    </label>
                  </div>
                  <Badge variant={(stats?.total_bancos || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_bancos || 0}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* MÓDULO: CONFIGURAÇÕES */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 bg-primary/10 p-2 rounded">
                <Settings className="h-4 w-4" />
                MÓDULO: CONFIGURAÇÕES
              </h4>
              <div className="grid gap-2 ml-4">
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
                      Categorias de Receitas
                    </label>
                  </div>
                  <Badge variant={(stats?.total_categorias || 0) > 0 ? "destructive" : "secondary"}>
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
                      Unidades de Medida (TODAS, incluindo padrão)
                    </label>
                  </div>
                  <Badge variant={(stats?.total_unidades_medida || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_unidades_medida || 0}
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
                      Tipos de Documento (TODOS, incluindo padrão)
                    </label>
                  </div>
                  <Badge variant={(stats?.total_tipos_documento || 0) > 0 ? "destructive" : "secondary"}>
                    {stats?.total_tipos_documento || 0}
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
