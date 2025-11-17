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
import { useToast } from '@/hooks/use-toast';
import { Tag, Lock } from 'lucide-react';

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

      // Buscar apenas tags do sistema (user_id = null)
      const { data, error } = await supabase
        .from('tags_encomendas')
        .select('*')
        .is('user_id', null)
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

  if (loading) {
    return <LoadingState message="Carregando tags..." />;
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tags de Encomendas
          </CardTitle>
          <CardDescription>
            Visualize as tags disponíveis para categorizar suas encomendas
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tag</TableHead>
              <TableHead>Cor</TableHead>
              <TableHead>Descrição</TableHead>
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
