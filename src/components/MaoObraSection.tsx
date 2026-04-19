import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useMaoObraPerfis } from "@/hooks/useMaoObraPerfis";
import { AdicionarMaoObraDialog } from "./AdicionarMaoObraDialog";

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
  const perfilPadrao = perfis.find((p) => p.padrao && p.ativo);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [maoObraEditando, setMaoObraEditando] = useState<MaoObraLinha | null>(null);

  const handleSaveMaoObra = (maoObra: Omit<MaoObraLinha, "id">) => {
    if (maoObraEditando) {
      // Editando existente
      onChange(
        maosObra.map((linha) =>
          linha.id === maoObraEditando.id
            ? { ...linha, ...maoObra }
            : linha
        )
      );
      setMaoObraEditando(null);
    } else {
      // Adicionando nova
      const novaLinha: MaoObraLinha = {
        id: `temp-${Date.now()}`,
        ...maoObra,
      };
      onChange([...maosObra, novaLinha]);
    }
  };

  const handleEditarLinha = (linha: MaoObraLinha) => {
    setMaoObraEditando(linha);
    setDialogOpen(true);
  };

  const removerLinha = (id: string) => {
    onChange(maosObra.filter((linha) => linha.id !== id));
  };

  const handleOpenDialog = () => {
    setMaoObraEditando(null);
    setDialogOpen(true);
  };

  const calcularValorHora = (linha: MaoObraLinha): number => {
    if (linha.usar_valor_padrao) {
      return perfilPadrao?.valor_hora || 0;
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
    <div className="space-y-4">
      <Button type="button" variant="default" size="sm" onClick={handleOpenDialog}>
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Mão de Obra
      </Button>

      {maosObra.length > 0 && (
        <div className="p-4 rounded-lg bg-card border space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-sm">Mão de Obra desta Receita</h4>
            <Button type="button" variant="default" size="sm" onClick={handleOpenDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Outra Mão de Obra
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de Valor</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead className="w-[120px]">Horas</TableHead>
                  <TableHead className="w-[120px]">Valor/Hora</TableHead>
                  <TableHead className="w-[120px]">Custo Total</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maosObra.map((linha) => {
                  const perfil = perfis.find((p) => p.id === linha.perfil_id);
                  return (
                    <TableRow key={linha.id}>
                      <TableCell>
                        {linha.usar_valor_padrao ? "Valor padrão" : "Perfil específico"}
                      </TableCell>
                      <TableCell>
                        {linha.usar_valor_padrao ? (
                          <span className="text-muted-foreground text-sm">
                            {perfilPadrao ? `${perfilPadrao.nome} (R$ ${perfilPadrao.valor_hora.toFixed(2)}/h)` : "Sem perfil padrão"}
                          </span>
                        ) : (
                          <span className="text-sm">
                            {perfil?.nome || "N/A"} (R$ {(perfil?.valor_hora || 0).toFixed(2)}/h)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {linha.horas.toFixed(2)}h
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {calcularValorHora(linha).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {calcularCustoLinha(linha).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditarLinha(linha)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removerLinha(linha.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <div className="text-right">
              <span className="text-sm text-muted-foreground">Custo Total de Mão de Obra: </span>
              <span className="font-semibold text-lg">R$ {custoTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      <AdicionarMaoObraDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveMaoObra}
        maosObraExistentes={maosObra}
        maoObraEditando={maoObraEditando}
      />
    </div>
  );
}
