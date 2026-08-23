import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCategorias } from "@/hooks/useCategorias";
import { useProdutosRevenda } from "@/hooks/useProdutosRevenda";
import { useEstoque } from "@/hooks/useEstoque";
import { Badge } from "@/components/ui/badge";

interface RelatorioCategoriasProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RelatorioCategorias({ open, onOpenChange }: RelatorioCategoriasProps) {
  const { categorias } = useCategorias();
  const { produtos } = useProdutosRevenda();
  const { estoque } = useEstoque();

  const metricas = useMemo(() => {
    return categorias.map((cat) => {
      // Filtrar produtos de revenda desta categoria
      const produtosDaCategoria = produtos.filter((p) => p.categoria_id === cat.id);
      
      // Filtrar itens de estoque (insumos/embalagens) que possam estar relacionados
      // Nota: As categorias são compartilhadas, mas os hooks de estoque podem não filtrar por categoria_id diretamente na tabela, 
      // dependendo de como os ingredientes estão estruturados.
      // Se ingredientes tiverem categoria_id:
      // const itensEstoqueDaCategoria = estoque.filter(item => item.ingrediente?.categoria_id === cat.id);
      
      return {
        id: cat.id,
        nome: cat.nome,
        ativo: cat.ativo,
        totalProdutos: produtosDaCategoria.length,
        // Exemplo de métrica de valor ou saldo se disponível
        saldoEstimado: produtosDaCategoria.reduce((acc, p) => acc + (p.preco_venda || 0), 0)
      };
    });
  }, [categorias, produtos]);

  const totais = useMemo(() => {
    return {
      produtos: metricas.reduce((acc, m) => acc + m.totalProdutos, 0),
      valor: metricas.reduce((acc, m) => acc + m.saldoEstimado, 0)
    };
  }, [metricas]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sfb-cacau font-display text-2xl">
            Métricas por Categoria
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-sfb-baunilha p-4 rounded-lg border border-sfb-areia/50">
              <p className="text-xs text-sfb-cacau/70 uppercase font-semibold">Total de Produtos</p>
              <p className="text-2xl font-display text-sfb-terracota">{totais.produtos}</p>
            </div>
            <div className="bg-sfb-baunilha p-4 rounded-lg border border-sfb-areia/50">
              <p className="text-xs text-sfb-cacau/70 uppercase font-semibold">Valor Total Venda (Base)</p>
              <p className="text-2xl font-display text-sfb-terracota">
                {totais.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Produtos</TableHead>
                <TableHead className="text-right">Potencial Venda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metricas.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.nome}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={m.ativo ? "default" : "secondary"} className={m.ativo ? "bg-sfb-salvia" : ""}>
                      {m.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{m.totalProdutos}</TableCell>
                  <TableCell className="text-right font-mono">
                    {m.saldoEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                </TableRow>
              ))}
              {metricas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                    Nenhuma categoria para analisar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
