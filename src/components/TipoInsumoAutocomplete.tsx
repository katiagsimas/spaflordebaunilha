import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTiposInsumos, TipoInsumo } from "@/hooks/useTiposInsumos";
import { useUnidadesMedida } from "@/hooks/useUnidadesMedida";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TipoInsumoAutocompleteProps {
  onSelect: (tipo: TipoInsumo) => void;
  value?: string;
}

export function TipoInsumoAutocomplete({ onSelect, value }: TipoInsumoAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { tiposInsumos, createTipoInsumo } = useTiposInsumos();
  const { unidades } = useUnidadesMedida();

  const [newTipoData, setNewTipoData] = useState({
    descricao: "",
    quantidade_embalagem: "",
    unidade_medida_id: "",
  });

  useEffect(() => {
    if (search && createDialogOpen) {
      setNewTipoData(prev => ({ ...prev, descricao: search }));
    }
  }, [search, createDialogOpen]);

  const filteredTipos = tiposInsumos.filter((tipo) =>
    tipo.descricao.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateNew = () => {
    setCreateDialogOpen(true);
  };

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      descricao: newTipoData.descricao,
      quantidade_embalagem: parseFloat(newTipoData.quantidade_embalagem),
      unidade_medida_id: newTipoData.unidade_medida_id,
    };

    createTipoInsumo.mutate(data, {
      onSuccess: (newTipo) => {
        onSelect(newTipo as TipoInsumo);
        setCreateDialogOpen(false);
        setNewTipoData({
          descricao: "",
          quantidade_embalagem: "",
          unidade_medida_id: "",
        });
        setOpen(false);
      },
    });
  };

  const selectedTipo = tiposInsumos.find((tipo) => tipo.id === value);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedTipo ? selectedTipo.descricao : "Selecione ou digite para buscar..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Digite para buscar..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                <div className="flex flex-col items-center gap-2 py-6">
                  <p className="text-sm text-muted-foreground">Nenhum tipo encontrado</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateNew}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Criar novo tipo
                  </Button>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {filteredTipos.map((tipo) => {
                  const unidade = unidades.find((u) => u.id === tipo.unidade_medida_id);
                  return (
                    <CommandItem
                      key={tipo.id}
                      value={tipo.descricao}
                      onSelect={() => {
                        onSelect(tipo);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === tipo.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{tipo.descricao}</span>
                        <span className="text-xs text-muted-foreground">
                          {tipo.quantidade_embalagem} {unidade?.sigla || ""}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Tipo de Insumo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitNew}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={newTipoData.descricao}
                  onChange={(e) =>
                    setNewTipoData({ ...newTipoData, descricao: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="quantidade">Quantidade na Embalagem</Label>
                <Input
                  id="quantidade"
                  type="number"
                  step="0.01"
                  value={newTipoData.quantidade_embalagem}
                  onChange={(e) =>
                    setNewTipoData({ ...newTipoData, quantidade_embalagem: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="unidade">Unidade de Medida</Label>
                <Select
                  value={newTipoData.unidade_medida_id}
                  onValueChange={(value) =>
                    setNewTipoData({ ...newTipoData, unidade_medida_id: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map((unidade) => (
                      <SelectItem key={unidade.id} value={unidade.id}>
                        {unidade.nome} ({unidade.sigla})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Criar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
