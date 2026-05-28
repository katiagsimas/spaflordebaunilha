import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight
} from "lucide-react";
import { TransferenciaBancosModal } from "@/components/financeiro/TransferenciaBancosModal";
import { useNavigate } from "react-router-dom";
import { LoadingStateFullScreen } from "@/components/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { useResumoDashboard } from "@/hooks/useResumoDashboard";
import { TabelaInadimplencia } from "@/components/financeiro/TabelaInadimplencia";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function DashboardFinanceiro() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transferenciaOpen, setTransferenciaOpen] = useState(false);

  const {
    loading,
    resumo,
    inadimplenciaClientes,
    inadimplenciaFornecedores,
  } = useResumoDashboard();

  const dadosGrafico = [
    { categoria: "A Receber", valor: resumo.totalReceber },
    { categoria: "A Pagar", valor: resumo.totalPagar },
    { categoria: "Recebidas", valor: resumo.receitasRecebidas },
    { categoria: "Pagas", valor: resumo.despesasPagas }
  ];

  if (loading || !user) {
    return <LoadingStateFullScreen message="Carregando Dashboard Financeiro" submessage="Calculando indicadores financeiros..." />;
  }

  return (
    <div className="container mx-auto px-6 pt-1 pb-6 space-y-6">
      <PageHeader
        title="Dashboard Financeiro"
        description="Visão completa da saúde financeira do seu negócio."
        backButton={
          <Button variant="ghost" size="icon" onClick={() => navigate("/financeiro")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
        actions={
          <Button onClick={() => setTransferenciaOpen(true)} variant="outline" className="gap-2 border-cda-dourado/40 text-cda-vinho hover:bg-cda-dourado/10">
            <ArrowLeftRight className="h-4 w-4" />
            Transferência entre Bancos
          </Button>
        }
      />


      <TransferenciaBancosModal
        open={transferenciaOpen}
        onOpenChange={setTransferenciaOpen}
      />

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Total a Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">
              R$ {resumo.totalReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-cda-coral" />
              Total a Pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-cda-coral">
              R$ {resumo.totalPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Receitas Recebidas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              R$ {resumo.receitasRecebidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Despesas Pagas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              R$ {resumo.despesasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card className={`${
          resumo.saldoLiquido >= 0
            ? "border-primary bg-primary/10"
            : "border-cda-coral bg-cda-coral/10"
        }`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${
              resumo.saldoLiquido >= 0 ? "text-primary" : "text-cda-coral"
            }`}>
              Saldo Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${
              resumo.saldoLiquido >= 0 ? "text-primary" : "text-cda-coral"
            }`}>
              R$ {resumo.saldoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico */}
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral Financeira</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) =>
                    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  }
                />
                <Bar dataKey="valor" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* INADIMPLÊNCIA */}
      <div className="grid gap-4 md:grid-cols-2">
        <TabelaInadimplencia tipo="clientes" itens={inadimplenciaClientes} />
        <TabelaInadimplencia tipo="fornecedores" itens={inadimplenciaFornecedores} />
      </div>
    </div>
  );
}
