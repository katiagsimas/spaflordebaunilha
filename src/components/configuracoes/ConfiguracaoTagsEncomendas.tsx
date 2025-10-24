import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tag, Plus, Edit2, Trash2 } from 'lucide-react';

interface TagEncomenda {
  id: string;
  user_id: string;
  nome: string;
  cor: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export default function ConfiguracaoTagsEncomendas() {
  const { toast } = useToast();
  
  const [tags, setTags] = useState<TagEncomenda[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [tagEditando, setTagEditando] = useState<TagEncomenda | null>(null);
  const [nomeTag, setNomeTag] = useState('');
  const [corTag, setCorTag] = useState('#3B82F6');
  const [descricaoTag, setDescricaoTag] = useState('');

  // Cores pré-definidas
  const coresPredefinidas = [
    { nome: 'Vermelho', valor: '#EF4444' },
    { nome: 'Laranja', valor: '#F59E0B' },
    { nome: 'Amarelo', valor: '#EAB308' },
    { nome: 'Verde', valor: '#10B981' },
    { nome: 'Azul', valor: '#3B82F6' },
    { nome: 'Índigo', valor: '#6366F1' },
    { nome: 'Roxo', valor: '#8B5CF6' },
    { nome: 'Rosa', valor: '#EC4899' },
    { nome: 'Cinza', valor: '#6B7280' },
  ];

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tags_encomendas')
        .select('*')
        .eq('user_id', user.id)
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

  const handleAbrirModal = (tag: TagEncomenda | null = null) => {
    if (tag) {
      setTagEditando(tag);
      setNomeTag(tag.nome);
      setCorTag(tag.cor);
      setDescricaoTag(tag.descricao || '');
    } else {
      setTagEditando(null);
      setNomeTag('');
      setCorTag('#3B82F6');
      setDescricaoTag('');
    }
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    try {
      if (!nomeTag.trim()) {
        toast({
          title: 'Erro',
          description: 'Informe o nome da tag!',
          variant: 'destructive',
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Verificar se já existe uma tag com o mesmo nome
      const nomeNormalizado = nomeTag.trim().toLowerCase();
      const tagDuplicada = tags.find(t => 
        t.nome.toLowerCase() === nomeNormalizado && 
        t.id !== tagEditando?.id
      );

      if (tagDuplicada) {
        toast({
          title: 'Erro',
          description: 'Já existe uma tag com este nome!',
          variant: 'destructive',
        });
        return;
      }

      const dados = {
        user_id: user.id,
        nome: nomeTag.trim(),
        cor: corTag,
        descricao: descricaoTag.trim() || null,
      };

      if (tagEditando) {
        // Atualizar
        const { error } = await supabase
          .from('tags_encomendas')
          .update(dados)
          .eq('id', tagEditando.id);

        if (error) throw error;

        toast({
          title: '✅ Tag atualizada',
          description: 'A tag foi atualizada com sucesso!',
        });
      } else {
        // Criar
        const { error } = await supabase
          .from('tags_encomendas')
          .insert(dados);

        if (error) {
          if (error.code === '23505') {
            toast({
              title: 'Erro',
              description: 'Já existe uma tag com este nome!',
              variant: 'destructive',
            });
            return;
          }
          throw error;
        }

        toast({
          title: '✅ Tag criada',
          description: 'A tag foi criada com sucesso!',
        });
      }

      setModalAberto(false);
      fetchTags();
    } catch (error: any) {
      console.error('Erro ao salvar tag:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleExcluir = async (tag: TagEncomenda) => {
    try {
      const confirmar = window.confirm(
        `Tem certeza que deseja excluir a tag "${tag.nome}"?\n\n` +
        `Esta ação removerá a tag de todas as encomendas vinculadas.`
      );

      if (!confirmar) return;

      const { error } = await supabase
        .from('tags_encomendas')
        .delete()
        .eq('id', tag.id);

      if (error) throw error;

      toast({
        title: '✅ Tag excluída',
        description: 'A tag foi excluída com sucesso!',
      });

      fetchTags();
    } catch (error: any) {
      console.error('Erro ao excluir tag:', error);
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) return <div className="flex justify-center p-8">Carregando...</div>;

  return (
    <Card className="border-l-4" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
      <CardHeader className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base font-semibold leading-tight">
                Tags de Encomendas
              </CardTitle>
            </div>
          </div>
          <Button onClick={() => handleAbrirModal()} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nova Tag
          </Button>
        </div>
        <CardDescription className="text-xs">
          Crie e gerencie tags para categorizar suas encomendas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tag</TableHead>
              <TableHead>Cor</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhuma tag cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              tags.map(tag => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <Badge style={{ backgroundColor: tag.cor, color: '#fff' }}>
                      {tag.nome}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: tag.cor }}
                      />
                      <span className="text-sm text-muted-foreground">{tag.cor}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tag.descricao || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAbrirModal(tag)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExcluir(tag)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Modal Criar/Editar */}
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {tagEditando ? 'Editar Tag' : 'Nova Tag'}
              </DialogTitle>
              <DialogDescription>
                Configure a tag para categorizar suas encomendas
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome-tag">Nome da Tag *</Label>
                <Input
                  id="nome-tag"
                  placeholder="Ex: Aniversário"
                  value={nomeTag}
                  onChange={(e) => setNomeTag(e.target.value)}
                  maxLength={50}
                />
              </div>

              {/* Cor */}
              <div className="space-y-2">
                <Label>Cor da Tag *</Label>
                <div className="grid grid-cols-9 gap-2">
                  {coresPredefinidas.map(cor => (
                    <button
                      key={cor.valor}
                      type="button"
                      className={`w-10 h-10 rounded border-2 transition-all ${
                        corTag === cor.valor ? 'border-primary scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: cor.valor }}
                      onClick={() => setCorTag(cor.valor)}
                      title={cor.nome}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="color"
                    value={corTag}
                    onChange={(e) => setCorTag(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={corTag}
                    onChange={(e) => setCorTag(e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="descricao-tag">Descrição</Label>
                <Textarea
                  id="descricao-tag"
                  placeholder="Descrição opcional da tag..."
                  rows={3}
                  value={descricaoTag}
                  onChange={(e) => setDescricaoTag(e.target.value)}
                />
              </div>

              {/* Preview */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <Badge style={{ backgroundColor: corTag, color: '#fff' }}>
                  {nomeTag || 'Nome da Tag'}
                </Badge>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setModalAberto(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSalvar}>
                {tagEditando ? 'Atualizar' : 'Criar'} Tag
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
