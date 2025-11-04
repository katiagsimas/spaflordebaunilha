import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, DollarSign, Package, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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

export default function Ingredientes() {
  const [ingredientes, setIngredientes] = useState<ItemComPreco[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<ItemComPreco | undefined>();

  const carregarIngredientes = async () => {
    try {
      setLoading(true);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Buscar ingredientes com preços
      const { data, error } = await supabase
        .from('itens')
        .select(`
          *,
          precos(*)
        `)
        .eq('tipo', 'ingrediente')
        .eq('ativo', true)
        .eq('usuario_id', user.user.id)
        .order('nome');

      if (error) throw error;

      // Adicionar preço ativo a cada item
      const ingredientesComPreco: ItemComPreco[] = (data || []).map(item => ({
        ...item,
        tipo: item.tipo as 'ingrediente' | 'embalagem',
        unidade_base: item.unidade_base as any,
        conversoes: item.conversoes as any,
        preco_ativo: item.precos?.find((p: Preco) => p.ativo) || item.precos?.[0]
      }));

      setIngredientes(ingredientesComPreco);
    } catch (error) {
      console.error('Erro ao carregar ingredientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarIngredientes();
  }, []);

  // Filtrar por busca
  const ingredientesFiltrados = useMemo(() => {
    return ingredientes.filter(item =>
      item.nome.toLowerCase().includes(busca.toLowerCase()) ||
      item.preco_ativo?.marca?.toLowerCase().includes(busca.toLowerCase())
    );
  }, [ingredientes, busca]);

  // Contar itens sem preço
  const semPreco = ingredientes.filter(i => !i.preco_ativo).length;

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
        title="Ingredientes"
        description="Gerencie ingredientes e seus preços para precificação"
        backButton={<BackButton to="/precificacao" />}
        actions={
          <Button onClick={() => {
            setItemSelecionado(undefined);
            setModalAberto(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Ingrediente
          </Button>
        }
      />

      {/* Alertas */}
      {semPreco > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {semPreco} ingrediente(s) sem preço cadastrado. Cadastre preços para usar na precificação.
          </AlertDescription>
        </Alert>
      )}

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar ingrediente..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : ingredientesFiltrados.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {busca ? 'Nenhum ingrediente encontrado' : 'Nenhum ingrediente cadastrado'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ingredientesFiltrados.map(item => (
            <Card 
              key={item.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setItemSelecionado(item);
                setModalAberto(true);
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{item.nome}</CardTitle>
                    {item.preco_ativo?.marca && (
                      <CardDescription className="mt-1">
                        {item.preco_ativo.marca}
                      </CardDescription>
                    )}
                  </div>
                  {!item.preco_ativo && (
                    <Badge variant="destructive" className="ml-2">
                      Sem preço
                    </Badge>
                  )}
                  {item.preco_ativo && verificarDesatualizado(item.preco_ativo.data_coleta) && (
                    <Badge variant="outline" className="ml-2">
                      Desatualizado
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Embalagem */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>Embalagem</span>
                  </div>
                  <span className="font-medium">
                    {item.quantidade_por_embalagem} {item.unidade_base}
                  </span>
                </div>

                {/* Preço */}
                {item.preco_ativo && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>Custo unitário</span>
                      </div>
                      <span className="font-medium">
                        {formatarPreco(item.preco_ativo.custo_unitario)}/{item.unidade_base}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <span className="text-muted-foreground">Embalagem completa</span>
                      <span className="font-medium">
                        {formatarPreco(item.preco_ativo.preco_total_embalagem)}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <ModalItem
        item={itemSelecionado}
        open={modalAberto}
        onOpenChange={(open) => {
          setModalAberto(open);
          if (!open) {
            setItemSelecionado(undefined);
            carregarIngredientes();
          }
        }}
        onSave={async () => {
          await carregarIngredientes();
          return { success: true };
        }}
      />
    </div>
  );
}
