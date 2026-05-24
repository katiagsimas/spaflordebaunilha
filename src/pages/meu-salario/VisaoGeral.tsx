import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useResumoMesAnterior, useHistoricoMeuSalario } from "@/hooks/useMeuSalario";
import { CardResumoMes } from "@/components/meu-salario/CardResumoMes";
import { CenarioResultado } from "@/components/meu-salario/CenarioResultado";
import { HistoricoMensal } from "@/components/meu-salario/HistoricoMensal";
import { FraseRendaDoce } from "@/components/meu-salario/FraseRendaDoce";
import { exportarMeuSalarioPDF } from "@/utils/exportarMeuSalarioPDF";
import { Download, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

export function VisaoGeral() {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mes0Atual = hoje.getMonth();

  // Padrão: mês anterior ao atual
  const anoPadrao = mes0Atual === 0 ? anoAtual - 1 : anoAtual;
  const mes0Padrao = mes0Atual === 0 ? 11 : mes0Atual - 1;

  const [ano, setAno] = useState<number>(anoPadrao);
  const [mes0, setMes0] = useState<number>(mes0Padrao);

  const { data: resumo, isLoading, error } = useResumoMesAnterior({ ano, mes0 });
  const { data: historico } = useHistoricoMeuSalario(6);

  const ehMesAtual = ano === anoAtual && mes0 === mes0Atual;
  // Bloquear meses futuros
  const podeAvancar = !(ano === anoAtual && mes0 >= mes0Atual);

  const irAnterior = () => {
    if (mes0 === 0) {
      setMes0(11);
      setAno(ano - 1);
    } else {
      setMes0(mes0 - 1);
    }
  };

  const irProximo = () => {
    if (!podeAvancar) return;
    if (mes0 === 11) {
      setMes0(0);
      setAno(ano + 1);
    } else {
      setMes0(mes0 + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-[hsl(var(--rd-dourado))]">Mês de referência</p>
          <div className="flex items-center gap-2 mt-1">
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={irAnterior}
              className="h-8 w-8 border-[hsl(var(--rd-dourado))] text-[hsl(var(--rd-vinho))] hover:bg-[hsl(var(--rd-creme))]"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-semibold text-[hsl(var(--rd-vinho))] capitalize min-w-[200px] text-center">
              {resumo?.rotuloMes ?? "—"}
            </h2>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={irProximo}
              disabled={!podeAvancar}
              className="h-8 w-8 border-[hsl(var(--rd-dourado))] text-[hsl(var(--rd-vinho))] hover:bg-[hsl(var(--rd-creme))]"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-[hsl(var(--rd-vinho)/0.7)] mt-2">
            {ehMesAtual
              ? "Você está vendo o mês em andamento — os valores são atualizados ao vivo."
              : "Analise meses anteriores para acompanhar a saúde do seu negócio."}
          </p>
        </div>
        {resumo && (
          <Button
            onClick={() => exportarMeuSalarioPDF(resumo)}
            variant="outline"
            className="border-[hsl(var(--rd-dourado))] text-[hsl(var(--rd-vinho))] hover:bg-[hsl(var(--rd-creme))]"
          >
            <Download className="h-4 w-4 mr-2" />
            Salvar meu resumo
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="text-[hsl(var(--rd-vinho))] py-10 text-center">Preparando seu resumo...</div>
      )}

      {error && (
        <div className="rounded-2xl border border-[hsl(var(--rd-rose-queimado))] bg-[hsl(var(--rd-rose-queimado)/0.08)] p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-[hsl(var(--rd-rose-queimado))] mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[hsl(var(--rd-vinho))]">Não foi possível carregar o resumo</h3>
          <p className="text-sm text-[hsl(var(--rd-vinho)/0.8)] mt-2">
            {error instanceof Error ? error.message : "Ocorreu um erro inesperado ao buscar os dados. Tente novamente."}
          </p>
        </div>
      )}

      {resumo && !isLoading && !error && (
        <>
          <CardResumoMes resumo={resumo} />
          <CenarioResultado resumo={resumo} />
        </>
      )}

      {historico && historico.length > 0 && <HistoricoMensal historico={historico} />}

      <FraseRendaDoce />
    </div>
  );
}
