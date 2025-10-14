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
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClientes } from "@/hooks/useClientes";
import { useNavigate } from "react-router-dom";

interface ClienteAutocompleteProps {
  value: string;
  onSelect: (clienteNome: string) => void;
  placeholder?: string;
}

export function ClienteAutocomplete({
  value,
  onSelect,
  placeholder = "Selecione um cliente...",
}: ClienteAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const { clientes } = useClientes();
  const navigate = useNavigate();

  const filteredClientes = clientes.filter((cliente) =>
    cliente.nome.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelect = (clienteNome: string) => {
    onSelect(clienteNome);
    setOpen(false);
    setSearchValue("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-background"
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-background" align="start">
        <Command className="bg-background">
          <CommandInput
            placeholder="Buscar cliente..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-4">
              <p className="text-sm text-muted-foreground">
                Nenhum cliente encontrado
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate("/cadastros/clientes");
                  setOpen(false);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Cadastrar novo cliente
              </Button>
            </div>
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {filteredClientes.map((cliente) => (
              <CommandItem
                key={cliente.id}
                value={cliente.nome}
                onSelect={() => handleSelect(cliente.nome)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === cliente.nome ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span>{cliente.nome}</span>
                  {cliente.telefone && (
                    <span className="text-xs text-muted-foreground">
                      {cliente.telefone}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
