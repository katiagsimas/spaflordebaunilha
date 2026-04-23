import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useMaoObraPerfis } from "@/hooks/useMaoObraPerfis";
import type { MaoObraLinha } from "./MaoObraSection";

interface AdicionarMaoObraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (maoObra: Omit<MaoObraLinha, "id">) => void;
  maosObraExistentes: MaoObraLinha[];
  maoObraEditando: MaoObraLinha | null;
}

export function AdicionarMaoObraDialog({
  open,
  onOpenChange,
  onSave,
  maosObraExistentes,
  maoObraEditando,
}: AdicionarMaoObraDialogProps) {
  const { perfis } = useMaoObraPerfis();
  const perfilPadrao = perfis.find((p) => p.padrao && p.ativo);

  const [usarValorPadrao, setUsarValorPadrao] = useState(true);
  const [perfilId, setPerfilId] = useState<string>("");
  const [horas, setHoras] = useState("");
  const [minutos, setMinutos] = useState("");

  useEffect(() => {
    if (maoObraEditando) {
      setUsarValorPadrao(maoObraEditando.usar_valor_padrao);
      setPerfilId(maoObraEditando.perfil_id || "");
      const totalMin = Math.round((maoObraEditando.horas || 0) * 60);
      setHoras(String(Math.floor(totalMin / 60)));
      setMinutos(String(totalMin % 60));
    } else {
      setUsarValorPadrao(true);
      setPerfilId("");
      setHoras("");
      setMinutos("");
    }
  }, [maoObraEditando, open]);

  const horasInt = parseInt(horas, 10) || 0;
  const minutosInt = parseInt(minutos, 10) || 0;
  const horasDecimais = horasInt + minutosInt / 60;

  const handleSave = () => {
    if (horasDecimais <= 0 || minutosInt < 0 || minutosInt >= 60) return;

    onSave({
      usar_valor_padrao: usarValorPadrao,
      perfil_id: usarValorPadrao ? null : perfilId || null,
      horas: horasDecimais,
    });
    onOpenChange(false);
  };

  const valorHoraPreview = usarValorPadrao
    ? (perfilPadrao?.valor_hora || 0)
    : (perfis.find((p) => p.id === perfilId)?.valor_hora || 0);

  const horasNum = horasDecimais;
  const custoPreview = valorHoraPreview * horasNum;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {maoObraEditando ? "Editar Mão de Obra" : "Adicionar Mão de Obra"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={usarValorPadrao}
              onCheckedChange={setUsarValorPadrao}
            />
            <Label>
              Usar perfil padrão {perfilPadrao ? `(${perfilPadrao.nome} - R$ ${perfilPadrao.valor_hora.toFixed(2)}/h)` : "(nenhum perfil padrão definido)"}
            </Label>
          </div>

          {!usarValorPadrao && (
            <div className="space-y-2">
              <Label>Perfil de Mão de Obra</Label>
              <Select value={perfilId} onValueChange={setPerfilId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent>
                  {perfis.filter(p => p.ativo).map((perfil) => (
                    <SelectItem key={perfil.id} value={perfil.id}>
                      {perfil.nome} - R$ {perfil.valor_hora.toFixed(2)}/h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Tempo de Preparo</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="Horas"
                  value={horas}
                  onChange={(e) => setHoras(e.target.value.replace(/[^\d]/g, ""))}
                />
                <span className="text-xs text-muted-foreground">Horas</span>
              </div>
              <div className="space-y-1">
                <Input
                  type="number"
                  step="1"
                  min="0"
                  max="59"
                  placeholder="Minutos"
                  value={minutos}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^\d]/g, "");
                    const n = parseInt(v, 10);
                    if (v === "" || (n >= 0 && n <= 59)) setMinutos(v);
                  }}
                />
                <span className="text-xs text-muted-foreground">Minutos (0-59)</span>
              </div>
            </div>
          </div>

          {horasNum > 0 && (
            <div className="p-3 rounded-lg bg-muted text-sm space-y-1">
              <div className="flex justify-between">
                <span>Tempo total:</span>
                <span>
                  {horasInt > 0 && `${horasInt}h`}
                  {horasInt > 0 && minutosInt > 0 && " "}
                  {minutosInt > 0 && `${minutosInt}min`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Valor/hora:</span>
                <span>R$ {valorHoraPreview.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Custo estimado:</span>
                <span>R$ {custoPreview.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={horasNum <= 0 || (!usarValorPadrao && !perfilId)}
          >
            {maoObraEditando ? "Salvar" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
