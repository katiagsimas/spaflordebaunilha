import { useEffect, useState } from 'react';
import { useGroup, type PermissionFlags } from '@/contexts/GroupContext';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Building2, Plus, UserPlus, Trash2, Settings, ChevronDown, ChevronUp, Shield, User, Crown, Loader2 } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  created_by_user_id: string | null;
  master_user_id: string | null;
}


interface UserLite {
  id: string;
  email: string;
  nome_completo: string | null;
}

interface GroupMember {
  id: string;
  user_id: string;
  group_id: string;
  role_group: 'ADMIN' | 'USER';
  permission_flags: PermissionFlags;
  is_active: boolean;
  email: string;
  nome_completo: string | null;
}

const ADMIN_FLAGS: PermissionFlags = {
  financeiro_view: true, financeiro_edit: true,
  metas_view: true, metas_edit: true,
  tarefas_view: true, tarefas_edit: true,
  cadastros_view: true, cadastros_edit: true,
  receitas_view: true, receitas_edit: true,
  encomendas_view: true, encomendas_edit: true,
  precificacao_view: true, precificacao_edit: true,
  admin_users_manage: true,
};

const USER_FLAGS: PermissionFlags = {
  financeiro_view: true, financeiro_edit: false,
  metas_view: true, metas_edit: false,
  tarefas_view: true, tarefas_edit: false,
  cadastros_view: true, cadastros_edit: false,
  receitas_view: true, receitas_edit: false,
  encomendas_view: true, encomendas_edit: false,
  precificacao_view: true, precificacao_edit: false,
  admin_users_manage: false,
};

const PERMISSION_LABELS: { key: keyof PermissionFlags; label: string }[] = [
  { key: 'financeiro_view', label: 'Financeiro — Visualizar' },
  { key: 'financeiro_edit', label: 'Financeiro — Editar' },
  { key: 'cadastros_view', label: 'Cadastros — Visualizar' },
  { key: 'cadastros_edit', label: 'Cadastros — Editar' },
  { key: 'receitas_view', label: 'Receitas — Visualizar' },
  { key: 'receitas_edit', label: 'Receitas — Editar' },
  { key: 'encomendas_view', label: 'Encomendas — Visualizar' },
  { key: 'encomendas_edit', label: 'Encomendas — Editar' },
  { key: 'precificacao_view', label: 'Precificação — Visualizar' },
  { key: 'precificacao_edit', label: 'Precificação — Editar' },
  { key: 'metas_view', label: 'Metas — Visualizar' },
  { key: 'metas_edit', label: 'Metas — Editar' },
  { key: 'tarefas_view', label: 'Tarefas — Visualizar' },
  { key: 'tarefas_edit', label: 'Tarefas — Editar' },
  { key: 'admin_users_manage', label: 'Gerenciar Usuários do Grupo' },
];

