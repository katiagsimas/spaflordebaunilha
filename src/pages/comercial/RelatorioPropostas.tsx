import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePropostas } from "@/hooks/usePropostas";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const CORES = ["#5B1A2B", "#C9A14A", "#3D0F1C", "#E89B8C", "#D67BA5", "#7A2C40"];

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function RelatorioPropostas() {
  const navigate = useNavigate();
  const { propostas } = usePropostas();
  const data = propostas.data ?? [];

  const porMes = useMemo(() => {
    const ano = new Date().getFullYear();
    const buckets = MESES.map((mes, i) => ({ mes, propostas: 0, aceitas: 0, valor: 0 }));
    for (const p of data) {
      const [y, m] = p.data_emissao.split("-").map(Number);
      if (y !== ano) continue;
      const i = m - 1;
      buckets[i].propostas++;
      if (p.status === "aceita") {
        buckets[i].aceitas++;
        buckets[i].valor += Number(p.valor_total);
      }
    }
    return buckets;
  }, [data]);

  const porStatus = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const p of data) acc[p.status] = (acc[p.status] ?? 0) + 1;
    return Object.entries(acc).map(([name, value]) => ({ name, value }));
  }, [data]);

  const totalAno = porMes.reduce((acc, b) => acc + b.valor, 0);

  return (
    <div className="flex-1">
      <PageHeader
        title="Relatório anual de propostas"
        description={`Visão geral do ano de ${new Date().getFullYear()}`}
        backButton={
          <Button variant="ghost" size="icon" onClick={() => navigate("/comercial/propostas")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
      />
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <Card className="border-sfb-dourado/40">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-muted-foreground tracking-widest">Faturamento de propostas aceitas (ano)</p>
              <p className="text-3xl font-bold text-sfb-vinho mt-1">{brl(totalAno)}</p>
            </div>
            <BarChart3 className="h-10 w-10 text-sfb-dourado" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-sfb-vinho mb-4">Propostas por mês</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={porMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="propostas" fill="#C9A14A" name="Propostas" />
                <Bar dataKey="aceitas" fill="#5B1A2B" name="Aceitas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-sfb-vinho mb-4">Distribuição por status</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={porStatus} dataKey="value" nameKey="name" outerRadius={100} label>
                  {porStatus.map((_, i) => (<Cell key={i} fill={CORES[i % CORES.length]} />))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
