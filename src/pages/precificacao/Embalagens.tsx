import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/PageHeader';
import { BackButton } from '@/components/BackButton';
import { ModalItem } from '@/components/estoque/ModalItem';
import type { Item } from '@/types/estoque';

interface Preco {
  id: string;
  marca: string;
  preco_total_embalagem: number;
  quantidade_embalagem: number;
  custo_unitario: number;
  ativo: boolean;
  data_coleta: string;
}

interface ItemComPreco extends Item {
  precos?: Preco[];
  preco_ativo?: Preco;
}

export default function Embalagens() {
  const [embalagens, setEmbalagens] = useState<ItemComPreco[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<ItemComPreco | undefined>();

  const carregarEmbalagens = async () => {
    try {
      setLoading(true);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Buscar embalagens com preços
      const { data, error } = await supabase
        .from('itens')
        .select(`
          *,
          precos(*)
        `)
        .eq('tipo', 'embalagem')
        .eq('ativo', true)
        .eq('usuario_id', user.user.id)
        .order('nome');

      if (error) throw error;

      // Adicionar preço ativo a cada item
      const embalagensComPreco: ItemComPreco[] = (data || []).map(item => ({
        ...item,
        tipo: item.tipo as 'ingrediente' | 'embalagem',
        unidade_base: item.unidade_base as any,
        conversoes: item.conversoes as any,
        preco_ativo: item.precos?.find((p: Preco) => p.ativo) || item.precos?.[0]
      }));

      setEmbalagens(embalagensComPreco);
    } catch (error) {
      console.error('Erro ao carregar embalagens:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarEmbalagens();
  }, []);

  // Filtrar por busca
  const embalagensFiltradas = useMemo(() => {
    return embalagens.filter(item =>
      item.nome.toLowerCase().includes(busca.toLowerCase()) ||
      item.preco_ativo?.marca?.toLowerCase().includes(busca.toLowerCase())
    );
  }, [embalagens, busca]);

  // Contar itens sem preço
  const semPreco = embalagens.filter(i => !i.preco_ativo).length;

  const formatarPreco = (valor?: number) => {
    if (!valor) return 'R$ -';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const verificarDesatualizado = (data?: string) => {
    if (!data) return false;
    const hoje = new Date();
    const dataColeta = new Date(data);
    const diffDias = Math.floor((hoje.getTime() - dataColeta.getTime()) / (1000 * 60 * 60 * 24));
    return diffDias > 30;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Embalagens"
        description="Gerencie embalagens e seus preços para precificação"
        backButton={<BackButton to="/precificacao" />}
        actions={
          <Button onClick={() => {
            setItemSelecionado(undefined);
            setModalAberto(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Embalagem
          </Button>
        }
      />

      {/* Alertas */}
      {semPreco > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {semPreco} embalagem(ns) sem preço cadastrado. Cadastre preços para usar na precificação.
          </AlertDescription>
        </Alert>
      )}

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar embalagem..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : embalagensFiltradas.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {busca ? 'Nenhuma embalagem encontrada' : 'Nenhuma embalagem cadastrada'}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Custo Unitário</TableHead>
                  <TableHead className="text-right">Preço Total</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {embalagensFiltradas.map(item => (
                  <TableRow 
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setItemSelecionado(item);
                      setModalAberto(true);
                    }}
                  >
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell>{item.preco_ativo?.marca || '-'}</TableCell>
                    <TableCell className="text-right">
                      {item.quantidade_por_embalagem} {item.unidade_base}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.preco_ativo 
                        ? `${formatarPreco(item.preco_ativo.custo_unitario)}/${item.unidade_base}`
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      {item.preco_ativo 
                        ? formatarPreco(item.preco_ativo.preco_total_embalagem)
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center">
                        {!item.preco_ativo && (
                          <Badge variant="destructive">
                            Sem preço
                          </Badge>
                        )}
                        {item.preco_ativo && verificarDesatualizado(item.preco_ativo.data_coleta) && (
                          <Badge variant="outline">
                            Desatualizado
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      <ModalItem
        item={itemSelecionado as any}
        open={modalAberto}
        onOpenChange={(open) => {
          setModalAberto(open);
          if (!open) {
            setItemSelecionado(undefined);
            carregarEmbalagens();
          }
        }}
        onSave={async () => {
          await carregarEmbalagens();
          return { success: true };
        }}
      />
    </div>
  );
}
