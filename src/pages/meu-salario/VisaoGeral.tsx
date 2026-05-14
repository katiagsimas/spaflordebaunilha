import { Button } from "@/components/ui/button";
import { useResumoMesAnterior, useHistoricoMeuSalario } from "@/hooks/useMeuSalario";
import { CardResumoMes } from "@/components/meu-salario/CardResumoMes";
import { CenarioResultado } from "@/components/meu-salario/CenarioResultado";
import { HistoricoMensal } from "@/components/meu-salario/HistoricoMensal";
import { FraseRendaDoce } from "@/components/meu-salario/FraseRendaDoce";
import { exportarMeuSalarioPDF } from "@/utils/exportarMeuSalarioPDF";
import { Download } from "lucide-react";

export function VisaoGeral() {
  const { data: resumo, isLoading } = useResumoMesAnterior();
  const { data: historico } = useHistoricoMeuSalario(6);

  if (isLoading || !resumo) {
    return <div className="text-[hsl(var(--rd-vinho))] py-10 text-center">Preparando seu resumo...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-[hsl(var(--rd-dourado))]">Mês de referência</p>
          <h2 className="text-2xl font-semibold text-[hsl(var(--rd-vinho))] capitalize">{resumo.rotuloMes}</h2>
          <p className="text-sm text-[hsl(var(--rd-vinho)/0.7)] mt-1">
            Sempre analisamos o último mês fechado — porque negócio saudável se enxerga com dados reais, não projeções.
          </p>
        </div>
        <Button
          onClick={() => exportarMeuSalarioPDF(resumo)}
          variant="outline"
          className="border-[hsl(var(--rd-dourado))] text-[hsl(var(--rd-vinho))] hover:bg-[hsl(var(--rd-creme))]"
        >
          <Download className="h-4 w-4 mr-2" />
          Salvar meu resumo
        </Button>
      </div>

      <CardResumoMes resumo={resumo} />
      <CenarioResultado resumo={resumo} />

      {historico && historico.length > 0 && <HistoricoMensal historico={historico} />}

      <FraseRendaDoce />
    </div>
  );
}
