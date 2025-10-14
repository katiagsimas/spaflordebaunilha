import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { toast } from "sonner";

interface Ingrediente {
  id: string;
  nome: string;
  marca: string;
  quantidade: number;
  unidadeMedida: string;
  preco: number;
}

interface IngredienteAutocompleteProps {
  ingredientes: Ingrediente[];
  value: string;
  onSelect: (ingredienteId: string) => void;
  placeholder?: string;
}

export function IngredienteAutocomplete({
  ingredientes,
  value,
  onSelect,
  placeholder = "Selecione o ingrediente...",
}: IngredienteAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const selectedIngrediente = ingredientes.find((ing) => ing.id === value);

  const handleSelect = (currentValue: string) => {
    const ingrediente = ingredientes.find((ing) => ing.id === currentValue);
    if (ingrediente) {
      onSelect(currentValue);
      setOpen(false);
      setSearchValue("");
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearchValue("");
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedIngrediente
            ? selectedIngrediente.nome
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 bg-popover" align="start">
        <Command>
          <CommandInput
            placeholder="Digite para buscar..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>
            <div className="p-4 text-sm text-center">
              <p className="text-destructive font-medium mb-2">
                Ingrediente não encontrado
              </p>
              <p className="text-muted-foreground">
                Por favor, cadastre o ingrediente na tela de{" "}
                <strong>Ingredientes</strong> antes de continuar.
              </p>
            </div>
          </CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-auto">
            {ingredientes.map((ingrediente) => (
              <CommandItem
                key={ingrediente.id}
                value={ingrediente.id}
                onSelect={() => handleSelect(ingrediente.id)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === ingrediente.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span className="font-medium">
                    {ingrediente.nome}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {ingrediente.marca} • {ingrediente.quantidade} {ingrediente.unidadeMedida} • R${" "}
                    {ingrediente.preco.toFixed(2)}
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
