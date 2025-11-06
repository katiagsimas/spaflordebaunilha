import { AlertTriangle, Package } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface ItemFaltante {
  ingrediente: string;
  necessario: number;
  disponivel: number;
  faltam: number;
  unidade: string;
}

interface AlertaEstoqueProps {
  itensFaltantes: ItemFaltante[];
}

export function AlertaEstoque({ itensFaltantes }: AlertaEstoqueProps) {
  if (!itensFaltantes || itensFaltantes.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="border-red-500/50 bg-red-50 dark:bg-red-950/20">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-lg font-semibold mb-3">
        Estoque Insuficiente
      </AlertTitle>
      <AlertDescription>
        <div className="space-y-3 mb-4">
          {itensFaltantes.map((item, index) => (
            <div 
              key={index} 
              className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-white dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800"
            >
              <div className="flex items-center gap-2 flex-1">
                <Package className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <span className="font-medium text-red-900 dark:text-red-100">
                  {item.ingrediente}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                  Necessário: {item.necessario.toFixed(2)} {item.unidade}
                </Badge>
                <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">
                  Disponível: {item.disponivel.toFixed(2)} {item.unidade}
                </Badge>
                <Badge className="bg-red-600 dark:bg-red-700 text-white font-bold">
                  Faltam: {item.faltam.toFixed(2)} {item.unidade}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            ⚠️ Você pode salvar a encomenda, mas precisará comprar estes ingredientes antes de produzir.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
