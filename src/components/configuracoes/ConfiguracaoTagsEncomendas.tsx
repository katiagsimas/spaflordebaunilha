import { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Tag, Trash2, Plus, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
  
  const [tags, setTags] = useState<TagEncomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    cor: '#64748b',
    descricao: '',
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar tags do sistema (user_id = null) e tags do usuário
      const { data, error } = await supabase
        .from('tags_encomendas')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .eq('ativo', true)
        .order('padrao_sistema', { ascending: false })
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('tags_encomendas')
        .insert({
          nome: formData.nome.trim(),
          cor: formData.cor,
          descricao: formData.descricao.trim() || null,
          user_id: user.id,
          padrao_sistema: false,
          ativo: true,
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Tag criada com sucesso.',
      });

      setDialogOpen(false);
      setFormData({ nome: '', cor: '#64748b', descricao: '' });
      fetchTags();
    } catch (error) {
      console.error('Erro ao criar tag:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a tag.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTag = async (tagId: string, tagNome: string) => {
    if (!confirm(`Tem certeza que deseja excluir a tag "${tagNome}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tags_encomendas')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Tag excluída com sucesso.',
      });

      fetchTags();
    } catch (error) {
      console.error('Erro ao excluir tag:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a tag. Ela pode estar em uso.',
        variant: 'destructive',
      });
    }
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
              Gerencie as tags para categorizar suas encomendas
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar nova tag</DialogTitle>
                <DialogDescription>
                  Crie uma tag personalizada para suas encomendas
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da tag *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Urgente, VIP, Especial..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cor">Cor</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="cor"
                      type="color"
                      value={formData.cor}
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.cor}
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                      placeholder="#64748b"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição (opcional)</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Para que serve esta tag..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
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
                <TableCell colSpan={4} className="text-center text-muted-foreground">
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
                    {!tag.padrao_sistema ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTag(tag.id, tag.nome)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Protegida
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
