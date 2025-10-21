import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { Button } from '@/components/ui/button';

interface EmbalagemAutocompleteProps {
  value?: string;
  onSelect: (embalagem: any) => void;
  placeholder?: string;
}

export function EmbalagemAutocomplete({ value, onSelect, placeholder = "Selecione a embalagem" }: EmbalagemAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [embalagens, setEmbalagens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmbalagens();
  }, []);

  const fetchEmbalagens = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('embalagens')
        .select(`
          *,
          tipo_insumo:tipos_insumos (
            id,
            descricao,
            quantidade_embalagem,
            unidade_medida:unidades_medida (
              nome,
              sigla
            )
          )
        `)
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const sortedData = (data || []).sort((a, b) => {
        const nomeA = a.tipo_insumo?.descricao?.toLowerCase() || '';
        const nomeB = b.tipo_insumo?.descricao?.toLowerCase() || '';
        return nomeA.localeCompare(nomeB, 'pt-BR');
      });

      setEmbalagens(sortedData);
    } catch (error) {
      console.error('Erro ao buscar embalagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (embalagemId: string) => {
    const embalagem = embalagens.find(e => e.id === embalagemId);
    if (embalagem) {
      onSelect({
        id: embalagem.id,
        embalagemId: embalagem.id,
        embalagem: embalagem.tipo_insumo?.descricao || '',
        marca: embalagem.marca || '',
        qtdeEmbalagem: embalagem.tipo_insumo?.quantidade_embalagem || 0,
        unidadeMedida: embalagem.tipo_insumo?.unidade_medida?.sigla || '',
        precoEmbalagem: embalagem.preco || 0,
      });
    }
    setOpen(false);
  };

  const selectedEmbalagem = value ? embalagens.find(e => e.id === value) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedEmbalagem?.tipo_insumo?.descricao || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Buscar embalagem..." />
          <CommandEmpty>
            {loading ? "Carregando..." : "Nenhuma embalagem encontrada."}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {embalagens.map((embalagem) => (
              <CommandItem
                key={embalagem.id}
                value={embalagem.tipo_insumo?.descricao}
                onSelect={() => handleSelect(embalagem.id)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === embalagem.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span>{embalagem.tipo_insumo?.descricao}</span>
                  <span className="text-xs text-muted-foreground">
                    {embalagem.marca} - {embalagem.tipo_insumo?.quantidade_embalagem} {embalagem.tipo_insumo?.unidade_medida?.sigla} - R$ {embalagem.preco?.toFixed(2)}
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
