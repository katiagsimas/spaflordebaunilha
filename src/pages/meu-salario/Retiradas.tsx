import { useMemo, useState } from "react";
import { useResumoMesAnterior, useRetiradas, useExcluirRetirada, formatBRL } from "@/hooks/useMeuSalario";
import { RetiradaForm } from "@/components/meu-salario/RetiradaForm";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { formatDateBR, getTodayISO, getFirstDayOfMonth, getLastDayOfMonth } from "@/lib/dateUtils";
import type { Retirada } from "@/hooks/useMeuSalario";

export function Retiradas() {
  const { data: resumo } = useResumoMesAnterior();

  // Mostra retiradas do mês atual + anterior (escopo amplo de visibilidade)
  const hoje = getTodayISO();
  const inicio = useMemo(() => {
    if (!resumo) return getFirstDayOfMonth(hoje);
    return resumo.inicio;
  }, [resumo, hoje]);
  const fim = useMemo(() => getLastDayOfMonth(hoje), [hoje]);

  const { data: retiradas = [] } = useRetiradas(inicio, fim);
  const excluir = useExcluirRetirada();

  const [retiradaParaExcluir, setRetiradaParaExcluir] = useState<Retirada | null>(null);
  const dialogoAberto = !!retiradaParaExcluir;

  const total = retiradas.reduce((s, r) => s + Number(r.valor), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-[hsl(var(--rd-vinho))]">Suas retiradas</h2>
          <p className="text-sm text-[hsl(var(--rd-vinho)/0.7)] mt-1">
            Registre cada valor que você tirou do negócio. Sem julgamento — só clareza.
          </p>
        </div>
        <RetiradaForm />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5 border border-[hsl(var(--rd-dourado)/0.3)] bg-[hsl(var(--rd-creme))]">
          <p className="text-xs uppercase tracking-wider text-[hsl(var(--rd-vinho)/0.7)]">Total no período</p>
          <p className="text-2xl font-semibold text-[hsl(var(--rd-vinho))]">{formatBRL(total)}</p>
        </div>
        <div className="rounded-2xl p-5 border border-[hsl(var(--rd-dourado)/0.3)] bg-[hsl(var(--rd-creme))]">
          <p className="text-xs uppercase tracking-wider text-[hsl(var(--rd-vinho)/0.7)]">Quantidade de retiradas</p>
          <p className="text-2xl font-semibold text-[hsl(var(--rd-vinho))]">{retiradas.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[hsl(var(--rd-dourado)/0.3)] bg-white overflow-hidden">
        {retiradas.length === 0 ? (
          <div className="p-10 text-center text-[hsl(var(--rd-vinho)/0.6)]">
            Nenhuma retirada registrada por enquanto.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[hsl(var(--rd-creme))] text-[hsl(var(--rd-vinho))]">
              <tr>
                <th className="text-left p-3 font-medium">Data</th>
                <th className="text-left p-3 font-medium">Descrição</th>
                <th className="text-right p-3 font-medium">Valor</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {retiradas.map((r) => (
                <tr key={r.id} className="border-t border-[hsl(var(--rd-dourado)/0.15)]">
                  <td className="p-3 text-[hsl(var(--rd-vinho))]">{formatDateBR(r.data_retirada)}</td>
                  <td className="p-3 text-[hsl(var(--rd-vinho)/0.8)]">{r.descricao || "—"}</td>
                  <td className="p-3 text-right font-medium text-[hsl(var(--rd-vinho))]">{formatBRL(Number(r.valor))}</td>
                  <td className="p-3 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setRetiradaParaExcluir(r)}
                      className="text-[hsl(var(--rd-rose-queimado))] hover:bg-[hsl(var(--rd-rose-queimado)/0.1)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