export default function GruposManager() {
  const { isMother, refreshGroups } = useGroup();
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<UserLite[]>([]);
  const [members, setMembers] = useState<Record<string, GroupMember[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [showAddUserToGroupDialog, setShowAddUserToGroupDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'USER'>('USER');
  const [editingMember, setEditingMember] = useState<GroupMember | null>(null);

  // Criação de novo membro a partir do grupo
  const [addMode, setAddMode] = useState<'novo' | 'existente'>('novo');
  const [creatingMember, setCreatingMember] = useState(false);
  const [novoEmail, setNovoEmail] = useState('');
  const [novoNome, setNovoNome] = useState('');

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

      setUsers((profilesData || []) as UserLite[]);

      const { data: roles } = await supabase
        .from('user_group_roles')
        .select('*');

      const profileMap = new Map((profilesData || []).map((p) => [p.id, p]));
      const grouped: Record<string, GroupMember[]> = {};
      (roles || []).forEach((r) => {
        const p = profileMap.get(r.user_id);
        const m: GroupMember = {
          id: r.id,
          user_id: r.user_id,
          group_id: r.group_id,
          role_group: r.role_group as 'ADMIN' | 'USER',
          permission_flags: r.permission_flags as unknown as PermissionFlags,
          is_active: r.is_active,
          email: p?.email || '—',
          nome_completo: p?.nome_completo || null,
        };
        (grouped[r.group_id] ||= []).push(m);
      });
      setMembers(grouped);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar grupos');
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) { toast.error('Nome do grupo é obrigatório'); return; }
    try {
      // MOTHER cria grupo: ela mesma vira mestre por padrão (pode ser transferido depois).
      const { error } = await supabase
        .from('groups')
        .insert({
          name: newGroupName.trim(),
          created_by_user_id: user?.id,
          master_user_id: user?.id,
        } as any);
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
        .from('groups').update({ is_active: !group.is_active }).eq('id', group.id);
      if (error) throw error;
      toast.success(group.is_active ? 'Grupo desativado' : 'Grupo ativado');
      loadData();
      refreshGroups();
    } catch { toast.error('Erro ao atualizar grupo'); }
  };

  const handleAddUserToGroup = async () => {
    if (!selectedGroup || !selectedUserId) { toast.error('Selecione um usuário'); return; }
    try {
      const flags = selectedRole === 'ADMIN' ? ADMIN_FLAGS : USER_FLAGS;
      const { error } = await supabase.from('user_group_roles').upsert(
        {
          user_id: selectedUserId,
          group_id: selectedGroup.id,
          role_group: selectedRole,
          is_active: true,
          permission_flags: flags as any,
        },
        { onConflict: 'user_id,group_id' },
      );
      if (error) throw error;
      toast.success('Usuário adicionado ao grupo!');
      closeAddDialog();
      loadData();
    } catch (e: any) {
      toast.error('Erro ao adicionar usuário: ' + e.message);
    }
  };

  const handleCreateNewMember = async () => {
    if (!selectedGroup) return;
    if (!novoEmail.trim()) { toast.error('Email obrigatório'); return; }
    setCreatingMember(true);
    try {
      const { data, error } = await supabase.functions.invoke('criar-usuario', {
        body: {
          email: novoEmail.trim().toLowerCase(),
          nomeCompleto: novoNome.trim() || null,
          tipoUsuario: 'membro',
          groupId: selectedGroup.id,
          roleGroup: selectedRole,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao criar membro');
      toast.success('Membro criado e vinculado ao grupo. Email de acesso enviado.');
      closeAddDialog();
      loadData();
    } catch (e: any) {
      toast.error('Erro ao criar membro: ' + (e.message || ''));
    } finally {
      setCreatingMember(false);
    }
  };

  const closeAddDialog = () => {
    setShowAddUserToGroupDialog(false);
    setSelectedUserId('');
    setSelectedRole('USER');
    setNovoEmail('');
    setNovoNome('');
    setAddMode('novo');
  };


  const isMasterOfGroup = (member: GroupMember): boolean => {
    const g = groups.find((g) => g.id === member.group_id);
    return !!g && g.master_user_id === member.user_id;
  };

  const handleRemoveMember = async (member: GroupMember) => {
    if (isMasterOfGroup(member)) {
      toast.error('Não é possível remover o mestre do grupo. Transfira a mestria primeiro.');
      return;
    }
    if (!confirm(`Remover ${member.nome_completo || member.email} do grupo?`)) return;
    try {
      const { error } = await supabase.from('user_group_roles').delete().eq('id', member.id);
      if (error) throw error;
      toast.success('Usuário removido do grupo');
      loadData();
    } catch (e: any) {
      toast.error('Erro ao remover: ' + e.message);
    }
  };

  const handleToggleMemberActive = async (member: GroupMember) => {
    if (isMasterOfGroup(member)) {
      toast.error('Não é possível desativar o mestre do grupo.');
      return;
    }
    try {
      const { error } = await supabase
        .from('user_group_roles')
        .update({ is_active: !member.is_active })
        .eq('id', member.id);
      if (error) throw error;
      toast.success(member.is_active ? 'Membro desativado' : 'Membro ativado');
      loadData();
    } catch { toast.error('Erro ao atualizar membro'); }
  };

  const handleChangeRole = async (member: GroupMember, newRole: 'ADMIN' | 'USER') => {
    if (isMasterOfGroup(member) && newRole !== 'ADMIN') {
      toast.error('O mestre do grupo deve permanecer como ADMIN.');
      return;
    }
    try {
      const flags = newRole === 'ADMIN' ? ADMIN_FLAGS : USER_FLAGS;
      const { error } = await supabase
        .from('user_group_roles')
        .update({ role_group: newRole, permission_flags: flags as any })
        .eq('id', member.id);
      if (error) throw error;
      toast.success('Papel atualizado');
      loadData();
    } catch (e: any) {
      toast.error('Erro ao atualizar papel: ' + e.message);
    }
  };


  const handleTogglePermission = async (member: GroupMember, key: keyof PermissionFlags) => {
    try {
      const newFlags = { ...member.permission_flags, [key]: !member.permission_flags?.[key] };
      const { error } = await supabase
        .from('user_group_roles')
        .update({ permission_flags: newFlags as any })
        .eq('id', member.id);
      if (error) throw error;
      // refresh local
      setMembers((prev) => {
        const list = [...(prev[member.group_id] || [])];
        const idx = list.findIndex((m) => m.id === member.id);
        if (idx >= 0) list[idx] = { ...list[idx], permission_flags: newFlags };
        return { ...prev, [member.group_id]: list };
      });
      if (editingMember?.id === member.id) setEditingMember({ ...editingMember, permission_flags: newFlags });
    } catch (e: any) {
      toast.error('Erro ao atualizar permissão: ' + e.message);
    }
  };

  if (!isMother) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold">Grupos do Sistema</h2>
          <p className="text-sm text-muted-foreground">
            Cada grupo organiza os dados de uma única conta mestre.
          </p>
        </div>
        <Dialog open={showNewGroupDialog} onOpenChange={setShowNewGroupDialog}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Novo Grupo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Grupo</DialogTitle>
              <DialogDescription>Crie um novo grupo para organizar dados.</DialogDescription>
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
              <Button variant="outline" onClick={() => setShowNewGroupDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreateGroup}>Criar Grupo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => {
          return (
            <Card key={group.id} className={!group.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2 min-w-0">
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">{group.name}</span>
                  </CardTitle>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={group.is_active ? 'default' : 'secondary'}>
                      {group.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-xs">
                  Criado em {new Date(group.created_at).toLocaleDateString('pt-BR')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Grupo ativo</span>
                  <Switch
                    checked={group.is_active}
                    onCheckedChange={() => handleToggleGroupActive(group)}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
