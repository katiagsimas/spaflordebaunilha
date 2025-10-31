import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoriaPlanoContasAutocompleteProps {
  value: string;
  categorias: any[];
  onSelect: (categoriaId: string) => void;
  placeholder?: string;
}

export function CategoriaPlanoContasAutocomplete({
  value,
  categorias,
  onSelect,
  placeholder = "Selecione uma categoria...",
}: CategoriaPlanoContasAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredCategorias = categorias.filter((categoria) => {
    const searchText = searchValue.toLowerCase();
    const codigoMatch = categoria.codigo?.toLowerCase().includes(searchText);
    const descricaoMatch = categoria.descricao?.toLowerCase().includes(searchText);
    return codigoMatch || descricaoMatch;
  });

  const handleSelect = (categoriaId: string) => {
    onSelect(categoriaId);
    setOpen(false);
    setSearchValue("");
  };

  const selectedCategoria = categorias.find((c) => c.id === value);
  const displayValue = selectedCategoria
    ? `${selectedCategoria.codigo} - ${selectedCategoria.descricao}`
    : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-background"
        >
          {displayValue || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-background" align="start">
        <Command className="bg-background">
          <CommandInput
            placeholder="Buscar categoria..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-4">
              <p className="text-sm text-muted-foreground">
                Nenhuma categoria encontrada
              </p>
            </div>
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {filteredCategorias.map((categoria) => (
              <CommandItem
                key={categoria.id}
                value={`${categoria.codigo} ${categoria.descricao}`}
                onSelect={() => handleSelect(categoria.id)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === categoria.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span className="font-medium">
                    {categoria.codigo}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {categoria.descricao}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
