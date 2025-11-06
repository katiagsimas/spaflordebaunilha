import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTags, Tag } from '@/hooks/useTags';
import { Skeleton } from '@/components/ui/skeleton';

interface SeletorTagsProps {
  tagsSelecionadas: Tag[];
  onChange: (tags: Tag[]) => void;
}

export function SeletorTags({ tagsSelecionadas, onChange }: SeletorTagsProps) {
  const { categorias, loading, getTagsPorCategoria } = useTags();

  const toggleTag = (tag: Tag) => {
    const jaExiste = tagsSelecionadas.find(t => t.id === tag.id);
    
    if (jaExiste) {
      onChange(tagsSelecionadas.filter(t => t.id !== tag.id));
    } else {
      onChange([...tagsSelecionadas, tag]);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categorias.map(categoria => {
        const tagsCategoria = getTagsPorCategoria(categoria.id);
        
        return (
          <div key={categoria.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{categoria.icone}</span>
              <Label className="text-base font-semibold">
                {categoria.nome}
                {categoria.descricao && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({categoria.descricao})
                  </span>
                )}
              </Label>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {tagsCategoria.map(tag => {
                const selecionada = tagsSelecionadas.find(t => t.id === tag.id);
                
                return (
                  <Button
                    key={tag.id}
                    type="button"
                    variant={selecionada ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleTag(tag)}
                    className="relative"
                    style={{
                      backgroundColor: selecionada ? tag.cor : 'transparent',
                      borderColor: tag.cor,
                      color: selecionada ? 'white' : tag.cor,
                    }}
                  >
                    {selecionada && <Check className="h-3 w-3 mr-1" />}
                    {tag.nome}
                  </Button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
