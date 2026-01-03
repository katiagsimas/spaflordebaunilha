import { useState, useEffect } from 'react';
import { useGroup } from '@/contexts/GroupContext';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Building2, Plus, Users, Shield, Edit, Trash2, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Group {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  created_by_user_id: string | null;
}

interface UserWithRoles {
  id: string;
  email: string;
  nome_completo: string | null;
  is_mother: boolean;
  groups: {
    group_id: string;
    group_name: string;
    role_group: string;
    is_active: boolean;
  }[];
}

export default function Governanca() {
  const { isMother, refreshGroups } = useGroup();
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [showAddUserToGroupDialog, setShowAddUserToGroupDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  
  // Form states
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'USER'>('USER');

  useEffect(() => {
    if (isMother) {
      loadData();
    }
  }, [isMother]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar todos os grupos
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .order('name');
      
      if (groupsError) throw groupsError;
      setGroups(groupsData || []);

      // Carregar todos os usuários com seus papéis
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, nome_completo');
      
      if (profilesError) throw profilesError;

      // Carregar papéis globais
      const { data: globalRoles } = await supabase
        .from('user_global_roles')
        .select('user_id')
        .eq('is_active', true);

      // Carregar papéis de grupo
      const { data: groupRoles } = await supabase
        .from('user_group_roles')
        .select(`
          user_id,
          group_id,
          role_group,
          is_active,
          group:groups(name)
        `);

      // Mapear usuários com seus papéis
      const usersWithRoles: UserWithRoles[] = (profilesData || []).map(profile => {
        const userGlobalRole = globalRoles?.find(r => r.user_id === profile.id);
        const userGroupRoles = groupRoles?.filter(r => r.user_id === profile.id) || [];
        
        return {
          id: profile.id,
          email: profile.email,
          nome_completo: profile.nome_completo,
          is_mother: !!userGlobalRole,
          groups: userGroupRoles.map(r => ({
            group_id: r.group_id,
            group_name: (r.group as any)?.name || 'Desconhecido',
            role_group: r.role_group,
            is_active: r.is_active,
          })),
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Nome do grupo é obrigatório');
      return;
    }

    try {
      const { error } = await supabase
        .from('groups')
        .insert({
          name: newGroupName.trim(),
          created_by_user_id: user?.id,
        });

      if (error) throw error;

      toast.success('Grupo criado com sucesso!');
      setNewGroupName('');
      setShowNewGroupDialog(false);
      loadData();
      refreshGroups();
    } catch (error: any) {
      console.error('Erro ao criar grupo:', error);
      toast.error('Erro ao criar grupo: ' + error.message);
    }
  };

  const handleToggleGroupActive = async (group: Group) => {
    try {
      const { error } = await supabase
        .from('groups')
        .update({ is_active: !group.is_active })
        .eq('id', group.id);

      if (error) throw error;

      toast.success(group.is_active ? 'Grupo desativado' : 'Grupo ativado');
      loadData();
      refreshGroups();
    } catch (error: any) {
      console.error('Erro ao atualizar grupo:', error);
      toast.error('Erro ao atualizar grupo');
    }
  };

  const handleAddUserToGroup = async () => {
    if (!selectedGroup || !selectedUserId) {
      toast.error('Selecione um usuário');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_group_roles')
        .upsert({
          user_id: selectedUserId,
          group_id: selectedGroup.id,
          role_group: selectedRole,
          is_active: true,
          permission_flags: selectedRole === 'ADMIN' ? {
            financeiro_view: true,
            financeiro_edit: true,
            metas_view: true,
            metas_edit: true,
            tarefas_view: true,
            tarefas_edit: true,
            cadastros_view: true,
            cadastros_edit: true,
            receitas_view: true,
            receitas_edit: true,
            encomendas_view: true,
            encomendas_edit: true,
            precificacao_view: true,
            precificacao_edit: true,
            admin_users_manage: true,
          } : {
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
          },
        }, { onConflict: 'user_id,group_id' });

      if (error) throw error;

      toast.success('Usuário adicionado ao grupo!');
      setShowAddUserToGroupDialog(false);
      setSelectedUserId('');
      setSelectedRole('USER');
      loadData();
    } catch (error: any) {
      console.error('Erro ao adicionar usuário:', error);
      toast.error('Erro ao adicionar usuário: ' + error.message);
    }
  };

  const handleRemoveUserFromGroup = async (userId: string, groupId: string) => {
    try {
      const { error } = await supabase
        .from('user_group_roles')
        .delete()
        .eq('user_id', userId)
        .eq('group_id', groupId);

      if (error) throw error;

      toast.success('Usuário removido do grupo');
      loadData();
    } catch (error: any) {
      console.error('Erro ao remover usuário:', error);
      toast.error('Erro ao remover usuário');
    }
  };

  const handleSetMother = async (userId: string, isMother: boolean) => {
    try {
      if (isMother) {
        // Remover papel de MOTHER
        const { error } = await supabase
          .from('user_global_roles')
          .delete()
          .eq('user_id', userId);
        
        if (error) throw error;
        toast.success('Papel de administrador do sistema removido');
      } else {
        // Adicionar papel de MOTHER
        const { error } = await supabase
          .from('user_global_roles')
          .insert({
            user_id: userId,
            role_global: 'MOTHER',
            is_active: true,
          });
        
        if (error) throw error;
        toast.success('Usuário definido como administrador do sistema');
      }
      loadData();
    } catch (error: any) {
      console.error('Erro ao atualizar papel global:', error);
      toast.error('Erro ao atualizar papel: ' + error.message);
    }
  };

  if (!isMother) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <PageHeader title="Governança" description="Acesso restrito" />
        <div className="flex-1 p-6">
          <PermissionGuard requireMother />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader 
        title="Governança do Sistema" 
        description="Administração de grupos e usuários"
      />

      <div className="flex-1 p-6">
        <Tabs defaultValue="groups" className="space-y-6">
          <TabsList>
            <TabsTrigger value="groups" className="gap-2">
              <Building2 className="h-4 w-4" />
              Grupos
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
          </TabsList>

          {/* Aba de Grupos */}
          <TabsContent value="groups" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Grupos do Sistema</h2>
              <Dialog open={showNewGroupDialog} onOpenChange={setShowNewGroupDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Grupo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Grupo</DialogTitle>
                    <DialogDescription>
                      Crie um novo grupo para organizar usuários e dados.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="groupName">Nome do Grupo</Label>
                      <Input
                        id="groupName"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Ex: Minha Confeitaria"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewGroupDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateGroup}>
                      Criar Grupo
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <Card key={group.id} className={!group.is_active ? 'opacity-60' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {group.name}
                      </CardTitle>
                      <Badge variant={group.is_active ? 'default' : 'secondary'}>
                        {group.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Criado em {new Date(group.created_at).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Switch
                        checked={group.is_active}
                        onCheckedChange={() => handleToggleGroupActive(group)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSelectedGroup(group);
                        setShowAddUserToGroupDialog(true);
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Adicionar Usuário
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Aba de Usuários */}
          <TabsContent value="users" className="space-y-4">
            <h2 className="text-lg font-semibold">Usuários do Sistema</h2>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Papel Global</TableHead>
                    <TableHead>Grupos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{u.nome_completo || 'Sem nome'}</p>
                          <p className="text-sm text-muted-foreground">{u.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.is_mother ? (
                          <Badge variant="default" className="gap-1">
                            <Shield className="h-3 w-3" />
                            MOTHER
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {u.groups.length === 0 ? (
                            <span className="text-muted-foreground text-sm">Nenhum grupo</span>
                          ) : (
                            u.groups.map((g, idx) => (
                              <Badge 
                                key={idx} 
                                variant={g.role_group === 'ADMIN' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {g.group_name} ({g.role_group})
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetMother(u.id, u.is_mother)}
                          disabled={u.id === user?.id}
                        >
                          {u.is_mother ? 'Remover MOTHER' : 'Definir MOTHER'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog para adicionar usuário ao grupo */}
        <Dialog open={showAddUserToGroupDialog} onOpenChange={setShowAddUserToGroupDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Usuário ao Grupo</DialogTitle>
              <DialogDescription>
                Adicione um usuário ao grupo "{selectedGroup?.name}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Usuário</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter(u => !u.groups.some(g => g.group_id === selectedGroup?.id))
                      .map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.nome_completo || u.email}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Papel no Grupo</Label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as 'ADMIN' | 'USER')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="USER">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddUserToGroupDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddUserToGroup}>
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
