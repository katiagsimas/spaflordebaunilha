import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMaoObraPerfis } from "@/hooks/useMaoObraPerfis";
import { useUserProfile } from "@/hooks/useUserProfile";
import { MaoObraLinha } from "./MaoObraSection";
import { toast } from "sonner";

interface AdicionarMaoObraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (maoObra: Omit<MaoObraLinha, "id">) => void;
  maosObraExistentes: MaoObraLinha[];
  maoObraEditando?: MaoObraLinha | null;
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
  const [horas, setHoras] = useState<string>("1");

  useEffect(() => {
    if (open && maoObraEditando) {
      setUsarValorPadrao(maoObraEditando.usar_valor_padrao);
      setPerfilId(maoObraEditando.perfil_id || "");
      setHoras(maoObraEditando.horas.toString());
    } else if (open) {
      setUsarValorPadrao(true);
      setPerfilId("");
      setHoras("1");
    }
  }, [open, maoObraEditando]);

  const handleSave = () => {
    const horasNum = parseFloat(horas);

    if (isNaN(horasNum) || horasNum <= 0) {
      toast.error("Informe uma quantidade de horas válida");
      return;
    }

    // Validar se já existe valor padrão (exceto se estiver editando o próprio)
    if (usarValorPadrao) {
      const jaExisteValorPadrao = maosObraExistentes.some(
        (mo) => mo.usar_valor_padrao && mo.id !== maoObraEditando?.id
      );
      if (jaExisteValorPadrao) {
        toast.error("Já existe uma mão de obra com valor padrão cadastrada");
        return;
      }
    }

    // Validar se já existe o perfil específico (exceto se estiver editando o próprio)
    if (!usarValorPadrao && perfilId) {
      const jaExistePerfil = maosObraExistentes.some(
        (mo) => !mo.usar_valor_padrao && mo.perfil_id === perfilId && mo.id !== maoObraEditando?.id
      );
      if (jaExistePerfil) {
        toast.error("Este perfil já está cadastrado");
        return;
      }
    }

    if (!usarValorPadrao && !perfilId) {
      toast.error("Selecione um perfil");
      return;
    }

    onSave({
      usar_valor_padrao: usarValorPadrao,
      perfil_id: usarValorPadrao ? null : perfilId,
      horas: horasNum,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {maoObraEditando ? "Editar Mão de Obra" : "Adicionar Mão de Obra"}
          </DialogTitle>
          <DialogDescription>
            {maoObraEditando
              ? "Edite os dados da mão de obra"
              : "Preencha os dados da mão de obra"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo de Valor</Label>
            <RadioGroup
              value={usarValorPadrao ? "padrao" : "perfil"}
              onValueChange={(value) => {
                setUsarValorPadrao(value === "padrao");
                if (value === "padrao") {
                  setPerfilId("");
                }
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="padrao" id="padrao" />
                <Label htmlFor="padrao" className="cursor-pointer font-normal">
                  Valor padrão (R$ {(profile?.valor_hora || 0).toFixed(2)}/h)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="perfil" id="perfil" />
                <Label htmlFor="perfil" className="cursor-pointer font-normal">
                  Perfil específico
                </Label>
              </div>
            </RadioGroup>
          </div>

          {!usarValorPadrao && (
            <div className="space-y-2">
              <Label htmlFor="perfil">Perfil</Label>
              <Select value={perfilId} onValueChange={setPerfilId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um perfil..." />
                </SelectTrigger>
                <SelectContent>
                  {perfis.filter(p => p.ativo).map((perfil) => (
                    <SelectItem key={perfil.id} value={perfil.id}>
                      {perfil.nome} (R$ {perfil.valor_hora.toFixed(2)}/h)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="horas">Quantidade de Horas</Label>
            <Input
              id="horas"
              type="number"
              min="0"
              step="0.25"
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
              placeholder="1.00"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave}>
            {maoObraEditando ? "Salvar Alterações" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
