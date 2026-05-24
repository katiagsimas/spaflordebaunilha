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
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateBR, getTodayISO, getFirstDayOfMonth, getLastDayOfMonth } from "@/lib/dateUtils";
import type { Retirada } from "@/hooks/useMeuSalario";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function rotuloMes(year: number, month0: number) {
  return `${MESES[month0]} de ${year}`;
}

function rotuloPeriodo(inicio: string, fim: string) {
  const dIni = new Date(inicio + "T00:00:00");
  const dFim = new Date(fim + "T00:00:00");
  const mesIni = MESES[dIni.getMonth()];
  const mesFim = MESES[dFim.getMonth()];
  const anoIni = dIni.getFullYear();
  const anoFim = dFim.getFullYear();
  if (anoIni === anoFim) {
    if (dIni.getMonth() === dFim.getMonth()) {
      return `${mesIni} de ${anoIni}`;
    }
    return `${mesIni} a ${mesFim} de ${anoFim}`;
  }
  return `${mesIni} de ${anoIni} a ${mesFim} de ${anoFim}`;
}

export function Retiradas() {
  const hoje = new Date();
  const hojeISO = getTodayISO();

  // Estado do seletor de período (mês/ano)
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes0, setMes0] = useState(hoje.getMonth());

  // Quando "mes atual" está selecionado, mantém o comportamento original:
  // mostra do início do mês anterior até o fim do mês atual
  const ehMesAtual = ano === hoje.getFullYear() && mes0 === hoje.getMonth();

  const inicio = useMemo(() => {
    if (ehMesAtual) {
      const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      return `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, "0")}-01`;
    }
    return getFirstDayOfMonth(`${ano}-${String(mes0 + 1).padStart(2, "0")}-01`);
  }, [ehMesAtual, ano, mes0, hoje]);

  const fim = useMemo(() => {
    if (ehMesAtual) {
      return getLastDayOfMonth(hojeISO);
    }
    return getLastDayOfMonth(`${ano}-${String(mes0 + 1).padStart(2, "0")}-01`);
  }, [ehMesAtual, ano, mes0, hojeISO]);

  const { data: retiradas = [] } = useRetiradas(inicio, fim);
  const excluir = useExcluirRetirada();

  const [retiradaParaExcluir, setRetiradaParaExcluir] = useState<Retirada | null>(null);
  const dialogoAberto = !!retiradaParaExcluir;

  const total = retiradas.reduce((s, r) => s + Number(r.valor), 0);

  const podeAvancar = useMemo(() => {
    if (ano < hoje.getFullYear()) return true;
    if (ano === hoje.getFullYear() && mes0 < hoje.getMonth()) return true;
    return false;
  }, [ano, mes0, hoje]);

  function irAnterior() {
    if (mes0 === 0) {
      setMes0(11);
      setAno((a) => a - 1);
    } else {
      setMes0((m) => m - 1);
    }
  }

  function irProximo() {
    if (!podeAvancar) return;
    if (mes0 === 11) {
      setMes0(0);
      setAno((a) => a + 1);
    } else {
      setMes0((m) => m + 1);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-[hsl(var(--rd-vinho))]">Suas retiradas</h2>
          <p className="text-sm text-[hsl(var(--rd-vinho)/0.7)] mt-1">
            Registre cada valor que você tirou do negócio. Sem julgamento — só clareza.
          </p>
          <p className="text-sm font-medium text-[hsl(var(--rd-vinho))] mt-1">
            Exibindo retiradas de {rotuloPeriodo(inicio, fim)}
            {ehMesAtual && (
              <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[hsl(var(--rd-dourado)/0.2)] text-[hsl(var(--rd-vinho))]">
                mês atual + anterior
              </span>
            )}
          </p>
        </div>
        <RetiradaForm />
      </div>

      {/* Seletor de período */}
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="outline"
          onClick={irAnterior}
          className="border-[hsl(var(--rd-dourado)/0.4)] text-[hsl(var(--rd-vinho))] hover:bg-[hsl(var(--rd-dourado)/0.1)]"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <select
            value={mes0}
            onChange={(e) => setMes0(Number(e.target.value))}
            className="rounded-lg border border-[hsl(var(--rd-dourado)/0.4)] bg-white px-3 py-2 text-sm text-[hsl(var(--rd-vinho))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--rd-dourado)/0.3)]"
          >
            {MESES.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
          <select
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
            className="rounded-lg border border-[hsl(var(--rd-dourado)/0.4)] bg-white px-3 py-2 text-sm text-[hsl(var(--rd-vinho))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--rd-dourado)/0.3)]"
          >
            {Array.from({ length: 5 }, (_, i) => hoje.getFullYear() - 2 + i).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <Button
          size="icon"
          variant="outline"
          onClick={irProximo}
          disabled={!podeAvancar}
          className="border-[hsl(var(--rd-dourado)/0.4)] text-[hsl(var(--rd-vinho))] hover:bg-[hsl(var(--rd-dourado)/0.1)] disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
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

      <AlertDialog open={dialogoAberto} onOpenChange={(open) => !open && setRetiradaParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir retirada?</AlertDialogTitle>
            <AlertDialogDescription>
              {retiradaParaExcluir && (
                <>
                  Tem certeza que deseja excluir a retirada de{" "}
                  <strong>{formatDateBR(retiradaParaExcluir.data_retirada)}</strong> no valor de{" "}
                  <strong>{formatBRL(Number(retiradaParaExcluir.valor))}</strong>?
                  <br />
                  Esta ação não pode ser desfeita.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRetiradaParaExcluir(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (retiradaParaExcluir) {
                  excluir.mutate(retiradaParaExcluir.id);
                }
                setRetiradaParaExcluir(null);
              }}
              className="bg-[hsl(var(--rd-rose-queimado))] text-white hover:bg-[hsl(var(--rd-rose-queimado)/0.9)]"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
