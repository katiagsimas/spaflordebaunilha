import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface CategoriaReceitaAutocompleteProps {
  value: string;
  categorias: Array<{
    id: string;
    nome: string;
    ativo?: boolean;
  }>;
  onSelect: (categoriaId: string) => void;
  placeholder?: string;
  apenasAtivas?: boolean;
}

export function CategoriaReceitaAutocomplete({ 
  value, 
  categorias, 
  onSelect, 
  placeholder = "Selecione a categoria...",
  apenasAtivas = true
}: CategoriaReceitaAutocompleteProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (categoriaId: string) => {
    onSelect(categoriaId);
    setOpen(false);
  };

  // Filtrar apenas categorias ativas se apenasAtivas = true
  const categoriasDisponiveis = apenasAtivas 
    ? categorias.filter(c => c.ativo !== false)
    : categorias;

  const selectedCategoria = categorias.find(c => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedCategoria ? selectedCategoria.nome : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-popover" align="start">
        <Command>
          <CommandInput placeholder="Buscar categoria..." />
          <CommandList>
            <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
            <CommandGroup>
              {categoriasDisponiveis.map((categoria) => (
                <CommandItem
                  key={categoria.id}
                  value={categoria.nome}
                  onSelect={() => handleSelect(categoria.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === categoria.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {categoria.nome}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
