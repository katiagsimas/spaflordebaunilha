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
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface CategoriaReceitaAutocompleteProps {
  value: string;
  categorias: any[];
  onSelect: (categoriaId: string) => void;
  placeholder?: string;
}

export function CategoriaReceitaAutocomplete({ 
  value, 
  categorias, 
  onSelect, 
  placeholder = "Selecione a categoria..." 
}: CategoriaReceitaAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const filteredCategorias = categorias.filter(categoria =>
    categoria.nome.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelect = (categoriaId: string) => {
    onSelect(categoriaId);
    setOpen(false);
    setSearchValue('');
  };

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
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Buscar categoria..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {filteredCategorias.map((categoria) => (
              <CommandItem
                key={categoria.id}
                value={categoria.id}
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
        </Command>
      </PopoverContent>
    </Popover>
  );
}
