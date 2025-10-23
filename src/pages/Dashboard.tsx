import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isTomorrow,
  getDay
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface Encomenda {
  id: string;
  cliente: string;
  data_entrega: string;
  hora_entrega: string;
  valor: number;
  status: string;
}

interface DadosDia {
  dia: Date;
  encomendas: Encomenda[];
  quantidade: number;
  isHoje: boolean;
  isAmanha: boolean;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const [alertas, setAlertas] = useState({
    receberAtrasado: { quantidade: 0, valor: 0 },
    pagarAtrasado: { quantidade: 0, valor: 0 },
    inadimplenciaTotal: 0
  });

  const [calendarioDados, setCalendarioDados] = useState<DadosDia[]>([]);
  const [encomendasDia, setEncomendasDia] = useState<Encomenda[]>([]);

  const [financeiro, setFinanceiro] = useState({
    receberAberto: 0,
    pagarAberto: 0
  });

  const [visaoEconomica, setVisaoEconomica] = useState({
    mensal: { receitas: 0, custos: 0, lucro: 0 },
    anual: [] as { mes: string; receitas: number; custos: number; lucro: number }[]
  });

  const [tabEconomica, setTabEconomica] = useState("mensal");

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const dataAtual = new Date(anoSelecionado, mesSelecionado, 1);

  useEffect(() => {
    if (user) {
      carregarDados();
    }
  }, [mesSelecionado, anoSelecionado, user]);

