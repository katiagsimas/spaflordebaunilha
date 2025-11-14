import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCMVMensal } from "@/hooks/useCMVMensal";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function CMVGlobal() {
  const { dados: dadosBanco, upsertDado, calcularCustoMensal, calcularCMVPercentual } = useCMVMensal();
  const [dadosLocais, setDadosLocais] = useState<{[key: number]: any}>({});
  const anoAtual = new Date().getFullYear();

  // Montar dados combinando banco + locais
  const dados = meses.map((mes, index) => {
    const dadoBanco = dadosBanco.find(d => d.mes === (index + 1));
    const dadoLocal = dadosLocais[index];
    
    return {
      mes,
      estoqueInicial: dadoLocal?.estoque_inicial ?? dadoBanco?.estoque_inicial ?? 0,
      compras: dadoLocal?.compras ?? dadoBanco?.compras ?? 0,
      estoqueFinal: dadoLocal?.estoque_final ?? dadoBanco?.estoque_final ?? 0,
      faturamento: dadoLocal?.faturamento ?? dadoBanco?.faturamento ?? 0,
    };
  });

  const handleChange = (index: number, campo: string, valor: string) => {
    setDadosLocais(prev => ({
      ...prev,
      [index]: {
        ...(prev[index] || {}),
        [campo]: parseFloat(valor) || 0,
      }
    }));
  };

  const handleSave = () => {
    // Salvar todos os meses que foram alterados
    Object.keys(dadosLocais).forEach(indexStr => {
      const index = parseInt(indexStr);
      const dadoLocal = dadosLocais[index];
      
      upsertDado({
        ano: anoAtual,
        mes: index + 1,
        updates: {
          estoque_inicial: dadoLocal.estoque_inicial ?? 0,
          compras: dadoLocal.compras ?? 0,
          estoque_final: dadoLocal.estoque_final ?? 0,
          faturamento: dadoLocal.faturamento ?? 0,
        }
      });
    });
    
    setDadosLocais({});
    toast.success("Dados salvos com sucesso!");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="CMV Global"
        description="Custo de Mercadoria Vendida por mês"
        backButton={<BackButton to="/planejamento" />}
      />

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
                  const custoMensal = linha.estoqueInicial + linha.compras - linha.estoqueFinal;
                  const cmvGlobal = linha.faturamento === 0 ? 0 : (custoMensal / linha.faturamento) * 100;

                  return (
                    <TableRow key={linha.mes}>
                      <TableCell className="font-medium">{linha.mes}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={linha.estoqueInicial || ""}
                          onChange={(e) => handleChange(index, "estoque_inicial", e.target.value)}
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
                          onChange={(e) => handleChange(index, "estoque_final", e.target.value)}
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
