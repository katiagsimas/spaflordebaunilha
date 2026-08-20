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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, Users, Shield, User, MoreVertical, Edit, UserX, Trash2, Search, UserCheck, Clock, AlertCircle, Download, UserPlus, KeyRound, CheckCircle2, History, RefreshCcw } from 'lucide-react';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { EditarUsuarioDialog } from '@/components/admin/EditarUsuarioDialog';
import { CriarUsuarioDialog } from '@/components/admin/CriarUsuarioDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from '@/lib/xlsxShim';
import { Building2 } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  nome_completo: string | null;
  nome_confeitaria: string | null;
  created_at: string;
  ativo?: boolean;
  last_login?: string | null;
  origem_criacao?: string | null;
  tem_dados?: boolean;
  owner_group_id?: string | null;
}

export default function Usuarios() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin, isLoading: isLoadingAdmin } = useIsAdmin();
  
  const [showCriarDialog, setShowCriarDialog] = useState(false);
  const [showEditarDialog, setShowEditarDialog] = useState(false);
  const [showDesabilitarDialog, setShowDesabilitarDialog] = useState(false);
  const [showExcluirDialog, setShowExcluirDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedUserRole, setSelectedUserRole] = useState<string>('user');
  const [buscaEmail, setBuscaEmail] = useState("");
  const [filtroCard, setFiltroCard] = useState<string | null>('ativos');
  const [porPagina] = useState(50);
  const [estatisticas, setEstatisticas] = useState({ total: 0, ativos: 0, inativos: 0 });

  const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (profilesError) throw profilesError;
      return profilesData as UserProfile[];
    },
    enabled: isAdmin,
  });

  const { data: groupsData } = useQuery({
    queryKey: ['admin-all-groups'],
    queryFn: async () => {
      const { data, error } = await supabase.from('groups').select('id, name, master_user_id');
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const groupsMap = groupsData?.reduce((acc, g) => {
    acc[g.id] = g;
    return acc;
  }, {} as Record<string, any>) || {};

  const { data: rolesData } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_global_roles').select('*');
      if (error) throw error;
      return (data || []).map((r) => ({
        user_id: r.user_id,
        role: r.role_global === 'MOTHER' ? 'admin' : String(r.role_global).toLowerCase(),
      }));
    },
    enabled: isAdmin,
  });

  const rolesByUser = rolesData?.reduce((acc, item) => {
    if (!acc[item.user_id]) acc[item.user_id] = [];
    acc[item.user_id].push(item.role);
    return acc;
  }, {} as Record<string, string[]>) || {};

  const profilesComRoles = profiles?.map(u => {
    const roles = rolesByUser[u.id] || [];
    let role = 'user';
    if (roles.includes('admin')) role = 'mother';
    return { ...u, role };
  });

  useEffect(() => {
    if (!profilesComRoles) return;
    setEstatisticas({
      total: profilesComRoles.length,
      ativos: profilesComRoles.filter(u => u.ativo !== false).length,
      inativos: profilesComRoles.filter(u => u.ativo === false).length,
    });
  }, [profilesComRoles]);

  const usuariosFiltrados = (profilesComRoles || [])?.filter(usuario => {
    const matchEmail = buscaEmail === "" || 
      usuario.email.toLowerCase().includes(buscaEmail.toLowerCase()) ||
      usuario.nome_completo?.toLowerCase().includes(buscaEmail.toLowerCase());
    const isAtivo = usuario.ativo !== false;
    if (filtroCard === 'ativos') return matchEmail && isAtivo;
    if (filtroCard === 'inativos') return matchEmail && !isAtivo;
    return matchEmail;
  });

  const exportarParaExcel = () => {
    const dadosExportacao = usuariosFiltrados.map(usuario => ({
      'Email': usuario.email,
      'Nome': usuario.nome_completo || 'N/A',
      'Status': usuario.ativo !== false ? 'Ativo' : 'Inativo',
      'Permissão': usuario.role === 'mother' ? 'Administrador' : 'Usuário',
    }));
    const ws = XLSX.utils.json_to_sheet(dadosExportacao);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuários');
    XLSX.writeFile(wb, `usuarios-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const alterarStatusMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string, ativo: boolean }) => {
      const { error } = await supabase.from('profiles').update({ ativo }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Status atualizado.' });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });

  const excluirUsuarioMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('profiles').update({ ativo: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Bloqueado', description: 'Acesso bloqueado.' });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowExcluirDialog(false);
    }
  });

  if (!isLoadingAdmin && !isAdmin) {
    navigate('/dashboard');
    return null;
  }

  if (isLoadingProfiles) return <LoadingState />;

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <PageHeader title="Gestão de Usuários" />
        <div className="flex gap-2">
          <Button onClick={() => setShowCriarDialog(true)}><UserPlus className="mr-2 h-4 w-4" /> Novo Mestre</Button>
          <Button variant="outline" onClick={exportarParaExcel}><Download className="mr-2 h-4 w-4" /> Exportar</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer" onClick={() => setFiltroCard('total')}>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{estatisticas.total}</div></CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setFiltroCard('ativos')}>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Ativos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{estatisticas.ativos}</div></CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setFiltroCard('inativos')}>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Inativos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{estatisticas.inativos}</div></CardContent>
        </Card>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Buscar por nome ou email..." value={buscaEmail} onChange={e => setBuscaEmail(e.target.value)} />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Grupo</TableHead>
            <TableHead>Permissão</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usuariosFiltrados.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.nome_completo || '-'}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.owner_group_id ? (groupsMap[u.owner_group_id]?.name || '-') : '-'}</TableCell>
              <TableCell><Badge variant={u.role === 'mother' ? 'destructive' : 'secondary'}>{u.role === 'mother' ? 'Admin' : 'Usuário'}</Badge></TableCell>
              <TableCell><Badge variant={u.ativo !== false ? 'default' : 'outline'}>{u.ativo !== false ? 'Ativo' : 'Inativo'}</Badge></TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setSelectedUser(u); setSelectedUserRole(u.role); setShowEditarDialog(true); }}>
                      <Edit className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => alterarStatusMutation.mutate({ id: u.id, ativo: !u.ativo })}>
                      {u.ativo !== false ? <><UserX className="mr-2 h-4 w-4" /> Desabilitar</> : <><UserPlus className="mr-2 h-4 w-4" /> Reabilitar</>}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedUser(u); setShowExcluirDialog(true); }}>
                      <Trash2 className="mr-2 h-4 w-4" /> Bloquear
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <CriarUsuarioDialog open={showCriarDialog} onOpenChange={setShowCriarDialog} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['admin-users'] })} />
      <EditarUsuarioDialog open={showEditarDialog} onOpenChange={setShowEditarDialog} userId={selectedUser?.id || null} userData={selectedUser} userRole={selectedUserRole} />
      <ConfirmDialog open={showDesabilitarDialog} onOpenChange={setShowDesabilitarDialog} title="Confirmar" description="Mudar status do usuário?" onConfirm={() => selectedUser && alterarStatusMutation.mutate({ id: selectedUser.id, ativo: !selectedUser.ativo })} />
      <ConfirmDialog open={showExcluirDialog} onOpenChange={setShowExcluirDialog} title="Bloquear Acesso" description="Deseja bloquear o acesso permanentemente?" onConfirm={() => selectedUser && excluirUsuarioMutation.mutate(selectedUser.id)} />
    </div>
  );
}
