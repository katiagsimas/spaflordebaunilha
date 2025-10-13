import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";

interface DadosMes {
  mes: string;
  estoqueInicial: number;
  compras: number;
  estoqueFinal: number;
  faturamento: number;
}

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const dadosIniciais: DadosMes[] = meses.map(mes => ({
  mes,
  estoqueInicial: 0,
  compras: 0,
  estoqueFinal: 0,
  faturamento: 0,
}));

export default function CMVGlobal() {
  const [dados, setDados] = useLocalStorage<DadosMes[]>("cmv_global", dadosIniciais);

  const handleChange = (index: number, campo: keyof Omit<DadosMes, 'mes'>, valor: string) => {
    const novosDados = [...dados];
    novosDados[index] = {
      ...novosDados[index],
      [campo]: parseFloat(valor) || 0,
    };
    setDados(novosDados);
  };

  const calcularCustoMensal = (linha: DadosMes): number => {
    return linha.estoqueInicial + linha.compras - linha.estoqueFinal;
  };

  const calcularCMVGlobal = (linha: DadosMes): number => {
    const custoMensal = calcularCustoMensal(linha);
    if (linha.faturamento === 0) return 0;
    return (custoMensal / linha.faturamento) * 100;
  };

  const handleSave = () => {
    toast.success("Dados salvos com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton to="/planejamento" />
        <div className="flex-1">
          <PageHeader
            title="CMV Global"
            description="Custo de Mercadoria Vendida por mês"
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Mês</TableHead>
                  <TableHead className="text-right">Estoque Inicial</TableHead>
                  <TableHead className="text-right">Compras</TableHead>
                  <TableHead className="text-right">Estoque Final</TableHead>
                  <TableHead className="text-right">Custo Mensal</TableHead>
                  <TableHead className="text-right">Faturamento</TableHead>
                  <TableHead className="text-right">CMV Global (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dados.map((linha, index) => {
                  const custoMensal = calcularCustoMensal(linha);
                  const cmvGlobal = calcularCMVGlobal(linha);

                  return (
                    <TableRow key={linha.mes}>
                      <TableCell className="font-medium">{linha.mes}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={linha.estoqueInicial || ""}
                          onChange={(e) => handleChange(index, "estoqueInicial", e.target.value)}
                          className="text-right"
                          placeholder="0,00"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={linha.compras || ""}
                          onChange={(e) => handleChange(index, "compras", e.target.value)}
                          className="text-right"
                          placeholder="0,00"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={linha.estoqueFinal || ""}
                          onChange={(e) => handleChange(index, "estoqueFinal", e.target.value)}
                          className="text-right"
                          placeholder="0,00"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        R$ {custoMensal.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={linha.faturamento || ""}
                          onChange={(e) => handleChange(index, "faturamento", e.target.value)}
                          className="text-right"
                          placeholder="0,00"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {cmvGlobal.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Dados
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
