import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { TipoItem } from "@/types/estoque";

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
  placeholder = "Digite para buscar ou criar novo...",
}: ItemNomeAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [itens, setItens] = useState<TipoInsumo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarItens();
  }, [tipo]);

  const carregarItens = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tipos_insumos')
        .select(`
          id,
          descricao,
          tipo,
          unidade_medida_id,
          quantidade_embalagem,
          unidades_medida:unidade_medida_id (
            sigla
          )
        `)
        .eq('usuario_id', user.id)
        .eq('tipo', tipo)
        .order('descricao');

      if (error) throw error;
      setItens(data || []);
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

  const handleInputChange = (newValue: string) => {
    setSearchValue(newValue);
    // Se o usuário digitar e não abrir o popover, permitir texto livre
    if (!open) {
      onSelect(newValue);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            value={value}
            onChange={(e) => onSelect(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="pr-10"
          />
          <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar item..."
            value={searchValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Carregando..." : "Nenhum item encontrado."}
            </CommandEmpty>
            <CommandGroup>
              {filteredItens.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.descricao}
                  onSelect={() => handleSelect(item)}
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
  );
}
