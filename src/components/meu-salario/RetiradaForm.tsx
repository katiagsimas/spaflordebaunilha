import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCriarRetirada } from "@/hooks/useMeuSalario";
import { getTodayISO } from "@/lib/dateUtils";
import { Plus } from "lucide-react";

export function RetiradaForm() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(getTodayISO());
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const criar = useCriarRetirada();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = Number(valor.replace(",", "."));
    if (!v || v <= 0) return;
    await criar.mutateAsync({ data_retirada: data, valor: v, descricao: descricao || undefined });
    setOpen(false);
    setValor("");
    setDescricao("");
    setData(getTodayISO());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-sfb-terracota hover:bg-sfb-terracota/90 text-sfb-baunilha">
          <Plus className="h-4 w-4 mr-2" />
          Registrar retirada
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[hsl(var(--rd-vinho))]">Nova retirada</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Data</Label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
          </div>
          <div>
            <Label>Valor (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              required
            />
          </div>
          <div>
            <Label>Descrição (opcional)</Label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: pró-labore mensal"
            />
          </div>
          <Button type="submit" className="w-full bg-sfb-terracota hover:bg-sfb-terracota/90 text-sfb-baunilha" disabled={criar.isPending}>
            {criar.isPending ? "Salvando..." : "Salvar retirada"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
