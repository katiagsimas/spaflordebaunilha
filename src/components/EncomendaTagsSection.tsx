import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { Tag as TagIcon } from "lucide-react";

interface Tag {
  id: string;
  nome: string;
  cor: string;
  user_id?: string | null;
  padrao_sistema?: boolean;
}

interface EncomendaTagsSectionProps {
  tagsDisponiveis: Tag[];
  tagsSelecionadas: Tag[];
  onTagToggle: (tag: Tag) => void;
}

export function EncomendaTagsSection({ 
  tagsDisponiveis, 
  tagsSelecionadas, 
  onTagToggle 
}: EncomendaTagsSectionProps) {
  
  const isTagSelecionada = (tagId: string) => {
    return tagsSelecionadas.some(t => t.id === tagId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TagIcon className="h-4 w-4" />
          Tags da encomenda
        </CardTitle>
        <CardDescription>
          Categorize esta encomenda para análises e relatórios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tags Selecionadas - Resumo */}
        {tagsSelecionadas.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg border border-border">
            {tagsSelecionadas.map(tag => (
              <Badge
                key={tag.id}
                style={{ 
                  backgroundColor: tag.cor, 
                  color: '#fff',
                  cursor: 'pointer'
                }}
                onClick={() => onTagToggle(tag)}
                className="hover:opacity-80 transition-opacity"
              >
                {tag.nome}
              </Badge>
            ))}
          </div>
        )}

        {/* Lista de Todas as Tags Disponíveis */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Selecione as tags aplicáveis
          </p>
          <div className="flex flex-wrap gap-2">
            {tagsDisponiveis.map(tag => (
              <Toggle
                key={tag.id}
                pressed={isTagSelecionada(tag.id)}
                onPressedChange={() => onTagToggle(tag)}
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                style={{
                  backgroundColor: isTagSelecionada(tag.id) ? tag.cor : undefined,
                  color: isTagSelecionada(tag.id) ? '#fff' : undefined,
                  borderColor: tag.cor,
                }}
              >
                <span className="flex items-center gap-2">
                  {tag.nome}
                  {tag.padrao_sistema && (
                    <span className="text-xs opacity-70">(Sistema)</span>
                  )}
                </span>
              </Toggle>
            ))}
          </div>
        </div>

        {tagsDisponiveis.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <TagIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhuma tag disponível</p>
            <p className="text-xs mt-1">
              Configure tags em Configurações → Cadastros Base → Tags de Encomendas
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
