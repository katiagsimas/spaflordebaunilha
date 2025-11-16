import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { TipoItem } from "@/types/estoque";
import { NovoItemDialog } from "./NovoItemDialog";

interface ItemNomeAutocompleteProps {
  value: string;
  tipo: TipoItem;
  onSelect: (nome: string, tipoInsumoId?: string, unidade?: string, qtdEmbalagem?: number) => void;
  placeholder?: string;
}

interface TipoInsumo {
  id: string;
  descricao: string;
  tipo: string;
  unidade_medida_id: string;
  quantidade_embalagem: number;
  unidades_medida?: {
    sigla: string;
  };
}

export function ItemNomeAutocomplete({
  value,
  tipo,
  onSelect,
  placeholder = "Selecione um item...",
}: ItemNomeAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [itens, setItens] = useState<TipoInsumo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [novoItemDialogOpen, setNovoItemDialogOpen] = useState(false);

  useEffect(() => {
    carregarItens();
  }, [tipo]);

  const carregarItens = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar itens
      const { data: itensData, error: itensError } = await supabase
        .from('itens')
        .select('id, nome, tipo, unidade_base, quantidade_por_embalagem')
        .eq('usuario_id', user.id)
        .eq('tipo', tipo)
        .eq('ativo', true)
        .order('nome');

      if (itensError) throw itensError;

      // Buscar unidades de medida pela sigla (unidade_base é a sigla, não o ID)
      const siglasUnidades = [...new Set(itensData?.map(item => item.unidade_base) || [])];
      const { data: unidadesData, error: unidadesError } = await supabase
        .from('unidades_medida')
        .select('id, sigla')
        .in('sigla', siglasUnidades);

      if (unidadesError) throw unidadesError;

      // Criar mapa de unidades por sigla
      const unidadesMap = new Map(unidadesData?.map(u => [u.sigla, u.sigla]) || []);

      // Adaptar formato para compatibilidade
      const itensAdaptados = (itensData || []).map(item => ({
        id: item.id,
        descricao: item.nome,
        tipo: item.tipo,
        unidade_medida_id: item.unidade_base,
        quantidade_embalagem: item.quantidade_por_embalagem,
        unidades_medida: {
          sigla: item.unidade_base
        }
      }));
      
      setItens(itensAdaptados);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      toast.error('Erro ao carregar lista de itens');
    } finally {
      setLoading(false);
    }
  };

  const filteredItens = itens.filter((item) =>
    item.descricao.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelect = (item: TipoInsumo) => {
    onSelect(
      item.descricao,
      item.id,
      item.unidades_medida?.sigla,
      item.quantidade_embalagem
    );
    setOpen(false);
    setSearchValue("");
  };

  const handleNovoItem = () => {
    setOpen(false);
    setNovoItemDialogOpen(true);
  };

  const handleNovoItemSuccess = async (novoItem: any) => {
    // Recarregar lista
    await carregarItens();
    
    // O novoItem.unidade_base agora já é a sigla
    onSelect(
      novoItem.nome,
      novoItem.id,
      novoItem.unidade_base,
      novoItem.quantidade_por_embalagem
    );
    
    setSearchValue("");
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {value || placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-popover" align="start">
          <Command>
            <CommandInput
              placeholder="Buscar item..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                <div className="flex flex-col items-center gap-3 py-6 px-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    {loading 
                      ? "Carregando..." 
                      : searchValue 
                        ? `Nenhum ${tipo === 'ingrediente' ? 'ingrediente' : 'embalagem'} encontrado com "${searchValue}"`
                        : "Nenhum item encontrado"
                    }
                  </p>
                  {!loading && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNovoItem}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Novo Item
                    </Button>
                  )}
                </div>
              </CommandEmpty>
              <CommandGroup>
                {filteredItens.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.descricao}
                    onSelect={() => handleSelect(item)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === item.descricao ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{item.descricao}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.quantidade_embalagem} {item.unidades_medida?.sigla}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <NovoItemDialog
        open={novoItemDialogOpen}
        onOpenChange={setNovoItemDialogOpen}
        tipo={tipo}
        nomeInicial={searchValue}
        onSuccess={handleNovoItemSuccess}
      />
    </>
  );
}
