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
  origem: "Origem do pedido",
  tipoEntrega: "Tipo de entrega",
  recorrencia: "Recorrência",
  tipoEvento: "Tipo de evento",
} as const;

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

        {/* Grupos de Tags */}
        {Object.entries(tagsPorGrupo).map(([grupo, tags]) => {
          // Não exibir grupos vazios (exceto "outros" que sempre escondemos)
          if (tags.length === 0 || grupo === 'outros') return null;

          return (
            <div key={grupo} className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">
                {GROUP_LABELS[grupo as keyof typeof GROUP_LABELS]}
              </h4>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Toggle
                    key={tag.id}
                    pressed={isTagSelecionada(tag.id)}
                    onPressedChange={() => onTagToggle(tag)}
                    className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
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
      </CardContent>
    </Card>
  );
}
