import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/PageHeader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Check, ChevronsUpDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Ingredientes() {
  const { toast } = useToast();
  const [ingredientes, setIngredientes] = useState<any[]>([]);
  const [tiposDisponiveis, setTiposDisponiveis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [tipoSelecionado, setTipoSelecionado] = useState('');
  const [marca, setMarca] = useState('');
  const [preco, setPreco] = useState('');
  const [popoverAberto, setPopoverAberto] = useState(false);

  useEffect(() => {
    fetchIngredientes();
    fetchTiposDisponiveis();
  }, []);

  const fetchIngredientes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ingredientes')
        .select(`
          *,
          tipo_insumo:tipos_insumos (
            id,
            descricao,
            quantidade_embalagem,
            unidade_medida:unidades_medida (
              nome,
              sigla
            )
          )
        `)
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIngredientes(data || []);
    } catch (error) {
      console.error('Erro ao buscar ingredientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTiposDisponiveis = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tipos_insumos')
        .select(`
          id,
          descricao,
          quantidade_embalagem,
          unidade_medida:unidades_medida (
            nome,
            sigla
          )
        `)
        .eq('usuario_id', user.id)
        .eq('tipo', 'ingrediente')
        .order('descricao');

      if (error) throw error;
      setTiposDisponiveis(data || []);
    } catch (error) {
      console.error('Erro ao buscar tipos:', error);
    }
  };

  const handleAbrirModal = (ingrediente: any = null) => {
    if (ingrediente) {
      setEditando(ingrediente);
      setTipoSelecionado(ingrediente.tipo_insumo_id);
      setMarca(ingrediente.marca || '');
      setPreco(ingrediente.preco.toString().replace('.', ','));
    } else {
      setEditando(null);
      setTipoSelecionado('');
      setMarca('');
      setPreco('');
    }
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    try {
      if (!tipoSelecionado) {
        toast({
          title: 'Erro',
          description: 'Selecione o tipo de ingrediente!',
          variant: 'destructive',
        });
        return;
      }

      const precoNum = parseFloat(preco.replace(',', '.'));
      if (!precoNum || precoNum <= 0) {
        toast({
          title: 'Erro',
          description: 'Informe um preço válido!',
          variant: 'destructive',
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      if (editando) {
        const { error } = await supabase
          .from('ingredientes')
          .update({
            marca: marca.trim() || null,
            preco: precoNum,
            data_atualizacao: new Date().toISOString().split('T')[0],
          })
          .eq('id', editando.id);

        if (error) throw error;

        toast({
          title: '✅ Atualizado',
          description: 'Ingrediente atualizado com sucesso!',
        });
      } else {
        const { error } = await supabase
          .from('ingredientes')
          .insert({
            usuario_id: user.id,
            tipo_insumo_id: tipoSelecionado,
            marca: marca.trim() || null,
            preco: precoNum,
            data_atualizacao: new Date().toISOString().split('T')[0],
          });

        if (error) {
          if (error.code === '23505') {
            throw new Error('Este tipo já foi cadastrado em ingredientes!');
          }
          throw error;
        }

        toast({
          title: '✅ Cadastrado',
          description: 'Ingrediente cadastrado com sucesso!',
        });
      }

      setModalAberto(false);
      fetchIngredientes();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const formatarData = (dataISO: string) => {
    const data = new Date(dataISO + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');
  };

  const formatarPreco = (preco: number) => {
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const tipoSelecionadoObj = tiposDisponiveis.find((t) => t.id === tipoSelecionado);

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <PageHeader
          title="Ingredientes"
          description="Cadastre ingredientes com marca e preço para usar em receitas"
        />
        <Button onClick={() => handleAbrirModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Ingrediente
        </Button>
      </div>

      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription>
          Após cadastrar, você pode editar apenas a marca e o preço.
        </AlertDescription>
      </Alert>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ingrediente</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Qtde Embalagem</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Data Atualização</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ingredientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum ingrediente cadastrado. Clique em "Novo Ingrediente".
                </TableCell>
              </TableRow>
            ) : (
              ingredientes.map((ingrediente) => (
                <TableRow key={ingrediente.id}>
                  <TableCell className="font-medium">
                    {ingrediente.tipo_insumo?.descricao || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {ingrediente.marca || <span className="text-muted-foreground italic">Sem marca</span>}
                  </TableCell>
                  <TableCell>
                    {ingrediente.tipo_insumo?.quantidade_embalagem?.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {ingrediente.tipo_insumo?.unidade_medida?.sigla || 'N/A'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatarPreco(ingrediente.preco)}
                  </TableCell>
                  <TableCell>
                    {formatarData(ingrediente.data_atualizacao)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAbrirModal(ingrediente)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Ingrediente' : 'Novo Ingrediente'}</DialogTitle>
            <DialogDescription>
              {editando ? 'Você pode alterar marca e preço' : 'Selecione o tipo e informe marca e preço'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!editando && (
              <div className="space-y-2">
                <Label>Tipo de Ingrediente *</Label>
                <Popover open={popoverAberto} onOpenChange={setPopoverAberto}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={popoverAberto}
                      className="w-full justify-between"
                    >
                      {tipoSelecionadoObj ? (
                        <span>
                          {tipoSelecionadoObj.descricao} ({tipoSelecionadoObj.quantidade_embalagem.toLocaleString('pt-BR')}{' '}
                          {tipoSelecionadoObj.unidade_medida.sigla})
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Selecione o tipo...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar tipo..." />
                      <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {tiposDisponiveis.map((tipo) => (
                          <CommandItem
                            key={tipo.id}
                            value={tipo.id}
                            onSelect={() => {
                              setTipoSelecionado(tipo.id);
                              setPopoverAberto(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                tipoSelecionado === tipo.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{tipo.descricao}</span>
                              <span className="text-sm text-muted-foreground">
                                {tipo.quantidade_embalagem.toLocaleString('pt-BR')}{' '}
                                {tipo.unidade_medida.sigla}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {editando && tipoSelecionadoObj && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground">Ingrediente</Label>
                <p className="font-medium">
                  {tipoSelecionadoObj.descricao} ({tipoSelecionadoObj.quantidade_embalagem.toLocaleString('pt-BR')}{' '}
                  {tipoSelecionadoObj.unidade_medida.sigla})
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="marca">Marca (opcional)</Label>
              <Input
                id="marca"
                placeholder="Ex: Rosa Branca, Dona Benta..."
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco">Preço *</Label>
              <Input
                id="preco"
                type="text"
                placeholder="Ex: 5,50"
                value={preco}
                onChange={(e) => {
                  const valor = e.target.value.replace(/[^\d,]/g, '');
                  setPreco(valor);
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar}>
              {editando ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
