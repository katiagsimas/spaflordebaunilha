import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTransferenciaBancos } from "@/hooks/useTransferenciaBancos";
import { getTodayISO } from "@/lib/dateUtils";

interface Banco {
  id: string;
  nome: string;
  saldo_inicial: number;
}

interface TransferenciaBancosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferenciaBancosModal({ open, onOpenChange }: TransferenciaBancosModalProps) {
  const { user } = useAuth();
  const { realizarTransferencia } = useTransferenciaBancos();
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [origemId, setOrigemId] = useState("");
  const [destinoId, setDestinoId] = useState("");
  const [valor, setValor] = useState("");
  const [dataTransferencia, setDataTransferencia] = useState(getTodayISO());
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      carregarBancos();
      resetForm();
    }
  }, [open, user]);

  async function carregarBancos() {
    const { data } = await supabase
      .from("bancos")
      .select("id, nome, saldo_inicial")
      .eq("usuario_id", user!.id)
      .order("nome");

    setBancos(data || []);
  }

  function resetForm() {
    setOrigemId("");
    setDestinoId("");
    setValor("");
    setDataTransferencia(getTodayISO());
    setDescricao("");
  }

  const bancoOrigem = bancos.find((b) => b.id === origemId);
  const valorNumerico = parseFloat(valor.replace(",", ".")) || 0;

  const isValid =
    origemId &&
    destinoId &&
    origemId !== destinoId &&
    valorNumerico > 0 &&
    dataTransferencia;

  async function handleSubmit() {
    if (!isValid) return;
    setLoading(true);
    try {
      await realizarTransferencia.mutateAsync({
        banco_origem_id: origemId,
        banco_destino_id: destinoId,
        valor: valorNumerico,
        data_transferencia: dataTransferencia,
        descricao: descricao || undefined,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            Transferência entre Bancos
          </DialogTitle>
          <DialogDescription>
            Movimente valores entre suas contas cadastradas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Conta Origem */}
          <div className="space-y-2">
            <Label>Conta de Origem *</Label>
            <Select value={origemId} onValueChange={setOrigemId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta de origem" />
              </SelectTrigger>
              <SelectContent>
                {bancos
                  .filter((b) => b.id !== destinoId)
                  .map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.nome} (R$ {b.saldo_inicial.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {bancoOrigem && (
              <p className="text-xs text-muted-foreground">
                Saldo disponível: R$ {bancoOrigem.saldo_inicial.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>

          {/* Conta Destino */}
          <div className="space-y-2">
            <Label>Conta de Destino *</Label>
            <Select value={destinoId} onValueChange={setDestinoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta de destino" />
              </SelectTrigger>
              <SelectContent>
                {bancos
                  .filter((b) => b.id !== origemId)
                  .map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.nome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label>Valor (R$) *</Label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
            {bancoOrigem && valorNumerico > bancoOrigem.saldo_inicial && (
              <p className="text-xs text-destructive">
                Valor excede o saldo disponível
              </p>
            )}
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label>Data *</Label>
            <Input
              type="date"
              value={dataTransferencia}
              onChange={(e) => setDataTransferencia(e.target.value)}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              placeholder="Motivo ou observação da transferência..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Transferindo...
              </>
            ) : (
              "Confirmar Transferência"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
