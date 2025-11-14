import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Users,
  Building2,
  DollarSign
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingStateFullScreen } from "@/components/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface InadimplenciaItem {
  id: string;
  nome: string;
  valor: number;
  dias_atraso: number;
  telefone?: string;
}

export default function DashboardFinanceiro() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [resumo, setResumo] = useState({
    totalReceber: 0,
    totalPagar: 0,
    receitasRecebidas: 0,
    despesasPagas: 0,
    saldoLiquido: 0
  });

  const [inadimplenciaClientes, setInadimplenciaClientes] = useState<InadimplenciaItem[]>([]);
  const [inadimplenciaFornecedores, setInadimplenciaFornecedores] = useState<InadimplenciaItem[]>([]);
  const [mostrarTodosClientes, setMostrarTodosClientes] = useState(false);
  const [mostrarTodosFornecedores, setMostrarTodosFornecedores] = useState(false);

  useEffect(() => {
    if (user) {
      carregarDados();
    }
  }, [user]);

  async function carregarDados() {
    setLoading(true);
    try {
      await Promise.all([
        carregarResumo(),
        carregarInadimplenciaClientes(),
        carregarInadimplenciaFornecedores()
      ]);
    } catch (error) {
      console.error("Erro ao carregar dashboard financeiro:", error);
    } finally {
      setLoading(false);
    }
  }

  async function carregarResumo() {
    if (!user) return;
    const hoje = new Date().toISOString().split('T')[0];
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    // Buscar todas as parcelas a receber
    const { data: parcelasReceber } = await supabase
      .from("vw_contas_receber_parcelas")
      .select("*")
      .eq("user_id", user.id);

    // Buscar todas as parcelas a pagar
    const { data: parcelasPagar } = await supabase
      .from("contas_pagar_parcelas")
      .select(`
        *,
        conta:contas_pagar!inner (
          usuario_id
        )
      `)
      .eq("conta.usuario_id", user.id);

    let totalReceber = 0;
    let receitasRecebidas = 0;

    parcelasReceber?.forEach((p: any) => {
      if (p.status === 'aberto' || p.status === 'atrasado') {
        // Parcelas em aberto ou atrasadas: soma valor total pendente
        totalReceber += (p.valor_parcela || 0) - (p.valor_pago || 0);
      } else if (p.status === 'pagamento_parcial') {
        // Parcelas parcialmente pagas: desmembra os valores
        const valorPago = p.valor_pago || 0;
        const valorPendente = (p.valor_parcela || 0) - valorPago;
        
        totalReceber += valorPendente; // Valor pendente vai para "Em Aberto"
        receitasRecebidas += valorPago; // Valor pago vai para "Recebido"
      } else if ((p.status === 'pago' || p.status === 'adiantado') && p.data_pagamento >= inicioMes) {
        // Parcelas totalmente pagas no mês: soma para recebido
        receitasRecebidas += p.valor_pago || 0;
      }
    });

    let totalPagar = 0;
    let despesasPagas = 0;

    parcelasPagar?.forEach((p: any) => {
      if (p.status === 'aberto' || p.status === 'atrasado') {
        // Parcelas em aberto ou atrasadas: soma valor total pendente
        totalPagar += (p.valor_parcela || 0) - (p.valor_pago || 0);
      } else if (p.status === 'pagamento_parcial') {
        // Parcelas parcialmente pagas: desmembra os valores
        const valorPago = p.valor_pago || 0;
        const valorPendente = (p.valor_parcela || 0) - valorPago;
        
        totalPagar += valorPendente; // Valor pendente vai para "Em Aberto"
        despesasPagas += valorPago; // Valor pago vai para "Pago"
      } else if ((p.status === 'pago' || p.status === 'adiantado') && p.data_pagamento >= inicioMes) {
        // Parcelas totalmente pagas no mês: soma para pago
        despesasPagas += p.valor_pago || 0;
      }
    });

    setResumo({
      totalReceber,
      totalPagar,
      receitasRecebidas,
      despesasPagas,
      saldoLiquido: receitasRecebidas - despesasPagas
    });
  }

  async function carregarInadimplenciaClientes() {
    if (!user) return;
    const hoje = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from("vw_contas_receber_parcelas")
      .select('*')
      .eq("user_id", user.id)
      .eq("status", "atrasado")
      .order("data_vencimento", { ascending: true });

    if (!data) return;

    const inadimplentesMap = new Map<string, InadimplenciaItem>();

    for (const parcela of data) {
      const vencimento = new Date(parcela.data_vencimento + 'T00:00:00');
      const hojeDate = new Date(hoje + 'T00:00:00');
      const diasAtraso = Math.floor((hojeDate.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));

      const clienteId = parcela.cliente_id || parcela.id;
      const clienteNome = parcela.cliente_nome || "Cliente desconhecido";
      const valorDevido = (parcela.valor_parcela || 0) - (parcela.valor_pago || 0);

      if (inadimplentesMap.has(clienteId)) {
        const existing = inadimplentesMap.get(clienteId)!;
        existing.valor += valorDevido;
        existing.dias_atraso = Math.max(existing.dias_atraso, diasAtraso);
      } else {
        const { data: cliente } = await supabase
          .from("clientes")
          .select("telefone")
          .eq("id", clienteId)
          .maybeSingle();

        inadimplentesMap.set(clienteId, {
          id: clienteId,
          nome: clienteNome,
          valor: valorDevido,
          dias_atraso: diasAtraso,
          telefone: cliente?.telefone
        });
      }
    }

    const agrupado = Array.from(inadimplentesMap.values());
    agrupado.sort((a, b) => b.valor - a.valor);

    setInadimplenciaClientes(agrupado);
  }

  async function carregarInadimplenciaFornecedores() {
    if (!user) return;
    const hoje = new Date().toISOString().split('T')[0];

    // Buscar parcelas atrasadas com informações da conta
    const { data: parcelas } = await supabase
      .from("contas_pagar_parcelas")
      .select(`
        *,
        conta_pagar:contas_pagar (
          fornecedor_id,
          usuario_id
        )
      `)
      .eq("status", "atrasado")
      .order("data_vencimento", { ascending: true });

    if (!parcelas) return;

    // Filtrar apenas parcelas do usuário atual
    const parcelasDoUsuario = parcelas.filter(
      (p: any) => p.conta_pagar?.usuario_id === user.id
    );

    const inadimplentesMap = new Map<string, InadimplenciaItem>();

    for (const parcela of parcelasDoUsuario) {
      const vencimento = new Date(parcela.data_vencimento + 'T00:00:00');
      const hojeDate = new Date(hoje + 'T00:00:00');
      const diasAtraso = Math.floor((hojeDate.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));

      const fornecedorId = (parcela.conta_pagar as any)?.fornecedor_id || parcela.id;
      const valorDevido = (parcela.valor_parcela || 0) - (parcela.valor_pago || 0);

      if (inadimplentesMap.has(fornecedorId)) {
        const existing = inadimplentesMap.get(fornecedorId)!;
        existing.valor += valorDevido;
        existing.dias_atraso = Math.max(existing.dias_atraso, diasAtraso);
      } else {
        const { data: fornecedor } = await supabase
          .from("fornecedores")
          .select("nome, telefone")
          .eq("id", fornecedorId)
          .maybeSingle();

        inadimplentesMap.set(fornecedorId, {
          id: fornecedorId,
          nome: fornecedor?.nome || "Fornecedor desconhecido",
          valor: valorDevido,
          dias_atraso: diasAtraso,
          telefone: fornecedor?.telefone
        });
      }
    }

    const agrupado = Array.from(inadimplentesMap.values());
    agrupado.sort((a, b) => b.valor - a.valor);

    setInadimplenciaFornecedores(agrupado);
  }

  function getCorPorDiasAtraso(dias: number) {
    if (dias > 30) return "bg-red-600 text-white";
    if (dias > 15) return "bg-orange-500 text-white";
    return "bg-yellow-500 text-white";
  }

  const clientesExibir = mostrarTodosClientes
    ? inadimplenciaClientes
    : inadimplenciaClientes.slice(0, 10);

  const fornecedoresExibir = mostrarTodosFornecedores
    ? inadimplenciaFornecedores
    : inadimplenciaFornecedores.slice(0, 10);

  const totalInadimplenciaClientes = inadimplenciaClientes.reduce((sum, c) => sum + c.valor, 0);
  const totalInadimplenciaFornecedores = inadimplenciaFornecedores.reduce((sum, f) => sum + f.valor, 0);

  const dadosGrafico = [
    {
      categoria: "A Receber",
      valor: resumo.totalReceber
    },
    {
      categoria: "A Pagar",
      valor: resumo.totalPagar
    },
    {
      categoria: "Recebidas",
      valor: resumo.receitasRecebidas
    },
    {
      categoria: "Pagas",
      valor: resumo.despesasPagas
    }
  ];

  if (loading) {
    return <LoadingStateFullScreen message="Carregando Dashboard Financeiro" submessage="Calculando indicadores financeiros..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/financeiro")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">Visão completa da saúde financeira</p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Total a Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              R$ {resumo.totalReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Total a Pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
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
            : "border-red-500 bg-red-50"
        }`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${
              resumo.saldoLiquido >= 0 ? "text-primary" : "text-red-700"
            }`}>
              Saldo Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${
              resumo.saldoLiquido >= 0 ? "text-primary" : "text-red-700"
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
        {/* Clientes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-red-600" />
                  Inadimplência - Clientes
                </CardTitle>
                <CardDescription>
                  {inadimplenciaClientes.length} cliente(s) inadimplente(s)
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-600">
                  R$ {totalInadimplenciaClientes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {inadimplenciaClientes.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Nenhum cliente inadimplente 🎉
              </p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Atraso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientesExibir.map((cliente, index) => (
                      <TableRow key={cliente.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{index + 1}. {cliente.nome}</p>
                            {cliente.telefone && (
                              <p className="text-xs text-muted-foreground">{cliente.telefone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {cliente.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={getCorPorDiasAtraso(cliente.dias_atraso)}>
                            {cliente.dias_atraso} dias
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {inadimplenciaClientes.length > 10 && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      onClick={() => setMostrarTodosClientes(!mostrarTodosClientes)}
                    >
                      {mostrarTodosClientes
                        ? "Mostrar apenas TOP 10"
                        : `Ver todos os ${inadimplenciaClientes.length} clientes`}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Fornecedores */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-orange-600" />
                  Inadimplência - Fornecedores
                </CardTitle>
                <CardDescription>
                  {inadimplenciaFornecedores.length} fornecedor(es) inadimplente(s)
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-600">
                  R$ {totalInadimplenciaFornecedores.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {inadimplenciaFornecedores.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Nenhum fornecedor inadimplente 🎉
              </p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Atraso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fornecedoresExibir.map((fornecedor, index) => (
                      <TableRow key={fornecedor.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{index + 1}. {fornecedor.nome}</p>
                            {fornecedor.telefone && (
                              <p className="text-xs text-muted-foreground">{fornecedor.telefone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {fornecedor.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={getCorPorDiasAtraso(fornecedor.dias_atraso)}>
                            {fornecedor.dias_atraso} dias
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {inadimplenciaFornecedores.length > 10 && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      onClick={() => setMostrarTodosFornecedores(!mostrarTodosFornecedores)}
                    >
                      {mostrarTodosFornecedores
                        ? "Mostrar apenas TOP 10"
                        : `Ver todos os ${inadimplenciaFornecedores.length} fornecedores`}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
