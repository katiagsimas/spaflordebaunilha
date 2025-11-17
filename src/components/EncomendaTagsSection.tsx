import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const TAG_GROUPS = {
  origem: [
    "instagram",
    "whatsapp",
    "indicação",
    "google maps",
    "fidelização interna",
    "parceria local",
  ],
  tipoEntrega: [
    "retirada",
    "delivery",
  ],
  recorrencia: [
    "primeira compra",
    "cliente recorrente",
    "assinatura",
  ],
  tipoEvento: [
    "aniversário infantil",
    "aniversário adulto",
    "mesversário",
    "batizado",
    "casamento",
    "noivado",
    "chá de bebê",
    "chá de fraldas",
    "empresarial",
  ],
} as const;

const GROUP_LABELS = {
  tipoEvento: "Tipo de evento",
  origem: "Origem do pedido",
  tipoEntrega: "Tipo de entrega",
  recorrencia: "Recorrência",
} as const;

const GROUP_ORDER = ['tipoEvento', 'origem', 'tipoEntrega', 'recorrencia'] as const;

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
  
  // Estados para controlar abertura de cada grupo
  const [gruposAbertos, setGruposAbertos] = useState<Record<string, boolean>>({
    tipoEvento: false,
    origem: false,
    tipoEntrega: false,
    recorrencia: false,
  });

  const toggleGrupo = (grupo: string) => {
    setGruposAbertos(prev => ({
      ...prev,
      [grupo]: !prev[grupo]
    }));
  };
  
  // Agrupar tags disponíveis por tipo
  const tagsPorGrupo = {
    origem: [] as Tag[],
    tipoEntrega: [] as Tag[],
    recorrencia: [] as Tag[],
    tipoEvento: [] as Tag[],
    outros: [] as Tag[],
  };

  tagsDisponiveis.forEach(tag => {
    const nomeNormalizado = tag.nome.toLowerCase().trim();
    let encontrou = false;

    for (const [grupo, nomes] of Object.entries(TAG_GROUPS)) {
      if (nomes.some(n => n.toLowerCase() === nomeNormalizado)) {
        tagsPorGrupo[grupo as keyof typeof TAG_GROUPS].push(tag);
        encontrou = true;
        break;
      }
    }

    if (!encontrou) {
      tagsPorGrupo.outros.push(tag);
    }
  });

  const isTagSelecionada = (tagId: string) => {
    return tagsSelecionadas.some(t => t.id === tagId);
  };

  // Contar tags selecionadas por grupo
  const contarTagsGrupo = (grupo: keyof typeof tagsPorGrupo) => {
    const tagsGrupo = tagsPorGrupo[grupo];
    return tagsGrupo.filter(tag => isTagSelecionada(tag.id)).length;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tags da encomenda</CardTitle>
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

        {/* Grupos de Tags - Collapsibles em linha */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {GROUP_ORDER.map(grupo => {
            const tags = tagsPorGrupo[grupo];
            if (tags.length === 0) return null;

            const tagsCount = contarTagsGrupo(grupo);
            const isOpen = gruposAbertos[grupo];

            return (
              <Collapsible
                key={grupo}
                open={isOpen}
                onOpenChange={() => toggleGrupo(grupo)}
                className="border rounded-lg bg-card shadow-sm flex-1 min-w-[200px]"
              >
                <CollapsibleTrigger className="w-full p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-5 bg-primary rounded-full" />
                      <span className="text-sm font-semibold text-foreground">
                        {GROUP_LABELS[grupo]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {tagsCount > 0 && (
                        <Badge variant="secondary" className="h-5 min-w-5 px-1.5">
                          {tagsCount}
                        </Badge>
                      )}
                      <ChevronDown 
                        className={`h-4 w-4 text-muted-foreground transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="px-3 pb-3">
                  <div className="space-y-2 pt-2 border-t">
                    {tags.map(tag => (
                      <Toggle
                        key={tag.id}
                        pressed={isTagSelecionada(tag.id)}
                        onPressedChange={() => onTagToggle(tag)}
                        className="w-full justify-start text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                        style={
                          isTagSelecionada(tag.id)
                            ? {
                                backgroundColor: tag.cor,
                                color: '#fff',
                                borderColor: tag.cor,
                              }
                            : {}
                        }
                      >
                        {tag.nome}
                      </Toggle>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
