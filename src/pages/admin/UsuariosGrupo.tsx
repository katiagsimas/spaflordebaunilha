import { useState, useEffect } from 'react';
import { useGroup, PermissionFlags } from '@/contexts/GroupContext';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Users, Plus, Edit, UserX, Shield } from 'lucide-react';

interface GroupUser {
  id: string;
  user_id: string;
  role_group: 'ADMIN' | 'USER';
  permission_flags: PermissionFlags;
  is_active: boolean;
  profile: {
    email: string;
    nome_completo: string | null;
  };
}

const DEFAULT_PERMISSIONS: PermissionFlags = {
  financeiro_view: true,
  financeiro_edit: false,
  metas_view: true,
  metas_edit: false,
  tarefas_view: true,
  tarefas_edit: false,
  cadastros_view: true,
  cadastros_edit: false,
  receitas_view: true,
  receitas_edit: false,
  encomendas_view: true,
  encomendas_edit: false,
  precificacao_view: true,
  precificacao_edit: false,
  admin_users_manage: false,
};

const PERMISSION_LABELS: Record<keyof PermissionFlags, { label: string; category: string }> = {
  financeiro_view: { label: 'Visualizar Financeiro', category: 'Financeiro' },
  financeiro_edit: { label: 'Editar Financeiro', category: 'Financeiro' },
  metas_view: { label: 'Visualizar Metas', category: 'Metas' },
  metas_edit: { label: 'Editar Metas', category: 'Metas' },
  tarefas_view: { label: 'Visualizar Tarefas', category: 'Tarefas' },
  tarefas_edit: { label: 'Editar Tarefas', category: 'Tarefas' },
  cadastros_view: { label: 'Visualizar Cadastros', category: 'Cadastros' },
  cadastros_edit: { label: 'Editar Cadastros', category: 'Cadastros' },
  receitas_view: { label: 'Visualizar Receitas', category: 'Receitas' },
  receitas_edit: { label: 'Editar Receitas', category: 'Receitas' },
  encomendas_view: { label: 'Visualizar Encomendas', category: 'Encomendas' },
  encomendas_edit: { label: 'Editar Encomendas', category: 'Encomendas' },
  precificacao_view: { label: 'Visualizar Precificação', category: 'Precificação' },
  precificacao_edit: { label: 'Editar Precificação', category: 'Precificação' },
  admin_users_manage: { label: 'Gerenciar Usuários', category: 'Administração' },
};

export default function UsuariosGrupo() {
  const { activeGroupId, activeGroup, isGroupAdmin } = useGroup();
  const [users, setUsers] = useState<GroupUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<GroupUser | null>(null);
  const [editPermissions, setEditPermissions] = useState<PermissionFlags>(DEFAULT_PERMISSIONS);

  useEffect(() => {
    if (activeGroupId && isGroupAdmin()) {
      loadUsers();
    }
  }, [activeGroupId]);

  const loadUsers = async () => {
    if (!activeGroupId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_group_roles')
        .select(`
          id,
          user_id,
          role_group,
          permission_flags,
          is_active,
          profile:profiles(email, nome_completo)
        `)
        .eq('group_id', activeGroupId);

      if (error) throw error;

      const typedUsers: GroupUser[] = (data || []).map(u => ({
        ...u,
        role_group: u.role_group as 'ADMIN' | 'USER',
        permission_flags: u.permission_flags as unknown as PermissionFlags,
        profile: Array.isArray(u.profile) ? u.profile[0] : u.profile,
      }));

      setUsers(typedUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários do grupo');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: GroupUser) => {
    setSelectedUser(user);
    setEditPermissions(user.permission_flags || DEFAULT_PERMISSIONS);
    setShowEditDialog(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('user_group_roles')
        .update({
          permission_flags: JSON.parse(JSON.stringify(editPermissions)),
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast.success('Permissões atualizadas!');
      setShowEditDialog(false);
      loadUsers();
    } catch (error: any) {
      console.error('Erro ao atualizar permissões:', error);
      toast.error('Erro ao atualizar permissões');
    }
  };

  const handleToggleUserActive = async (user: GroupUser) => {
    try {
      const { error } = await supabase
        .from('user_group_roles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) throw error;

      toast.success(user.is_active ? 'Usuário desativado' : 'Usuário ativado');
      loadUsers();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário');
    }
  };

  const togglePermission = (key: keyof PermissionFlags) => {
    setEditPermissions(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Agrupar permissões por categoria
  const groupedPermissions = Object.entries(PERMISSION_LABELS).reduce((acc, [key, value]) => {
    if (!acc[value.category]) {
      acc[value.category] = [];
    }
    acc[value.category].push({ key: key as keyof PermissionFlags, label: value.label });
    return acc;
  }, {} as Record<string, { key: keyof PermissionFlags; label: string }[]>);

  if (!isGroupAdmin()) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <PageHeader title="Usuários do Grupo" description="Acesso restrito" />
        <div className="flex-1 p-6">
          <PermissionGuard requireAdmin />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader 
        title="Usuários do Grupo" 
        description={`Gerenciar usuários de ${activeGroup?.name || 'grupo'}`}
      />

      <PermissionGuard requireAdmin>
        <div className="flex-1 p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Membros do Grupo
              </CardTitle>
              <CardDescription>
                Gerencie os usuários e suas permissões neste grupo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className={!user.is_active ? 'opacity-50' : ''}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.profile?.nome_completo || 'Sem nome'}</p>
                          <p className="text-sm text-muted-foreground">{user.profile?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role_group === 'ADMIN' ? 'default' : 'secondary'}>
                          {user.role_group === 'ADMIN' ? (
                            <><Shield className="h-3 w-3 mr-1" /> Admin</>
                          ) : (
                            'Usuário'
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'outline' : 'destructive'}>
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {user.role_group === 'USER' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleUserActive(user)}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhum usuário encontrado neste grupo
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </PermissionGuard>

      {/* Dialog de edição de permissões */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Permissões</DialogTitle>
            <DialogDescription>
              Configure as permissões de {selectedUser?.profile?.nome_completo || selectedUser?.profile?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {Object.entries(groupedPermissions).map(([category, permissions]) => (
              <div key={category} className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">{category}</h4>
                <div className="grid grid-cols-2 gap-3">
                  {permissions.map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={editPermissions[key]}
                        onCheckedChange={() => togglePermission(key)}
                      />
                      <Label htmlFor={key} className="text-sm cursor-pointer">
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePermissions}>
              Salvar Permissões
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
