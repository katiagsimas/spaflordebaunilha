import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useMaoObraPerfis } from "@/hooks/useMaoObraPerfis";
import { useUserProfile } from "@/hooks/useUserProfile";
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
  const { profile } = useUserProfile();

  const [usarValorPadrao, setUsarValorPadrao] = useState(true);
  const [perfilId, setPerfilId] = useState<string>("");
  const [horas, setHoras] = useState("");

  useEffect(() => {
    if (maoObraEditando) {
      setUsarValorPadrao(maoObraEditando.usar_valor_padrao);
      setPerfilId(maoObraEditando.perfil_id || "");
      setHoras(maoObraEditando.horas.toString());
    } else {
      setUsarValorPadrao(true);
      setPerfilId("");
      setHoras("");
    }
  }, [maoObraEditando, open]);

  const handleSave = () => {
    const horasNum = parseFloat(horas);
    if (isNaN(horasNum) || horasNum <= 0) return;

    onSave({
      usar_valor_padrao: usarValorPadrao,
      perfil_id: usarValorPadrao ? null : perfilId || null,
      horas: horasNum,
    });
    onOpenChange(false);
  };

  const valorHoraPreview = usarValorPadrao
    ? (profile?.valor_hora || 0)
    : (perfis.find((p) => p.id === perfilId)?.valor_hora || 0);

  const horasNum = parseFloat(horas) || 0;
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
            <Label>Usar valor padrão (R$ {(profile?.valor_hora || 0).toFixed(2)}/h)</Label>
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
            <Label>Horas</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Ex: 2.5"
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
            />
          </div>

          {horasNum > 0 && (
            <div className="p-3 rounded-lg bg-muted text-sm space-y-1">
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
