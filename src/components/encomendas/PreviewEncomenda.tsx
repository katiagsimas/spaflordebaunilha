import { Package, User, Calendar, DollarSign, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Item {
  id: string;
  produto: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
  unidade_medida: string;
}

interface Tag {
  id: string;
  nome: string;
  cor: string;
}

interface ValidacaoEstoque {
  tem_estoque: boolean;
  itens_faltantes: Array<{
    ingrediente: string;
    necessario: number;
    disponivel: number;
    faltam: number;
    unidade: string;
  }>;
}

interface PreviewEncomendaProps {
  dados: {
    cliente: string;
    data_pedido: string;
    data_entrega: string;
    hora_entrega?: string;
    valor: number;
    itens: Item[];
    tags?: Tag[];
    observacoes_cliente?: string;
    observacoes_internas?: string;
  };
  validacaoEstoque?: ValidacaoEstoque;
}

export function PreviewEncomenda({ dados, validacaoEstoque }: PreviewEncomendaProps) {
  const { cliente, data_pedido, data_entrega, hora_entrega, valor, itens, tags, observacoes_cliente, observacoes_internas } = dados;

  // Calcular dias até a entrega
  const diasAteEntrega = data_entrega ? differenceInDays(parseISO(data_entrega), new Date()) : null;
  
  // Formatar data de entrega
  const dataEntregaFormatada = data_entrega 
    ? format(parseISO(data_entrega), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "";

  return (
    <Card className="border-2 border-primary/30 shadow-lg animate-in fade-in duration-300">
      <CardHeader className="bg-primary/5 border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Package className="h-5 w-5" />
          Resumo da Encomenda
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Cliente e Datas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cliente */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Cliente</span>
            </div>
            <p className="text-lg font-semibold">{cliente}</p>
          </div>

          {/* Data de Entrega */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Data de Entrega</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold">
                {dataEntregaFormatada}
                {hora_entrega && ` às ${hora_entrega}`}
              </p>
              {diasAteEntrega !== null && (
                <Badge 
                  className={
                    diasAteEntrega < 0 
                      ? "bg-red-500" 
                      : diasAteEntrega <= 2 
                      ? "bg-orange-500" 
                      : "bg-green-500"
                  }
                >
                  {diasAteEntrega < 0 
                    ? `${Math.abs(diasAteEntrega)} dias atrasado` 
                    : diasAteEntrega === 0 
                    ? "HOJE" 
                    : diasAteEntrega === 1 
                    ? "Amanhã" 
                    : `${diasAteEntrega} dias`}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Itens */}
        {itens.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase">
              Itens da Encomenda
            </h4>
            <div className="space-y-2">
              {itens.map((item, index) => (
                <Card key={item.id || index} className="border-l-4 border-l-primary/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{item.produto}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantidade} {item.unidade_medida} × R$ {item.valor_unitario.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          R$ {item.subtotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Valor Total */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold text-muted-foreground">
                Valor Total
              </span>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">
                R$ {valor.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase">
              Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  style={{ backgroundColor: tag.cor, color: '#fff' }}
                >
                  {tag.nome}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Alertas de Estoque */}
        {validacaoEstoque && !validacaoEstoque.tem_estoque && validacaoEstoque.itens_faltantes.length > 0 && (
          <div className="rounded-lg border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  Atenção: Estoque Insuficiente
                </h4>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Faltam {validacaoEstoque.itens_faltantes.length} ingrediente(s) para produzir esta encomenda.
                  Será necessário realizar compras antes da produção.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Observações (resumo) */}
        {(observacoes_cliente || observacoes_internas) && (
          <div className="space-y-3 pt-2 border-t">
            {observacoes_cliente && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase">
                    Observações do Cliente
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    Visível no recibo
                  </Badge>
                </div>
                <p className="text-sm text-foreground line-clamp-2">
                  {observacoes_cliente.length > 100 
                    ? `${observacoes_cliente.substring(0, 100)}...` 
                    : observacoes_cliente}
                </p>
              </div>
            )}
            
            {observacoes_internas && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300 uppercase">
                    Observações Internas
                  </h4>
                  <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950">
                    Apenas equipe
                  </Badge>
                </div>
                <p className="text-sm text-amber-800 dark:text-amber-200 line-clamp-2">
                  {observacoes_internas.length > 100 
                    ? `${observacoes_internas.substring(0, 100)}...` 
                    : observacoes_internas}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
