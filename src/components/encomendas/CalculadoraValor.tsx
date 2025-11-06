import { useState, useEffect } from "react";
import { Calculator, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Item {
  receita_id: string;
  quantidade: number;
  valor_unitario: number;
}

interface CalculadoraValorProps {
  itens: Item[];
  valorManual?: number;
  onChange: (valor: number, isManual: boolean) => void;
}

export function CalculadoraValor({ itens, valorManual, onChange }: CalculadoraValorProps) {
  const [modoManual, setModoManual] = useState(false);
  const [valor, setValor] = useState(0);

  // Calcular valor automático baseado nos itens
  const valorAutomatico = itens.reduce(
    (total, item) => total + (item.quantidade * item.valor_unitario),
    0
  );

  // Atualizar valor quando itens mudam (apenas em modo automático)
  useEffect(() => {
    if (!modoManual) {
      setValor(valorAutomatico);
      onChange(valorAutomatico, false);
    }
  }, [valorAutomatico, modoManual]);

  // Inicializar com valor manual se fornecido
  useEffect(() => {
    if (valorManual && valorManual !== valorAutomatico) {
      setModoManual(true);
      setValor(valorManual);
    }
  }, []);

  const handleToggleModo = (checked: boolean) => {
    setModoManual(checked);
    if (!checked) {
      // Voltando para modo automático
      setValor(valorAutomatico);
      onChange(valorAutomatico, false);
    } else {
      // Ativando modo manual, mantém o valor atual
      onChange(valor, true);
    }
  };

  const handleValorChange = (novoValor: number) => {
    setValor(novoValor);
    onChange(novoValor, true);
  };

  const diferencaPercentual = valorAutomatico > 0
    ? ((valor - valorAutomatico) / valorAutomatico) * 100
    : 0;

  return (
    <Card className="border-2 border-primary/20">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header com Switch */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {modoManual ? (
                <Lock className="h-5 w-5 text-amber-600" />
              ) : (
                <Calculator className="h-5 w-5 text-primary" />
              )}
              <h3 className="text-lg font-semibold">
                Valor Total da Encomenda
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="modo-manual" className="text-sm text-muted-foreground">
                Modo Manual
              </Label>
              <Switch
                id="modo-manual"
                checked={modoManual}
                onCheckedChange={handleToggleModo}
              />
            </div>
          </div>

          {/* Modo Automático */}
          {!modoManual && (
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground">R$</span>
                <span className="text-4xl font-bold text-primary">
                  {valorAutomatico.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calculator className="h-3 w-3" />
                Baseado nos preços cadastrados nas fichas técnicas
              </p>
            </div>
          )}

          {/* Modo Manual */}
          {modoManual && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">R$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valor}
                  onChange={(e) => handleValorChange(Number(e.target.value))}
                  className="text-2xl font-bold h-14"
                />
              </div>

              {/* Comparação com valor sugerido */}
              {Math.abs(valor - valorAutomatico) > 0.01 && (
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Valor sugerido (automático):
                    </span>
                    <span className="font-medium">
                      R$ {valorAutomatico.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    {diferencaPercentual > 0 ? (
                      <>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          +{diferencaPercentual.toFixed(1)}%
                        </Badge>
                        <span className="text-xs text-green-700 dark:text-green-300">
                          R$ {(valor - valorAutomatico).toFixed(2)} acima do sugerido
                        </span>
                      </>
                    ) : (
                      <>
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                          {diferencaPercentual.toFixed(1)}%
                        </Badge>
                        <span className="text-xs text-red-700 dark:text-red-300">
                          R$ {(valorAutomatico - valor).toFixed(2)} abaixo do sugerido
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Valor manual - não será atualizado automaticamente ao adicionar itens
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
