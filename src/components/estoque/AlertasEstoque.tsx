import { AlertCircle, AlertTriangle, XCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AlertasEstoqueProps {
  alertas: {
    zerado: number;
    baixo: number;
    atencao: number;
    semRastreio: number;
  };
}

export function AlertasEstoque({ alertas }: AlertasEstoqueProps) {
  const temAlertas = alertas.zerado > 0 || alertas.baixo > 0 || alertas.atencao > 0;

  if (!temAlertas) return null;

  return (
    <div className="space-y-3">
      {alertas.zerado > 0 && (
        <Alert variant="destructive" className="border-red-500/50 bg-red-50 dark:bg-red-950/20">
          <XCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            <span className="text-red-700 dark:text-red-400">
              {alertas.zerado} {alertas.zerado === 1 ? 'item zerado' : 'itens zerados'}!
            </span>{' '}
            <span className="text-red-600 dark:text-red-500">
              É necessário fazer compras urgentemente.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {alertas.baixo > 0 && (
        <Alert variant="destructive" className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            <span className="text-orange-700 dark:text-orange-400">
              {alertas.baixo} {alertas.baixo === 1 ? 'item está' : 'itens estão'} no estoque mínimo.
            </span>{' '}
            <span className="text-orange-600 dark:text-orange-500">
              Programe suas compras.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {alertas.atencao > 0 && (
        <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="font-medium">
            <span className="text-amber-700 dark:text-amber-400">
              {alertas.atencao} {alertas.atencao === 1 ? 'item próximo' : 'itens próximos'} do mínimo.
            </span>{' '}
            <span className="text-amber-600 dark:text-amber-500">
              Fique atenta!
            </span>
          </AlertDescription>
        </Alert>
      )}

      {alertas.semRastreio > 0 && (
        <Alert className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="font-medium">
            <span className="text-blue-700 dark:text-blue-400">
              {alertas.semRastreio} {alertas.semRastreio === 1 ? 'item sem' : 'itens sem'} rastreamento.
            </span>{' '}
            <span className="text-blue-600 dark:text-blue-500">
              Ative quando estiver pronta!
            </span>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
