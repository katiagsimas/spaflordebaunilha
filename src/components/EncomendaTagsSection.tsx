import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag as TagIcon, Package, MapPin, RefreshCw, PartyPopper } from "lucide-react";

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

// Estrutura de agrupamento de tags (somente UI)
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

const GROUP_ICONS = {
  origem: TagIcon,
  tipoEntrega: Package,
  recorrencia: RefreshCw,
  tipoEvento: PartyPopper,
} as const;

export function EncomendaTagsSection({ 
  tagsDisponiveis, 
  tagsSelecionadas, 
  onTagToggle 
}: EncomendaTagsSectionProps) {
  
  const isTagSelecionada = (tagId: string) => {
    return tagsSelecionadas.some(t => t.id === tagId);
  };

  // Agrupar tags por tipo
  const tagsAgrupadas: Record<keyof typeof TAG_GROUPS | 'outros', Tag[]> = {
    origem: [],
    tipoEntrega: [],
    recorrencia: [],
    tipoEvento: [],
    outros: [],
  };

  tagsDisponiveis.forEach(tag => {
    const nomeNormalizado = tag.nome.toLowerCase().trim();
    let encontrado = false;

    // Verificar em qual grupo a tag se encaixa
    if (TAG_GROUPS.origem.includes(nomeNormalizado as any)) {
      tagsAgrupadas.origem.push(tag);
      encontrado = true;
    } else if (TAG_GROUPS.tipoEntrega.includes(nomeNormalizado as any)) {
      tagsAgrupadas.tipoEntrega.push(tag);
      encontrado = true;
    } else if (TAG_GROUPS.recorrencia.includes(nomeNormalizado as any)) {
      tagsAgrupadas.recorrencia.push(tag);
      encontrado = true;
    } else if (TAG_GROUPS.tipoEvento.includes(nomeNormalizado as any)) {
      tagsAgrupadas.tipoEvento.push(tag);
      encontrado = true;
    }

    if (!encontrado) {
      tagsAgrupadas.outros.push(tag);
    }
  });

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
      <CardContent className="space-y-6">
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

        {/* Grupos de Tags */}
        {(Object.keys(TAG_GROUPS) as Array<keyof typeof TAG_GROUPS>).map(grupo => {
          const tags = tagsAgrupadas[grupo];
          if (tags.length === 0) return null;

          const Icon = GROUP_ICONS[grupo];

          return (
            <div key={grupo} className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold text-foreground">
                  {GROUP_LABELS[grupo]}
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge
                    key={tag.id}
                    variant={isTagSelecionada(tag.id) ? "default" : "outline"}
                    style={isTagSelecionada(tag.id) ? { 
                      backgroundColor: tag.cor, 
                      color: '#fff',
                      cursor: 'pointer'
                    } : {
                      borderColor: tag.cor,
                      color: tag.cor,
                      cursor: 'pointer'
                    }}
                    onClick={() => onTagToggle(tag)}
                    className="hover:opacity-80 transition-opacity"
                  >
                    {tag.nome}
                  </Badge>
                ))}
              </div>
            </div>
          );
        })}

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
