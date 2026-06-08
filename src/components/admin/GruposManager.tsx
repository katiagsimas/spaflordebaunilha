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
import { toast } from 'sonner';
import { Building2, Plus, UserPlus, Trash2, Settings, ChevronDown, ChevronUp, Shield, User, Crown } from 'lucide-react';

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
      setShowAddUserToGroupDialog(false);
      setSelectedUserId('');
      setSelectedRole('USER');
      loadData();
    } catch (e: any) {
      toast.error('Erro ao adicionar usuário: ' + e.message);
    }
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
            Cada grupo organiza usuários e dados. Clique em "Ver membros" para gerenciar papéis e permissões.
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
              <Button variant="outline" onClick={() => setShowNewGroupDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreateGroup}>Criar Grupo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => {
          const groupMembers = members[group.id] || [];
          const isOpen = !!expanded[group.id];
          return (
            <Card key={group.id} className={!group.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2 min-w-0">
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">{group.name}</span>
                  </CardTitle>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline">{groupMembers.length} {groupMembers.length === 1 ? 'membro' : 'membros'}</Badge>
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

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setExpanded((p) => ({ ...p, [group.id]: !p[group.id] }))}
                  >
                    {isOpen ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                    {isOpen ? 'Ocultar membros' : 'Ver membros'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedGroup(group);
                      setShowAddUserToGroupDialog(true);
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>

                {isOpen && (
                  <div className="border-t pt-3 space-y-2">
                    {groupMembers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-3">
                        Nenhum membro neste grupo ainda.
                      </p>
                    ) : (
                      groupMembers.map((m) => {
                        const isMaster = isMasterOfGroup(m);
                        return (
                        <div key={m.id} className={`border rounded-lg p-3 space-y-2 ${isMaster ? 'bg-cda-dourado/10 border-cda-dourado/40' : 'bg-muted/30'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {isMaster ? (
                                  <Crown className="h-4 w-4 text-cda-dourado shrink-0" />
                                ) : m.role_group === 'ADMIN' ? (
                                  <Shield className="h-4 w-4 text-primary shrink-0" />
                                ) : (
                                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                )}
                                <p className="font-medium text-sm truncate">
                                  {m.nome_completo || m.email}
                                </p>
                                {isMaster && (
                                  <Badge className="bg-cda-dourado text-cda-preto text-[10px]">Mestre</Badge>
                                )}
                              </div>
                              {m.nome_completo && (
                                <p className="text-xs text-muted-foreground truncate ml-6">{m.email}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Badge variant={m.is_active ? 'default' : 'secondary'} className="text-[10px]">
                                {m.is_active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                          </div>


                          <div className="flex flex-wrap gap-2 items-center">
                            <Select
                              value={m.role_group}
                              onValueChange={(v) => handleChangeRole(m, v as 'ADMIN' | 'USER')}
                            >
                              <SelectTrigger className="h-8 text-xs w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ADMIN">Administrador</SelectItem>
                                <SelectItem value="USER">Usuário</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => setEditingMember(m)}
                              disabled={m.role_group === 'ADMIN'}
                              title={m.role_group === 'ADMIN' ? 'Admins têm todas as permissões' : 'Editar permissões'}
                            >
                              <Settings className="h-3 w-3 mr-1" /> Permissões
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => handleToggleMemberActive(m)}
                            >
                              {m.is_active ? 'Desativar' : 'Ativar'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                              onClick={() => handleRemoveMember(m)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>

                          {m.role_group === 'USER' && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {PERMISSION_LABELS.filter((p) => m.permission_flags?.[p.key]).slice(0, 4).map((p) => (
                                <Badge key={p.key} variant="secondary" className="text-[10px]">
                                  {p.label}
                                </Badge>
                              ))}
                              {(() => {
                                const total = PERMISSION_LABELS.filter((p) => m.permission_flags?.[p.key]).length;
                                return total > 4 ? (
                                  <Badge variant="outline" className="text-[10px]">+{total - 4} mais</Badge>
                                ) : total === 0 ? (
                                  <Badge variant="outline" className="text-[10px]">Sem permissões</Badge>
                                ) : null;
                              })()}
                            </div>
                          )}
                        </div>
                        );
                      })

                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add user dialog */}
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
                    .filter((u) => !(members[selectedGroup?.id || '']?.some((m) => m.user_id === u.id)))
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
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador (todas as permissões)</SelectItem>
                  <SelectItem value="USER">Usuário (permissões granulares)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserToGroupDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddUserToGroup}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit permissions dialog */}
      <Dialog open={!!editingMember} onOpenChange={(o) => !o && setEditingMember(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Permissões de {editingMember?.nome_completo || editingMember?.email}</DialogTitle>
            <DialogDescription>
              Marque o que este usuário pode visualizar e editar dentro do grupo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2 max-h-[60vh] overflow-y-auto">
            {editingMember && PERMISSION_LABELS.map((p) => (
              <div key={p.key} className="flex items-center justify-between py-1.5 border-b last:border-0">
                <Label htmlFor={`perm-${p.key}`} className="text-sm cursor-pointer">
                  {p.label}
                </Label>
                <Switch
                  id={`perm-${p.key}`}
                  checked={!!editingMember.permission_flags?.[p.key]}
                  onCheckedChange={() => handleTogglePermission(editingMember, p.key)}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setEditingMember(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
