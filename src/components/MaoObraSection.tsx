import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useMaoObraPerfis } from "@/hooks/useMaoObraPerfis";
import { useUserProfile } from "@/hooks/useUserProfile";

export interface MaoObraLinha {
  id: string;
  usar_valor_padrao: boolean;
  perfil_id: string | null;
  horas: number;
}

interface MaoObraSectionProps {
  maosObra: MaoObraLinha[];
  onChange: (maosObra: MaoObraLinha[]) => void;
}

export function MaoObraSection({ maosObra, onChange }: MaoObraSectionProps) {
  const { perfis } = useMaoObraPerfis();
  const { profile } = useUserProfile();

  const adicionarLinha = () => {
    const novaLinha: MaoObraLinha = {
      id: `temp-${Date.now()}`,
      usar_valor_padrao: true,
      perfil_id: null,
      horas: 1,
    };
    onChange([...maosObra, novaLinha]);
  };

  const removerLinha = (id: string) => {
    onChange(maosObra.filter((linha) => linha.id !== id));
  };

  const atualizarLinha = (id: string, campo: keyof MaoObraLinha, valor: any) => {
    onChange(
      maosObra.map((linha) =>
        linha.id === id ? { ...linha, [campo]: valor } : linha
      )
    );
  };

  const calcularValorHora = (linha: MaoObraLinha): number => {
    if (linha.usar_valor_padrao) {
      return profile?.valor_hora || 0;
    } else if (linha.perfil_id) {
      const perfil = perfis.find((p) => p.id === linha.perfil_id);
      return perfil?.valor_hora || 0;
    }
    return 0;
  };

  const calcularCustoLinha = (linha: MaoObraLinha): number => {
    return calcularValorHora(linha) * linha.horas;
  };

  const custoTotal = maosObra.reduce((sum, linha) => sum + calcularCustoLinha(linha), 0);

  return (
    <div className="space-y-4 p-4 rounded-lg bg-card border">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-sm">Mão de Obra desta Receita</h4>
        <Button type="button" variant="default" size="sm" onClick={adicionarLinha}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Mão de Obra
        </Button>
      </div>

      {maosObra.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de Valor</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead className="w-[120px]">Horas</TableHead>
                  <TableHead className="w-[120px]">Valor/Hora</TableHead>
                  <TableHead className="w-[120px]">Custo Total</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maosObra.map((linha) => (
                  <TableRow key={linha.id}>
                    <TableCell>
                      <RadioGroup
                        value={linha.usar_valor_padrao ? "padrao" : "perfil"}
                        onValueChange={(value) => {
                          atualizarLinha(linha.id, "usar_valor_padrao", value === "padrao");
                          if (value === "padrao") {
                            atualizarLinha(linha.id, "perfil_id", null);
                          }
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="padrao" id={`padrao-${linha.id}`} />
                          <Label htmlFor={`padrao-${linha.id}`} className="cursor-pointer">
                            Valor padrão
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="perfil" id={`perfil-${linha.id}`} />
                          <Label htmlFor={`perfil-${linha.id}`} className="cursor-pointer">
                            Perfil específico
                          </Label>
                        </div>
                      </RadioGroup>
                    </TableCell>
                    <TableCell>
                      {linha.usar_valor_padrao ? (
                        <span className="text-muted-foreground text-sm">
                          Padrão (R$ {(profile?.valor_hora || 0).toFixed(2)}/h)
                        </span>
                      ) : (
                        <Select
                          value={linha.perfil_id || ""}
                          onValueChange={(value) => atualizarLinha(linha.id, "perfil_id", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {perfis.filter(p => p.ativo).map((perfil) => (
                              <SelectItem key={perfil.id} value={perfil.id}>
                                {perfil.nome} (R$ {perfil.valor_hora.toFixed(2)}/h)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.25"
                        value={linha.horas}
                        onChange={(e) =>
                          atualizarLinha(linha.id, "horas", parseFloat(e.target.value) || 0)
                        }
                        placeholder="1.00"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {calcularValorHora(linha).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {calcularCustoLinha(linha).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removerLinha(linha.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <div className="text-right">
              <span className="text-sm text-muted-foreground">Custo Total de Mão de Obra: </span>
              <span className="font-semibold text-lg">R$ {custoTotal.toFixed(2)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
