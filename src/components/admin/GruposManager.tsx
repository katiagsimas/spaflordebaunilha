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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Building2, Plus } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  created_by_user_id: string | null;
  master_user_id: string | null;
}

export default function GruposManager() {
  const { isMother, refreshGroups } = useGroup();
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    if (isMother) loadData();
  }, [isMother]);

  const loadData = async () => {
    try {
      const { data: groupsData } = await supabase.from('groups').select('*').order('name');
      setGroups(groupsData || []);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar grupos');
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) { toast.error('Nome do grupo é obrigatório'); return; }
    try {
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
