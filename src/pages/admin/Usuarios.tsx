import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/LoadingState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, Users, Shield, User, MoreVertical, Edit, UserX, Trash2, Search, UserCheck, Clock, AlertCircle, Download, UserPlus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';

import { EditarUsuarioDialog } from '@/components/admin/EditarUsuarioDialog';
import { CriarUsuarioDialog } from '@/components/admin/CriarUsuarioDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface UserProfile {
  id: string;
  email: string;
  nome_completo: string | null;
  nome_confeitaria: string | null;
  created_at: string;
  ativo?: boolean;
  plano_id?: string | null;
  plano_inicio?: string | null;
  plano_fim?: string | null;
  plano_tipo?: string | null;
}

interface UserRole {
  role: string;
}

export default function Usuarios() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin, isLoading: isLoadingAdmin } = useIsAdmin();
  
  
  const [showCriarDialog, setShowCriarDialog] = useState(false);
  const [showEditarDialog, setShowEditarDialog] = useState(false);
  const [showDesabilitarDialog, setShowDesabilitarDialog] = useState(false);
  const [showExcluirDialog, setShowExcluirDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    email: string;
    nome_completo: string | null;
    nome_confeitaria: string | null;
    ativo?: boolean;
  } | null>(null);
  const [selectedUserRole, setSelectedUserRole] = useState<string>('user');
  
  // Estados para busca e filtros
  const [buscaEmail, setBuscaEmail] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPermissao, setFiltroPermissao] = useState("todos");
  const [porPagina, setPorPagina] = useState(10);
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    ativos: 0,
    inativos: 0,
    admins: 0
  });

  // Verificar se é admin antes de carregar dados
  const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserProfile[];
    },
    enabled: isAdmin,
  });

  // Buscar roles de todos os usuários
  const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Mapear roles por user_id
  const rolesByUser = rolesData?.reduce((acc, item) => {
    if (!acc[item.user_id]) {
      acc[item.user_id] = [];
    }
    acc[item.user_id].push(item.role);
    return acc;
  }, {} as Record<string, string[]>) || {};

  // Carregar estatísticas
  useEffect(() => {
    carregarEstatisticas();
  }, [profiles, rolesData]);

  async function carregarEstatisticas() {
    if (!profiles) return;
    
    setEstatisticas({
      total: profiles.length,
      ativos: profiles.filter(u => u.ativo !== false).length,
      inativos: profiles.filter(u => u.ativo === false).length,
      admins: profiles.filter(u => {
        const roles = rolesByUser[u.id] || [];
        return roles.includes('admin');
      }).length
    });
  }

  // Filtrar usuários
  const usuariosFiltrados = profiles?.filter(usuario => {
    const matchEmail = buscaEmail === "" || 
      usuario.email.toLowerCase().includes(buscaEmail.toLowerCase()) ||
      usuario.nome_completo?.toLowerCase().includes(buscaEmail.toLowerCase()) ||
      usuario.nome_confeitaria?.toLowerCase().includes(buscaEmail.toLowerCase());
    
    const matchStatus = filtroStatus === "todos" || 
      (filtroStatus === "ativo" && usuario.ativo !== false) ||
      (filtroStatus === "inativo" && usuario.ativo === false);
    
    const userRoles = rolesByUser[usuario.id] || [];
    const matchPermissao = filtroPermissao === "todos" || 
      (filtroPermissao === "admin" && userRoles.includes('admin')) ||
      (filtroPermissao === "user" && !userRoles.includes('admin'));
    
    return matchEmail && matchStatus && matchPermissao;
  }) || [];

  // Aplicar paginação
  const usuariosPaginados = usuariosFiltrados.slice(0, porPagina);

  // Função de exportar para Excel
  const exportarParaExcel = () => {
    const dadosExportacao = usuariosFiltrados.map(usuario => {
      const userRoles = rolesByUser[usuario.id] || [];
      const isAdmin = userRoles.includes('admin');
      
      return {
        'Email': usuario.email,
        'Nome Completo': usuario.nome_completo || 'N/A',
        'Confeitaria': usuario.nome_confeitaria || 'N/A',
        'Status': usuario.ativo !== false ? 'Ativo' : 'Inativo',
        'Permissão': isAdmin ? 'Administrador' : 'Usuário',
        'Cadastrado em': new Date(usuario.created_at).toLocaleDateString('pt-BR'),
      };
    });

    const ws = XLSX.utils.json_to_sheet(dadosExportacao);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuários');
    XLSX.writeFile(wb, `usuarios-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: '✅ Exportado',
      description: 'Dados exportados para Excel com sucesso!',
    });
  };

  const alterarStatusUsuarioMutation = useMutation({
    mutationFn: async ({ userId, novoStatus, userEmail }: { userId: string; novoStatus: boolean; userEmail: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('profiles')
        .update({ ativo: novoStatus })
        .eq('id', userId);
      
      if (error) throw error;

      // Registrar log
      if (user) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          admin_email: user.email,
          acao: novoStatus ? 'habilitou_usuario' : 'desabilitou_usuario',
          usuario_afetado_id: userId,
          usuario_afetado_email: userEmail,
          detalhes: {
            status_anterior: novoStatus ? 'inativo' : 'ativo',
            status_novo: novoStatus ? 'ativo' : 'inativo'
          }
        });
      }
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.novoStatus ? 'Usuário ativado' : 'Usuário desativado',
        description: `O usuário foi ${variables.novoStatus ? 'ativado' : 'desativado'} com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao alterar status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const desabilitarUsuarioMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('profiles')
        .update({ ativo: false })
        .eq('id', userId);
      
      if (error) throw error;

      // Registrar log
      if (user && selectedUser) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          admin_email: user.email,
          acao: 'desabilitou_usuario',
          usuario_afetado_id: userId,
          usuario_afetado_email: selectedUser.email,
          detalhes: {
            status_anterior: 'ativo',
            status_novo: 'inativo'
          }
        });
      }
    },
    onSuccess: () => {
      toast({
        title: 'Usuário desabilitado',
        description: 'O usuário foi desabilitado com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowDesabilitarDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao desabilitar usuário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const excluirUsuarioMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Registrar log ANTES de desabilitar
      if (user && selectedUser) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          admin_email: user.email,
          acao: 'excluiu_usuario',
          usuario_afetado_id: userId,
          usuario_afetado_email: selectedUser.email,
          detalhes: {
            dados_usuario: {
              email: selectedUser.email,
              nome: selectedUser.nome_completo,
              confeitaria: selectedUser.nome_confeitaria
            },
            motivo: 'Usuário excluído pelo administrador - acesso permanentemente bloqueado'
          }
        });
      }

      // Marcar usuário como inativo (desabilita completamente o acesso)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ ativo: false })
        .eq('id', userId);
      
      if (profileError) throw profileError;
    },
    onSuccess: () => {
      toast({
        title: 'Usuário excluído',
        description: 'O acesso do usuário foi bloqueado permanentemente. Ele não poderá mais acessar o sistema.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      setShowExcluirDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir usuário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const isLoading = isLoadingAdmin || isLoadingProfiles || isLoadingRoles;

  const handleEditar = (profile: any, role: string) => {
    setSelectedUser(profile);
    setSelectedUserRole(role);
    setShowEditarDialog(true);
  };

  const handleDesabilitar = (profile: any) => {
    setSelectedUser(profile);
    setShowDesabilitarDialog(true);
  };

  const handleReabilitar = (profile: any) => {
    alterarStatusUsuarioMutation.mutate({
      userId: profile.id,
      novoStatus: true,
      userEmail: profile.email
    });
  };

  const handleExcluir = (profile: any) => {
    setSelectedUser(profile);
    setShowExcluirDialog(true);
  };

  const handleToggleStatus = (profile: any, checked: boolean) => {
    alterarStatusUsuarioMutation.mutate({
      userId: profile.id,
      novoStatus: checked,
      userEmail: profile.email
    });
  };

  // Função para limpar filtros
  const limparFiltros = () => {
    setBuscaEmail("");
    setFiltroStatus("todos");
    setFiltroPermissao("todos");
  };

  // Redirecionar se não for admin
  if (!isLoadingAdmin && !isAdmin) {
    navigate('/dashboard');
    return null;
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'moderator':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-3 w-3" />;
      case 'moderator':
        return <Users className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'moderator':
        return 'Moderador';
      case 'user':
        return 'Usuário';
      default:
        return role;
    }
  };

  return (
    <>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Usuários do Sistema"
            description="Gerencie todos os usuários cadastrados e suas permissões"
          />
          <Button onClick={() => setShowCriarDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Criar Usuário
          </Button>
        </div>

        {/* Dashboard de Resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {/* Total de Usuários */}
          <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-4 border-l-[#D89B8C] group">
            <CardHeader className="p-3">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-8 h-8 rounded-lg text-slate-600 bg-slate-50 dark:bg-slate-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm mb-0.5">Total de Usuários</CardTitle>
                  <CardDescription className="text-2xl font-bold text-foreground">
                    {estatisticas.total}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Usuários Ativos */}
          <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-4 border-l-[#D89B8C] group">
            <CardHeader className="p-3">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-8 h-8 rounded-lg text-green-600 bg-green-50 dark:bg-green-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm mb-0.5">Ativos</CardTitle>
                  <CardDescription className="text-2xl font-bold text-green-600">
                    {estatisticas.ativos}
                  </CardDescription>
                  <CardDescription className="text-xs">
                    {estatisticas.total > 0 
                      ? `${((estatisticas.ativos / estatisticas.total) * 100).toFixed(0)}% do total`
                      : '0%'
                    }
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Usuários Inativos */}
          <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-4 border-l-[#D89B8C] group">
            <CardHeader className="p-3">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-8 h-8 rounded-lg text-orange-600 bg-orange-50 dark:bg-orange-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserX className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm mb-0.5">Inativos</CardTitle>
                  <CardDescription className="text-2xl font-bold text-orange-600">
                    {estatisticas.inativos}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Administradores */}
          <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-4 border-l-[#D89B8C] group">
            <CardHeader className="p-3">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-8 h-8 rounded-lg text-blue-600 bg-blue-50 dark:bg-blue-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm mb-0.5">Administradores</CardTitle>
                  <CardDescription className="text-2xl font-bold text-blue-600">
                    {estatisticas.admins}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Busca e Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Busca */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, email ou confeitaria..."
                    value={buscaEmail}
                    onChange={(e) => setBuscaEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {/* Botão Limpar Filtros */}
                {(buscaEmail || filtroStatus !== "todos" || filtroPermissao !== "todos") && (
                  <button
                    onClick={limparFiltros}
                    className="text-xs text-muted-foreground hover:text-foreground mt-1 underline"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>

              {/* Filtro Status */}
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro Permissão */}
              <Select value={filtroPermissao} onValueChange={setFiltroPermissao}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Permissão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as permissões</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                  <SelectItem value="user">Usuários</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lista de Usuários
            </CardTitle>
            <CardDescription>
              Exibindo {usuariosFiltrados.length} de {profiles?.length || 0} usuários cadastrados
            </CardDescription>
            
            {/* Resultados por Página e Exportar */}
            <div className="flex items-center gap-4 pt-4">
              {/* Resultados por Página */}
              <div className="flex items-center gap-2">
                <Select value={porPagina.toString()} onValueChange={(value) => setPorPagina(Number(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground whitespace-nowrap">Resultados por Página</span>
              </div>

              {/* Botão Exportar */}
              <Button variant="outline" size="sm" onClick={exportarParaExcel}>
                <Download className="mr-2 h-4 w-4" />
                Exportar para Excel
              </Button>
            </div>
          </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState message="Carregando Usuários" submessage="Buscando lista de usuários..." />
          ) : !profiles || profiles.length === 0 ? (
            <EmptyState
              title="Nenhum usuário encontrado"
              description="Não há usuários cadastrados no sistema."
              icon={Users}
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                 <TableHeader>
                  <TableRow>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead>Início do Plano</TableHead>
                    <TableHead>Expiração do Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuariosPaginados.map((profile) => {
                    const userRoles = rolesByUser[profile.id] || ['user'];
                    const mainRole = userRoles[0];
                    return (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">
                          {profile.nome_completo || '-'}
                        </TableCell>
                        <TableCell>{profile.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-body text-xs">
                            {profile.plano_id === 'negocio' ? 'Negócio' : profile.plano_id === 'controle' ? 'Controle' : 'Base'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {userRoles.map((role) => (
                              <Badge
                                key={role}
                                variant={getRoleBadgeVariant(role)}
                                className="flex items-center gap-1"
                              >
                                {getRoleIcon(role)}
                                {getRoleLabel(role)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {profile.plano_inicio
                              ? new Date(profile.plano_inicio + 'T00:00:00').toLocaleDateString('pt-BR')
                              : '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {profile.plano_fim
                              ? new Date(profile.plano_fim + 'T00:00:00').toLocaleDateString('pt-BR')
                              : '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={profile.ativo !== false ? 'default' : 'secondary'}>
                            {profile.ativo !== false ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(profile as any).last_login ? (
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {formatDistanceToNow(new Date((profile as any).last_login), {
                                  addSuffix: true,
                                  locale: ptBR
                                })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Nunca acessou</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditar(profile, mainRole)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              {profile.ativo !== false ? (
                                <DropdownMenuItem 
                                  onClick={() => handleDesabilitar(profile)}
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  Desabilitar
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => handleReabilitar(profile)}
                                >
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Reabilitar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>


      <CriarUsuarioDialog
        open={showCriarDialog}
        onOpenChange={setShowCriarDialog}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['admin-users'] })}
      />

      <EditarUsuarioDialog
        open={showEditarDialog}
        onOpenChange={setShowEditarDialog}
        userId={selectedUser?.id || null}
        userData={selectedUser}
        userRole={selectedUserRole}
      />

      <ConfirmDialog
        open={showDesabilitarDialog}
        onOpenChange={setShowDesabilitarDialog}
        onConfirm={() => selectedUser && desabilitarUsuarioMutation.mutate(selectedUser.id)}
        title="Desabilitar Usuário"
        description={`Tem certeza que deseja desabilitar o usuário ${selectedUser?.nome_completo || selectedUser?.email}? O usuário não poderá mais fazer login no sistema.`}
        confirmLabel="Desabilitar"
        cancelLabel="Cancelar"
      />

      <ConfirmDialog
        open={showExcluirDialog}
        onOpenChange={setShowExcluirDialog}
        onConfirm={() => selectedUser && excluirUsuarioMutation.mutate(selectedUser.id)}
        title="Excluir Usuário"
        description={`ATENÇÃO: Tem certeza que deseja excluir o usuário ${selectedUser?.nome_completo || selectedUser?.email}? O acesso dele será bloqueado permanentemente e ele não poderá mais fazer login no sistema.`}
        confirmLabel="Excluir Usuário"
        cancelLabel="Cancelar"
      />
    </>
  );
}
