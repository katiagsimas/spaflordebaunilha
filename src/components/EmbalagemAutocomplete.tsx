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

interface Embalagem {
  id: string;
  nome: string;
  marca: string;
  quantidade: number;
  unidadeMedida: string;
  preco: number;
}

interface EmbalagemAutocompleteProps {
  embalagens: Embalagem[];
  value: string;
  onSelect: (embalagemId: string) => void;
  placeholder?: string;
}

export function EmbalagemAutocomplete({
  embalagens,
  value,
  onSelect,
  placeholder = "Selecione a embalagem...",
}: EmbalagemAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const selectedEmbalagem = embalagens.find((emb) => emb.id === value);

  const handleSelect = (currentValue: string) => {
    const embalagem = embalagens.find((emb) => emb.id === currentValue);
    if (embalagem) {
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
          {selectedEmbalagem
            ? selectedEmbalagem.nome
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
                Embalagem não encontrada
              </p>
              <p className="text-muted-foreground">
                Por favor, cadastre a embalagem na tela de{" "}
                <strong>Embalagens</strong> antes de continuar.
              </p>
            </div>
          </CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-auto">
            {embalagens.map((embalagem) => (
              <CommandItem
                key={embalagem.id}
                value={embalagem.id}
                onSelect={() => handleSelect(embalagem.id)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === embalagem.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span className="font-medium">
                    {embalagem.nome}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {embalagem.marca} • {embalagem.quantidade} {embalagem.unidadeMedida} • R${" "}
                    {embalagem.preco.toFixed(2)}
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
