import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/LoadingState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Tag, Lock, Plus, Pencil, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface TagEncomenda {
  id: string;
  user_id: string | null;
  nome: string;
  cor: string;
  descricao?: string;
  ativo: boolean;
  padrao_sistema?: boolean;
  created_at: string;
  updated_at: string;
}

export default function ConfiguracaoTagsEncomendas() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeGroup } = useGroup();
  const activeGroupId = activeGroup?.id;
  
  const [tags, setTags] = useState<TagEncomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingTag, setEditingTag] = useState<TagEncomenda | null>(null);
  const [deletingTag, setDeletingTag] = useState<TagEncomenda | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cor: '#3B82F6',
    descricao: ''
  });

  useEffect(() => {
    fetchTags();

    // Escutar mudanças em tempo real na tabela tags_encomendas
    const channel = supabase
      .channel('tags-encomendas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tags_encomendas'
        },
        () => {
          fetchTags();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTags = async () => {
    try {
      if (!user) return;
      if (!activeGroupId) return;

      // Buscar tags do sistema (user_id = null) e tags do grupo
      const { data, error } = await supabase
        .from('tags_encomendas')
        .select('*')
        .or(`user_id.is.null,owner_group_id.eq.${activeGroupId}`)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Erro ao buscar tags:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as tags.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!formData.nome.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome da tag é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (!user) return;
      if (!activeGroupId) return;

      const { error } = await supabase
        .from('tags_encomendas')
        .insert({
          nome: formData.nome.trim(),
          cor: formData.cor,
          descricao: formData.descricao.trim() || null,
          user_id: user.id,
          owner_group_id: activeGroupId,
          padrao_sistema: false,
          ativo: true
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Tag criada com sucesso!',
      });

      setShowCreateDialog(false);
      setFormData({ nome: '', cor: '#3B82F6', descricao: '' });
      fetchTags();
    } catch (error: any) {
      console.error('[ConfiguracaoTags] Erro:', error.message);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a tag.',
        variant: 'destructive',
      });
    }
  };

  const handleEditTag = async () => {
    if (!editingTag || !formData.nome.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome da tag é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('tags_encomendas')
        .update({
          nome: formData.nome.trim(),
          cor: formData.cor,
          descricao: formData.descricao.trim() || null,
        })
        .eq('id', editingTag.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Tag atualizada com sucesso!',
      });

      setShowEditDialog(false);
      setEditingTag(null);
      setFormData({ nome: '', cor: '#3B82F6', descricao: '' });
      fetchTags();
    } catch (error: any) {
      console.error('[ConfiguracaoTags] Erro:', error.message);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a tag.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTag = async () => {
    if (!deletingTag) return;

    try {
      const { error } = await supabase
        .from('tags_encomendas')
        .delete()
        .eq('id', deletingTag.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Tag excluída com sucesso!',
      });

      setShowDeleteDialog(false);
      setDeletingTag(null);
      fetchTags();
    } catch (error: any) {
      console.error('[ConfiguracaoTags] Erro:', error.message);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a tag.',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (tag: TagEncomenda) => {
    setEditingTag(tag);
    setFormData({
      nome: tag.nome,
      cor: tag.cor,
      descricao: tag.descricao || ''
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (tag: TagEncomenda) => {
    setDeletingTag(tag);
    setShowDeleteDialog(true);
  };

  if (loading) {
    return <LoadingState message="Carregando tags..." />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tags de Encomendas
            </CardTitle>
            <CardDescription>
              Gerencie as tags disponíveis para categorizar suas encomendas
            </CardDescription>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setFormData({ nome: '', cor: '#3B82F6', descricao: '' })}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Tag</DialogTitle>
                <DialogDescription>
                  Crie uma tag personalizada para categorizar suas encomendas.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome da Tag *</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Evento Especial"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cor">Cor da Tag</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="cor"
                      type="color"
                      value={formData.cor}
                      onChange={(e) => setFormData(prev => ({ ...prev, cor: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.cor}
                      onChange={(e) => setFormData(prev => ({ ...prev, cor: e.target.value }))}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="descricao">Descrição (opcional)</Label>
                  <Input
                    id="descricao"
                    placeholder="Descreva o uso desta tag..."
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateTag}>
                  Criar Tag
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tag</TableHead>
              <TableHead>Cor</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Nenhuma tag cadastrada
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge style={{ backgroundColor: tag.cor, color: '#fff' }}>
                        {tag.nome}
                      </Badge>
                      {tag.padrao_sistema && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Lock className="h-3 w-3" />
                          Sistema
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: tag.cor }}
                      />
                      <span className="text-sm">{tag.cor}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {tag.descricao || '-'}
                  </TableCell>
                  <TableCell>
                    {!tag.padrao_sistema && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(tag)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(tag)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tag</DialogTitle>
            <DialogDescription>
              Modifique as informações da tag personalizada.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-nome">Nome da Tag *</Label>
              <Input
                id="edit-nome"
                placeholder="Ex: Evento Especial"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-cor">Cor da Tag</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-cor"
                  type="color"
                  value={formData.cor}
                  onChange={(e) => setFormData(prev => ({ ...prev, cor: e.target.value }))}
                  className="w-16 h-10"
                />
                <Input
                  value={formData.cor}
                  onChange={(e) => setFormData(prev => ({ ...prev, cor: e.target.value }))}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-descricao">Descrição (opcional)</Label>
              <Input
                id="edit-descricao"
                placeholder="Descreva o uso desta tag..."
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditTag}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteTag}
        title="Excluir Tag"
        description={`Tem certeza que deseja excluir a tag "${deletingTag?.nome}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
      />
    </Card>
  );
}
