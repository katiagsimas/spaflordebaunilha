import { useEffect, useState } from 'react';
import { useGroup } from '@/contexts/GroupContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Building2, Plus, UserPlus } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  created_by_user_id: string | null;
}

interface UserLite {
  id: string;
  email: string;
  nome_completo: string | null;
  group_ids: string[];
}

export default function GruposManager() {
  const { isMother, refreshGroups } = useGroup();
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<UserLite[]>([]);
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [showAddUserToGroupDialog, setShowAddUserToGroupDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'USER'>('USER');

  useEffect(() => {
    if (isMother) loadData();
  }, [isMother]);

  const loadData = async () => {
    try {
      const { data: groupsData } = await supabase.from('groups').select('*').order('name');
      setGroups(groupsData || []);

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, nome_completo');

      const { data: groupRoles } = await supabase
        .from('user_group_roles')
        .select('user_id, group_id');

      setUsers(
        (profilesData || []).map((p) => ({
          id: p.id,
          email: p.email,
          nome_completo: p.nome_completo,
          group_ids: (groupRoles || [])
            .filter((r) => r.user_id === p.id)
            .map((r) => r.group_id),
        })),
      );
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar grupos');
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
        .insert({ name: newGroupName.trim(), created_by_user_id: user?.id });
      if (error) throw error;
      toast.success('Grupo criado com sucesso!');
      setNewGroupName('');
      setShowNewGroupDialog(false);
      loadData();
      refreshGroups();
    } catch (e: any) {
      toast.error('Erro ao criar grupo: ' + e.message);
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
    } catch {
      toast.error('Erro ao atualizar grupo');
    }
  };

  const handleAddUserToGroup = async () => {
    if (!selectedGroup || !selectedUserId) {
      toast.error('Selecione um usuário');
      return;
    }
    try {
      const flags =
        selectedRole === 'ADMIN'
          ? {
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
            }
          : {
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

      const { error } = await supabase.from('user_group_roles').upsert(
        {
          user_id: selectedUserId,
          group_id: selectedGroup.id,
          role_group: selectedRole,
          is_active: true,
          permission_flags: flags,
        },
        { onConflict: 'user_id,group_id' },
      );
      if (error) throw error;
      toast.success('Usuário adicionado ao grupo!');
      setShowAddUserToGroupDialog(false);
      setSelectedUserId('');
      setSelectedRole('USER');
      loadData();
    } catch (e: any) {
      toast.error('Erro ao adicionar usuário: ' + e.message);
    }
  };

  if (!isMother) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Grupos do Sistema</h2>
          <p className="text-sm text-muted-foreground">
            Grupos organizam acessos internos. Cada usuário pertence a um grupo com um papel (ADMIN ou USER).
          </p>
        </div>
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
              <DialogDescription>Crie um novo grupo para organizar usuários e dados.</DialogDescription>
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
              <Button onClick={handleCreateGroup}>Criar Grupo</Button>
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
                    .filter((u) => !u.group_ids.includes(selectedGroup?.id || ''))
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
            <Button onClick={handleAddUserToGroup}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
