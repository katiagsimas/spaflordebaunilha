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
import { useFornecedores } from "@/hooks/useFornecedores";
import { useNavigate } from "react-router-dom";

interface FornecedorAutocompleteProps {
  value: string;
  onSelect: (fornecedorNome: string, fornecedorDocumento?: string) => void;
  placeholder?: string;
}

export function FornecedorAutocomplete({
  value,
  onSelect,
  placeholder = "Selecione um fornecedor...",
}: FornecedorAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const { fornecedores } = useFornecedores();
  const navigate = useNavigate();

  const filteredFornecedores = fornecedores.filter((fornecedor) =>
    fornecedor.nome.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelect = (fornecedorNome: string) => {
    const fornecedor = fornecedores.find(f => f.nome === fornecedorNome);
    onSelect(fornecedorNome, fornecedor?.cpf_cnpj);
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
            placeholder="Buscar fornecedor..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-4">
              <p className="text-sm text-muted-foreground">
                Nenhum fornecedor encontrado
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate("/cadastros/fornecedores");
                  setOpen(false);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Cadastrar novo fornecedor
              </Button>
            </div>
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {filteredFornecedores.map((fornecedor) => (
              <CommandItem
                key={fornecedor.id}
                value={fornecedor.nome}
                onSelect={() => handleSelect(fornecedor.nome)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === fornecedor.nome ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span>{fornecedor.nome}</span>
                  {fornecedor.cpf_cnpj && (
                    <span className="text-xs text-muted-foreground">
                      {fornecedor.cpf_cnpj}
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