  async function carregarDados() {
    setLoading(true);
    try {
      await Promise.all([
        carregarAlertas(),
        carregarCalendario(),
        carregarFinanceiro(),
        carregarVisaoEconomica()
      ]);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  async function carregarAlertas() {
    if (!user) return;
    const hoje = new Date().toISOString().split('T')[0];

    const { data: receberAtrasado } = await supabase
      .from("contas_receber")
      .select("valor")
      .eq("usuario_id", user.id)
      .lt("data_vencimento", hoje)
      .neq("status", "pago");

    const { data: pagarAtrasado } = await supabase
      .from("contas_pagar")
      .select("valor_total")
      .eq("usuario_id", user.id)
      .lt("data_vencimento", hoje)
      .neq("status", "pago");

    const { data: inadimplenciaClientes } = await supabase
      .from("contas_receber")
      .select("valor")
      .eq("usuario_id", user.id)
      .lt("data_vencimento", hoje)
      .eq("status", "pendente");

    const { data: inadimplenciaFornecedores } = await supabase
      .from("contas_pagar")
      .select("valor_total")
      .eq("usuario_id", user.id)
      .lt("data_vencimento", hoje)
      .eq("status", "pendente");

    setAlertas({
      receberAtrasado: {
        quantidade: receberAtrasado?.length || 0,
        valor: receberAtrasado?.reduce((sum, c) => sum + (c.valor || 0), 0) || 0
      },
      pagarAtrasado: {
        quantidade: pagarAtrasado?.length || 0,
        valor: pagarAtrasado?.reduce((sum, c) => sum + (c.valor_total || 0), 0) || 0
      },
      inadimplenciaTotal: 
        (inadimplenciaClientes?.reduce((sum, c) => sum + (c.valor || 0), 0) || 0) +
        (inadimplenciaFornecedores?.reduce((sum, c) => sum + (c.valor_total || 0), 0) || 0)
    });
  }

  async function carregarCalendario() {
    if (!user) return;
    const inicio = startOfMonth(dataAtual);
    const fim = endOfMonth(dataAtual);
    
    const inicioStr = format(inicio, "yyyy-MM-dd");
    const fimStr = format(fim, "yyyy-MM-dd");

    const { data: encomendas } = await supabase
      .from("encomendas")
      .select("id, data_entrega, hora_entrega, valor, status, cliente")
      .eq("usuario_id", user.id)
      .gte("data_entrega", inicioStr)
      .lte("data_entrega", fimStr)
      .neq("status", "cancelada")
      .order("data_entrega", { ascending: true });

    const dias = eachDayOfInterval({ start: inicio, end: fim });
    
    const dadosCalendario = dias.map(dia => {
      const encomendasDia = encomendas?.filter(enc => 
        isSameDay(new Date(enc.data_entrega!), dia)
      ).map(enc => ({
        id: enc.id,
        cliente: enc.cliente || "Cliente",
        data_entrega: enc.data_entrega || "",
        hora_entrega: enc.hora_entrega || "",
        valor: enc.valor || 0,
        status: enc.status || "pendente"
      })) || [];

      return {
        dia,
        encomendas: encomendasDia,
        quantidade: encomendasDia.length,
        isHoje: isToday(dia),
        isAmanha: isTomorrow(dia)
      };
    });

    setCalendarioDados(dadosCalendario);
    
    const dadosHoje = dadosCalendario.find(d => isToday(d.dia));
    if (dadosHoje) {
      setEncomendasDia(dadosHoje.encomendas);
    }
  }

  async function carregarFinanceiro() {
    if (!user) return;
    const inicioMes = new Date(anoSelecionado, mesSelecionado, 1).toISOString().split('T')[0];
    const fimMes = new Date(anoSelecionado, mesSelecionado + 1, 0).toISOString().split('T')[0];

    const { data: receberAberto } = await supabase
      .from("contas_receber")
      .select("valor")
      .eq("usuario_id", user.id)
      .gte("data_vencimento", inicioMes)
      .lte("data_vencimento", fimMes)
      .neq("status", "pago");

    const { data: pagarAberto } = await supabase
      .from("contas_pagar")
      .select("valor_total")
      .eq("usuario_id", user.id)
      .gte("data_vencimento", inicioMes)
      .lte("data_vencimento", fimMes)
      .neq("status", "pago");

    setFinanceiro({
      receberAberto: receberAberto?.reduce((sum, c) => sum + (c.valor || 0), 0) || 0,
      pagarAberto: pagarAberto?.reduce((sum, c) => sum + (c.valor_total || 0), 0) || 0
    });
  }

  async function carregarVisaoEconomica() {
    if (!user) return;
    const inicioMes = new Date(anoSelecionado, mesSelecionado, 1).toISOString().split('T')[0];
    const fimMes = new Date(anoSelecionado, mesSelecionado + 1, 0).toISOString().split('T')[0];

    const { data: receitasMes } = await supabase
      .from("contas_receber")
      .select("valor")
      .eq("usuario_id", user.id)
      .gte("data_vencimento", inicioMes)
      .lte("data_vencimento", fimMes);

    const { data: custosMes } = await supabase
      .from("contas_pagar")
      .select("valor_total")
      .eq("usuario_id", user.id)
      .gte("data_vencimento", inicioMes)
      .lte("data_vencimento", fimMes);

    const receitasMensal = receitasMes?.reduce((sum, r) => sum + (r.valor || 0), 0) || 0;
    const custosMensal = custosMes?.reduce((sum, c) => sum + (c.valor_total || 0), 0) || 0;
    const lucroMensal = receitasMensal - custosMensal;

    const dadosAnuais = [];
    for (let i = 0; i < 12; i++) {
      const mesAtual = new Date(anoSelecionado, i, 1);
      const inicioMesAnual = format(mesAtual, "yyyy-MM-dd");
      const fimMesAnual = format(new Date(anoSelecionado, i + 1, 0), "yyyy-MM-dd");

      const { data: receitasAnual } = await supabase
        .from("contas_receber")
        .select("valor")
        .eq("usuario_id", user.id)
        .gte("data_vencimento", inicioMesAnual)
        .lte("data_vencimento", fimMesAnual);

      const { data: custosAnual } = await supabase
        .from("contas_pagar")
        .select("valor_total")
        .eq("usuario_id", user.id)
        .gte("data_vencimento", inicioMesAnual)
        .lte("data_vencimento", fimMesAnual);

      const receitas = receitasAnual?.reduce((sum, r) => sum + (r.valor || 0), 0) || 0;
      const custos = custosAnual?.reduce((sum, c) => sum + (c.valor_total || 0), 0) || 0;

      dadosAnuais.push({
        mes: meses[i].substring(0, 3),
        receitas,
        custos,
        lucro: receitas - custos
      });
    }

    setVisaoEconomica({
      mensal: {
        receitas: receitasMensal,
        custos: custosMensal,
        lucro: lucroMensal
      },
      anual: dadosAnuais
    });
  }

  function selecionarDia(dados: DadosDia) {
    setDiaSelecionado(dados.dia);
    setEncomendasDia(dados.encomendas);
  }

  function navegarMes(direcao: "prev" | "next") {
    if (direcao === "prev") {
      const novaMes = mesSelecionado === 0 ? 11 : mesSelecionado - 1;
      const novoAno = mesSelecionado === 0 ? anoSelecionado - 1 : anoSelecionado;
      setMesSelecionado(novaMes);
      setAnoSelecionado(novoAno);
    } else {
      const novaMes = mesSelecionado === 11 ? 0 : mesSelecionado + 1;
      const novoAno = mesSelecionado === 11 ? anoSelecionado + 1 : anoSelecionado;
      setMesSelecionado(novaMes);
      setAnoSelecionado(novoAno);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const primeiroDia = getDay(startOfMonth(dataAtual));
  const diasVaziosInicio = Array(primeiroDia).fill(null);
  const diasCalendario = [...diasVaziosInicio, ...calendarioDados];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu negócio</p>
        </div>

        {/* Filtro Mês/Ano */}
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Período:</Label>
          <Select
            value={anoSelecionado.toString()}
            onValueChange={(value) => setAnoSelecionado(parseInt(value))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={mesSelecionado.toString()}
            onValueChange={(value) => setMesSelecionado(parseInt(value))}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {meses.map((mes, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {mes}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* FINANCEIRO E ALERTAS */}
      <div className="grid gap-3 md:grid-cols-4">
        {/* A Receber */}
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 shadow-soft">
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-xs font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
              A Receber - {meses[mesSelecionado]}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              R$ {financeiro.receberAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-muted-foreground">Em aberto</p>
            <Button 
              variant="link" 
              className="p-0 h-auto mt-1 text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
              onClick={() => navigate("/financeiro/contas-receber")}
            >
              Ver Detalhes →
            </Button>
          </CardContent>
        </Card>

        {/* A Pagar */}
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20 shadow-soft">
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-xs font-medium flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
              A Pagar - {meses[mesSelecionado]}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <p className="text-lg font-bold text-red-600 dark:text-red-400">
              R$ {financeiro.pagarAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-muted-foreground">Em aberto</p>
            <Button 
              variant="link" 
              className="p-0 h-auto mt-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              onClick={() => navigate("/financeiro/contas-pagar")}
            >
              Ver Detalhes →
            </Button>
          </CardContent>
        </Card>

        {/* Contas a Receber Atrasado */}
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20 shadow-soft">
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-xs font-medium flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400 animate-pulse" />
              Contas a Receber Atrasadas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <p className="text-lg font-bold text-red-600 dark:text-red-400">
              {alertas.receberAtrasado.quantidade}
            </p>
            <Button 
              variant="link" 
              className="p-0 h-auto mt-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              onClick={() => navigate("/financeiro/contas-receber")}
            >
              Ver Detalhes →
            </Button>
          </CardContent>
        </Card>

        {/* Contas a Pagar Atrasado */}
        <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 shadow-soft">
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-xs font-medium flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-yellow-600 dark:text-yellow-400 animate-pulse" />
              Contas a Pagar Atrasadas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
              {alertas.pagarAtrasado.quantidade}
            </p>
            <p className="text-[10px] text-muted-foreground">
              conta(s) em atraso
            </p>
            <Button 
              variant="link" 
              className="p-0 h-auto mt-1 text-xs text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
              onClick={() => navigate("/financeiro/contas-pagar")}
            >
              Ver Detalhes →
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* CALENDÁRIO DE ENCOMENDAS */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Calendário de Encomendas</CardTitle>
              <CardDescription>Clique em um dia para ver os detalhes</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navegarMes("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-4">
                {meses[mesSelecionado]} de {anoSelecionado}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navegarMes("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-7 gap-2">
            {/* Cabeçalho dos dias da semana */}
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
              <div key={dia} className="text-center text-sm font-semibold text-muted-foreground p-2">
                {dia}
              </div>
            ))}

            {/* Dias do calendário */}
            {diasCalendario.map((dados, index) => {
              if (!dados) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const isSelected = isSameDay(dados.dia, diaSelecionado);
              const temEncomendas = dados.quantidade > 0;

              let bgColor = "bg-background";
              let borderColor = "border-border";
              let textColor = "text-foreground";

              if (dados.isHoje && temEncomendas) {
                bgColor = "bg-red-100";
                borderColor = "border-red-500";
                textColor = "text-red-700";
              } else if (dados.isAmanha && temEncomendas) {
                bgColor = "bg-orange-100";
                borderColor = "border-orange-500";
                textColor = "text-orange-700";
              } else if (temEncomendas) {
                bgColor = "bg-green-50";
                borderColor = "border-green-300";
                textColor = "text-green-700";
              }

              if (isSelected) {
                borderColor = "border-primary border-2";
              }

              return (
                <button
                  key={index}
                  onClick={() => selecionarDia(dados)}
                  className={`
                    aspect-square p-2 rounded-lg border-2 transition-all
                    hover:shadow-md hover:scale-105
                    ${bgColor} ${borderColor}
                  `}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className={`text-sm font-medium ${textColor}`}>
                      {format(dados.dia, "d")}
                    </span>
                    {temEncomendas && (
                      <Badge variant="secondary" className="mt-1 text-xs h-5 px-1.5">
                        {dados.quantidade}
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detalhes do Dia Selecionado */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              {format(diaSelecionado, "dd 'de' MMMM", { locale: ptBR })}
              {isToday(diaSelecionado) && (
                <Badge variant="default" className="bg-red-500">HOJE</Badge>
              )}
            </h3>

            {encomendasDia.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma encomenda para este dia
              </p>
            ) : (
              <div className="space-y-2">
                {encomendasDia.map((encomenda) => (
                  <Card key={encomenda.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{encomenda.cliente}</p>
                            <Badge variant="outline" className="text-xs">
                              {encomenda.hora_entrega || "Sem horário"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            R$ {encomenda.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate("/encomendas")}
                        >
                          Ver Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* VISÃO ECONÔMICA */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Visão Econômica - Regime de Competência</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={tabEconomica === "mensal" ? "default" : "outline"}
                size="sm"
                onClick={() => setTabEconomica("mensal")}
              >
                Mensal
              </Button>
              <Button
                variant={tabEconomica === "anual" ? "default" : "outline"}
                size="sm"
                onClick={() => setTabEconomica("anual")}
              >
                Anual
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tabEconomica === "mensal" ? (
            <div className="grid gap-4 md:grid-cols-3">
              {/* Receitas */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Receitas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {visaoEconomica.mensal.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>

              {/* Custos */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Custos Totais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">
                    R$ {visaoEconomica.mensal.custos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>

              {/* Lucro */}
              <Card className={`${
                visaoEconomica.mensal.lucro >= 0
                  ? "bg-primary/10 border-primary"
                  : "bg-red-50 border-red-300"
              }`}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-sm font-medium ${
                    visaoEconomica.mensal.lucro >= 0 ? "text-primary" : "text-red-700"
                  }`}>
                    Lucro Líquido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${
                    visaoEconomica.mensal.lucro >= 0 ? "text-primary" : "text-red-700"
                  }`}>
                    R$ {visaoEconomica.mensal.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Margem: {visaoEconomica.mensal.receitas > 0
                      ? ((visaoEconomica.mensal.lucro / visaoEconomica.mensal.receitas) * 100).toFixed(1)
                      : 0}%
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={visaoEconomica.anual}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) =>
                      `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    }
                  />
                  <Legend />
                  <Line type="monotone" dataKey="receitas" stroke="#10b981" name="Receitas" strokeWidth={2} />
                  <Line type="monotone" dataKey="custos" stroke="#ef4444" name="Custos" strokeWidth={2} />
                  <Line type="monotone" dataKey="lucro" stroke="#8b5cf6" name="Lucro" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
