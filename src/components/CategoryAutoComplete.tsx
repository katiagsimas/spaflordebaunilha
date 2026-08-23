import { useState, useMemo, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface Category {
  id: string;
  nome: string;
}

interface CategoryAutoCompleteProps {
  categories: Category[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CategoryAutoComplete({
  categories,
  value,
  onChange,
  placeholder = "Selecionar categoria...",
  disabled = false,
}: CategoryAutoCompleteProps) {
  const [open, setOpen] = useState(false);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === value),
    [categories, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal bg-white border-sfb-areia/60 text-sfb-cacau"
          disabled={disabled}
        >
          {selectedCategory ? selectedCategory.nome : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-sfb-terracota" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-white border-sfb-areia/60 shadow-md">
        <Command className="bg-white">
          <CommandInput placeholder="Buscar categoria..." className="h-9" />
          <CommandList>
            <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
            <CommandGroup>
              {categories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.nome}
                  onSelect={() => {
                    onChange(category.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer hover:bg-sfb-baunilha text-sfb-cacau"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 text-sfb-terracota",
                      value === category.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {category.nome}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
