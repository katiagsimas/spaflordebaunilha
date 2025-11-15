import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tags da encomenda</CardTitle>
        <CardDescription>
          Categorize esta encomenda para análises e relatórios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tags Selecionadas - Resumo */}
        {tagsSelecionadas.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg border border-border">
            {tagsSelecionadas.map(tag => (
              <Badge
                key={tag.id}
                style={{ 
                  backgroundColor: tag.cor, 
                  color: '#fff',
                  cursor: 'pointer'
                }}
                onClick={() => onTagToggle(tag)}
              >
                {tag.nome}
              </Badge>
            ))}
          </div>
        )}

        {/* Grupos de Tags em 4 Colunas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {GROUP_ORDER.map(grupo => {
            const tags = tagsPorGrupo[grupo];
            if (tags.length === 0) return null;

            return (
              <div key={grupo} className="space-y-3">
                <div className="bg-muted border-l-4 border-primary px-3 py-2 rounded">
                  <h4 className="text-sm font-semibold text-foreground">
                    {GROUP_LABELS[grupo]}
                  </h4>
                </div>
                <div className="flex flex-col gap-2">
                  {tags.map(tag => (
                    <Toggle
                      key={tag.id}
                      pressed={isTagSelecionada(tag.id)}
                      onPressedChange={() => onTagToggle(tag)}
                      className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground justify-start"
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
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
