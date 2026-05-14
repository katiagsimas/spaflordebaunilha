import { ResumoMes, formatBRL } from "@/hooks/useMeuSalario";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

interface Props {
  historico: ResumoMes[];
}

export function HistoricoMensal({ historico }: Props) {
  const data = historico.map((h) => ({
    mes: h.rotuloMes.split(" ")[0].slice(0, 3),
    Saudável: Math.round(h.proLaboreSaudavel),
    Retirado: Math.round(h.retiradas),
  }));

  return (
    <div className="rounded-2xl border border-[hsl(var(--rd-dourado)/0.3)] bg-[hsl(var(--rd-creme))] p-5">
      <h3 className="text-[hsl(var(--rd-vinho))] font-semibold mb-4">Últimos meses</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--rd-dourado) / 0.2)" />
            <XAxis dataKey="mes" stroke="hsl(var(--rd-vinho))" />
            <YAxis stroke="hsl(var(--rd-vinho))" tickFormatter={(v) => `R$ ${v}`} />
            <Tooltip formatter={(v: number) => formatBRL(v)} />
            <Legend />
            <Line type="monotone" dataKey="Saudável" stroke="hsl(var(--rd-dourado))" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="Retirado" stroke="hsl(var(--rd-vinho))" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
