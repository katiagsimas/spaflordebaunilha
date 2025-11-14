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

interface PlanoContasAutocompleteProps {
  value: string;
  planosContas: any[];
  onSelect: (planoId: string) => void;
  placeholder?: string;
}

export function PlanoContasAutocomplete({
  value,
  planosContas,
  onSelect,
  placeholder = "Selecione um plano de contas...",
}: PlanoContasAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredPlanos = planosContas.filter((plano) => {
    // Apenas mostrar contas ativas
    if (!plano.ativo) return false;
    
    const searchText = searchValue.toLowerCase();
    const codigoMatch = plano.codigo_estruturado?.toLowerCase().includes(searchText);
    const descricaoMatch = plano.descricao?.toLowerCase().includes(searchText);
    return codigoMatch || descricaoMatch;
  });

  const handleSelect = (planoId: string) => {
    onSelect(planoId);
    setOpen(false);
    setSearchValue("");
  };

  const selectedPlano = planosContas.find((p) => p.id === value);
  const displayValue = selectedPlano
    ? `${selectedPlano.codigo_estruturado} - ${selectedPlano.descricao}`
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
            placeholder="Buscar plano de contas..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-4">
              <p className="text-sm text-muted-foreground">
                Nenhum plano de contas encontrado
              </p>
            </div>
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {filteredPlanos.map((plano) => (
              <CommandItem
                key={plano.id}
                value={`${plano.codigo_estruturado} ${plano.descricao}`}
                onSelect={() => handleSelect(plano.id)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === plano.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span className="font-medium">
                    {plano.codigo_estruturado}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {plano.descricao}
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
