import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/PageHeader';
import { BackButton } from '@/components/BackButton';
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
import { Loader2, Users, Shield, User, MoreVertical, Edit, UserX, Trash2, Search, UserCheck, Clock, AlertCircle, Download, UserPlus, KeyRound, CheckCircle2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';

import { EditarUsuarioDialog } from '@/components/admin/EditarUsuarioDialog';
import { AlunasImersaoExpirando } from '@/components/admin/AlunasImersaoExpirando';
import { getPlanoLabel } from '@/lib/planos';
import { CriarUsuarioDialog } from '@/components/admin/CriarUsuarioDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from '@/lib/xlsxShim';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2 } from 'lucide-react';
import GruposManager from '@/components/admin/GruposManager';

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
  last_login?: string | null;
  origem_criacao?: string | null;
  tem_dados?: boolean;
  onboarding_concluido?: boolean;
  onboarding_concluido_at?: string | null;
  onboarding_step_status?: any;
  owner_group_id?: string | null;
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
  const [filtroCard, setFiltroCard] = useState<string | null>('ativos');
  const [porPagina, setPorPagina] = useState(10);
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    ativos: 0,
    inativos: 0,
    baseAnual: 0,
    
    negocioMensal: 0,
    negocioAnual: 0,
  });

  // Verificar se é admin antes de carregar dados
  const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, nome_completo, nome_confeitaria, created_at, ativo, plano_id, plano_inicio, plano_fim, plano_tipo, last_login, origem_criacao, onboarding_concluido, onboarding_concluido_at, onboarding_step_status, owner_group_id')
        .order('created_at', { ascending: false });
      
      if (profilesError) throw profilesError;

      // Usando uma query simples para identificar usuários com ingredientes
      // Como o TS reclamou do campo, vamos buscar sem filtro de coluna específico se necessário
      const { data: ingredientesData } = await supabase
        .from('ingredientes')
        .select('*');

      // Mapeia IDs únicos de usuários que possuem dados
      const usersWithData = new Set((ingredientesData as any[])?.map(i => i.user_id) || []);

      return profilesData.map(p => ({
        ...p,
        tem_dados: usersWithData.has(p.id)
      })) as UserProfile[];
    },
    enabled: isAdmin,
  });

  // Buscar todos os grupos para mapeamento
  const { data: groupsData } = useQuery({
    queryKey: ['admin-all-groups'],
    queryFn: async () => {
      const { data, error } = await supabase.from('groups').select('id, name, master_user_id');
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Mapear grupos por ID
  const groupsMap = groupsData?.reduce((acc, g) => {
    acc[g.id] = g;
    return acc;
  }, {} as Record<string, { id: string; name: string; master_user_id: string | null }>) || {};

  // Buscar todos os vínculos de usuários com grupos
  const { data: userGroupRolesData } = useQuery({
    queryKey: ['admin-user-group-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_group_roles').select('user_id, group_id, role_group');
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Mapear grupo principal por usuário (considerando o primeiro encontrado ou o owner_group_id)
  const userGroupMap = userGroupRolesData?.reduce((acc, ugr) => {
    if (!acc[ugr.user_id]) {
      acc[ugr.user_id] = ugr.group_id;
    }
    return acc;
  }, {} as Record<string, string>) || {};

  // Buscar roles globais de todos os usuários (sistema novo)
  const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_global_roles')
        .select('user_id, role_global, is_active');
      
      if (error) throw error;
      // Mapear para o formato legado (role minúscula) para manter compatibilidade
      // MOTHER (system admin) -> 'admin'
      return (data || [])
        .filter((r) => r.is_active)
        .map((r) => ({
          user_id: r.user_id,
          role: r.role_global === 'MOTHER' ? 'admin' : String(r.role_global).toLowerCase(),
        }));
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

  // Manter todos os perfis na listagem, mas identificar os admins e mothers
  const profilesComRoles = profiles?.map(u => {
    const roles = rolesByUser[u.id] || [];
    let role = 'user';
    if (roles.includes('admin')) {
      // No sistema legado mapeado, 'admin' é MOTHER
      role = 'mother';
    } else if (roles.includes('moderator')) {
      role = 'moderator';
    }
    return {
      ...u,
      role
    };
  });

  // Carregar estatísticas
  useEffect(() => {
    if (!profilesComRoles) return;
    
    // Filtrar apenas usuários para as estatísticas de plano (se desejado, ou manter todos)
    const apenasUsuarios = profilesComRoles.filter(u => u.role === 'user');

    setEstatisticas({
      total: profilesComRoles.length,
      ativos: profilesComRoles.filter(u => u.ativo !== false).length,
      inativos: profilesComRoles.filter(u => u.ativo === false).length,
      baseAnual: apenasUsuarios.filter(u => u.ativo !== false && (!u.plano_id || u.plano_id === 'base')).length,
      negocioMensal: apenasUsuarios.filter(u => u.ativo !== false && u.plano_id === 'negocio' && u.plano_tipo === 'mensal').length,
      negocioAnual: apenasUsuarios.filter(u => u.ativo !== false && u.plano_id === 'negocio' && u.plano_tipo === 'anual').length,
    });
  }, [profilesComRoles]);

  // Filtrar usuários
  const usuariosFiltrados = (profilesComRoles || [])?.filter(usuario => {
    const matchEmail = buscaEmail === "" || 
      usuario.email.toLowerCase().includes(buscaEmail.toLowerCase()) ||
      usuario.nome_completo?.toLowerCase().includes(buscaEmail.toLowerCase()) ||
      usuario.nome_confeitaria?.toLowerCase().includes(buscaEmail.toLowerCase());
    
    if (!filtroCard) return matchEmail && usuario.ativo !== false;

    const isAtivo = usuario.ativo !== false;
    const isBase = !usuario.plano_id || usuario.plano_id === 'base';
    const isNegocio = usuario.plano_id === 'negocio';

    switch (filtroCard) {
      case 'total': return matchEmail;
      case 'ativos': return matchEmail && isAtivo;
      case 'inativos': return matchEmail && !isAtivo;
      case 'baseAnual': return matchEmail && isAtivo && isBase;
      case 'negocioMensal': return matchEmail && isAtivo && isNegocio && usuario.plano_tipo === 'mensal';
      case 'negocioAnual': return matchEmail && isAtivo && isNegocio && usuario.plano_tipo === 'anual';
      default: return matchEmail;
    }
  }) || [];

  // Aplicar paginação
  const usuariosPaginados = usuariosFiltrados.slice(0, porPagina);

  // Função de exportar para Excel
  const exportarParaExcel = () => {
    const dadosExportacao = usuariosFiltrados.map(usuario => {
      const isAdmin = usuario.role === 'admin';
      
      const groupId = usuario.owner_group_id || userGroupMap[usuario.id];
      const group = groupId ? groupsMap[groupId] : null;
      
      return {
        'Email': usuario.email,
        'Nome Completo': usuario.nome_completo || 'N/A',
        'Grupo': group?.name || 'N/A',
        'Status': usuario.ativo !== false ? 'Ativo' : 'Inativo',
        'Permissão': isAdmin ? 'Administrador' : 'Usuário',
        'Plano': getPlanoLabel(usuario.plano_id),
        'Início do Plano': usuario.plano_inicio ? new Date(usuario.plano_inicio + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A',
        'Expiração do Plano': usuario.plano_fim ? new Date(usuario.plano_fim + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A',
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

  const handleResetarSenha = async (profile: any) => {
    if (!confirm(`Deseja resetar a senha de ${profile.email}? Um e-mail de recuperação será enviado.`)) return;
    try {
      const { error } = await supabase.functions.invoke('enviar-recuperacao-senha', {
        body: { email: profile.email }
      });
      if (error) throw error;
      toast({
        title: '✅ E-mail enviado!',
        description: `Link de recuperação enviado para ${profile.email}.`,
      });
    } catch (err: any) {
      toast({
        title: '❌ Erro',
        description: 'Não foi possível enviar o e-mail de recuperação.',
        variant: 'destructive',
      });
    }
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
    setFiltroCard(null);
  };

  // Redirecionar se não for admin
  if (!isLoadingAdmin && !isAdmin) {
    navigate('/dashboard');
    return null;
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'mother':
        return 'destructive';
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
      case 'mother':
        return <Shield className="h-3 w-3" />;
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
      case 'mother':
        return 'Mother';
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
      <div className="container mx-auto px-6 pt-1 pb-6 space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Usuários do Sistema"
            description="Gerencie todos os usuários cadastrados, suas permissões e a estrutura de grupos"
            backButton={<BackButton to="/governanca" />}
          />
        </div>

        <Tabs defaultValue="usuarios" className="space-y-6">
          <TabsList>
            <TabsTrigger value="usuarios" className="gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="grupos" className="gap-2">
              <Building2 className="h-4 w-4" />
              Grupos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usuarios" className="space-y-6">

        <AlunasImersaoExpirando />




        {/* Dashboard de Resumo */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-9 gap-1.5">
          {[
            { key: 'ativos', label: 'Ativos', value: estatisticas.ativos, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950' },
            { key: 'inativos', label: 'Inativos', value: estatisticas.inativos, icon: UserX, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950' },
            { key: 'total', label: 'Total', value: estatisticas.total, icon: Users, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-950' },
            { key: 'baseAnual', label: 'Lite Anual', value: estatisticas.baseAnual, icon: User, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950' },
            
            { key: 'negocioMensal', label: 'Business Mensal', value: estatisticas.negocioMensal, icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
            { key: 'negocioAnual', label: 'Business Anual', value: estatisticas.negocioAnual, icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
          ].map((item) => (
            <Card
              key={item.label}
              onClick={() => setFiltroCard(filtroCard === item.key ? null : item.key)}
              className={`cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-2 border-l-[#D89B8C] group ${filtroCard === item.key ? 'ring-2 ring-[#E7A1AF] bg-[#E7A1AF]/15' : ''}`}
            >
              <CardHeader className="p-2">
                <div className="flex flex-col items-center gap-1 text-center">
                  <div className={`w-6 h-6 rounded-md ${item.color} ${item.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-3 w-3" />
                  </div>
                  <CardTitle className="text-[10px] leading-tight mb-0">{item.label}</CardTitle>
                  <CardDescription className={`text-lg font-bold ${item.color}`}>
                    {item.value}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Criar Usuário */}
        <div className="flex justify-start">
          <Button onClick={() => setShowCriarDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Criar Usuário
          </Button>
        </div>

        {/* Busca e Filtros */}
        <div className="flex flex-col gap-2">
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
            </div>
          </div>
          {/* Botão Limpar Filtros */}
          {(buscaEmail || filtroCard !== null) && (
            <button
              onClick={limparFiltros}
              className="text-xs text-muted-foreground hover:text-foreground underline self-start"
            >
              Limpar filtros
            </button>
          )}
        </div>

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
                    <TableHead>Grupo</TableHead>
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
                    
                    // Lógica de grupo
                    const groupId = profile.owner_group_id || userGroupMap[profile.id];
                    const group = groupId ? groupsMap[groupId] : null;
                    const groupName = group?.name || '-';
                    
                    // Lógica de onboarding: apenas masters de grupos (que não sejam Mother/Admin) passam por onboarding
                    // Se o usuário não tem grupo ou é o master do seu próprio grupo, ele precisa de onboarding
                    const isMaster = !group || group.master_user_id === profile.id;
                    const isMotherOrAdmin = profile.role === 'mother' || profile.role === 'admin';
                    
                    // Um usuário é considerado "Membro" se ele está em um grupo e NÃO é o master dele
                    const isMember = group && group.master_user_id !== profile.id;
                    const showOnboardingBadges = !isMotherOrAdmin && !isMember;

                    return (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold">{profile.nome_completo || '-'}</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {showOnboardingBadges && (
                                <>
                                  {profile.onboarding_concluido ? (
                                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-green-50 text-green-700 border-green-200">
                                      <CheckCircle2 className="h-2 w-2 mr-0.5" />
                                      ONBOARDING OK
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-amber-50 text-amber-700 border-amber-200">
                                      <Clock className="h-2 w-2 mr-0.5" />
                                      ONBOARDING PENDENTE
                                    </Badge>
                                  )}
                                  {!profile.tem_dados && (
                                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-orange-50 text-orange-700 border-orange-200">
                                      <AlertCircle className="h-2 w-2 mr-0.5" />
                                      SEM CADASTROS
                                    </Badge>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{profile.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {group ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1.5 py-1">
                                <Building2 className="h-3 w-3" />
                                {groupName}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-body text-xs">
                            {profile.plano_id === 'negocio' ? 'Business' : profile.plano_id === 'aluna_imersao' ? 'Imersão' : profile.plano_id === 'controle' ? 'Controle' : 'Lite'}
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
                          {profile.last_login ? (
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {formatDistanceToNow(new Date(profile.last_login), {
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
                              <DropdownMenuItem 
                                onClick={() => handleResetarSenha(profile)}
                              >
                                <KeyRound className="mr-2 h-4 w-4" />
                                Resetar Senha
                              </DropdownMenuItem>
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
          </TabsContent>

          <TabsContent value="grupos" className="space-y-6">
            <GruposManager />
          </TabsContent>
        </Tabs>
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
