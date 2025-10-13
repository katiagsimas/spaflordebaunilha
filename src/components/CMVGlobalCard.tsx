import { useState } from "react";
import { DollarSign, Info, TrendingUp, Package, Wrench, Briefcase, Home } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface Order {
  id: string;
  orderNumber: number;
  client: string;
  phone: string;
  product: string;
  quantity: number;
  total: number;
  downPayment: number;
  balance: number;
  status: "Pendente" | "Confirmado" | "Em Produção" | "Pronto" | "Entregue" | "Cancelado";
  orderDate: string;
  deliveryDate: string;
  deliveryTime: string;
  address: string;
  notes: string;
  createdAt: string;
}

interface CustoFixo {
  id: string;
  nome: string;
  valor: number;
}

type StatusCMV = 'otimo' | 'bom' | 'atencao' | 'critico';

interface CMVData {
  cmv: number;
  faturamento: number;
  custosTotal: number;
  lucroBruto: number;
  margemLucro: number;
  breakdown: {
    ingredientes: number;
    maoObra: number;
    operacionais: number;
    custosFixosRateados: number;
  };
  status: StatusCMV;
}

export function CMVGlobalCard() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [orders] = useLocalStorage<Order[]>("orders", []);
  const [custosFixos] = useLocalStorage<CustoFixo[]>("custosFixos", []);

  // Calcular CMV do mês atual
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  const encomendasEntregues = orders.filter(order => {
    if (order.status !== "Entregue") return false;
    const deliveryDate = new Date(order.deliveryDate);
    return deliveryDate.getMonth() === mesAtual && deliveryDate.getFullYear() === anoAtual;
  });

  const faturamento = encomendasEntregues.reduce((acc, o) => acc + o.total, 0);

  // Estimar custos (40% do valor de venda como padrão)
  let custosTotal = 0;
  let breakdownIngredientes = 0;
  let breakdownMaoObra = 0;
  let breakdownOperacionais = 0;

  encomendasEntregues.forEach(encomenda => {
    const custoEstimado = encomenda.total * 0.4;
    custosTotal += custoEstimado;
    breakdownIngredientes += custoEstimado * 0.6;
    breakdownMaoObra += custoEstimado * 0.25;
    breakdownOperacionais += custoEstimado * 0.15;
  });

  // Ratear custos fixos
  const totalCustosFixos = custosFixos.reduce((acc, c) => acc + c.valor, 0);
  custosTotal += totalCustosFixos;

  const cmv = faturamento > 0 ? (custosTotal / faturamento) * 100 : 0;
  const lucroBruto = faturamento - custosTotal;
  const margemLucro = faturamento > 0 ? (lucroBruto / faturamento) * 100 : 0;

  let status: StatusCMV;
  if (cmv < 30) {
    status = 'otimo';
  } else if (cmv <= 40) {
    status = 'bom';
  } else if (cmv <= 50) {
    status = 'atencao';
  } else {
    status = 'critico';
  }

  const cmvData: CMVData = {
    cmv,
    faturamento,
    custosTotal,
    lucroBruto,
    margemLucro,
    breakdown: {
      ingredientes: breakdownIngredientes,
      maoObra: breakdownMaoObra,
      operacionais: breakdownOperacionais,
      custosFixosRateados: totalCustosFixos,
    },
    status,
  };

  const getBorderColor = () => {
    switch (status) {
      case 'otimo':
        return 'border-l-success';
      case 'bom':
        return 'border-l-success';
      case 'atencao':
        return 'border-l-warning';
      case 'critico':
        return 'border-l-error';
      default:
        return 'border-l-muted-foreground';
    }
  };

  const getValueColor = () => {
    switch (status) {
      case 'otimo':
        return 'text-success';
      case 'bom':
        return 'text-success';
      case 'atencao':
        return 'text-warning';
      case 'critico':
        return 'text-error';
      default:
        return 'text-foreground';
    }
  };

  const getStatusInfo = () => {
    switch (status) {
      case 'otimo':
        return { badge: '✅ Excelente', text: 'abaixo do ideal - ótima margem!' };
      case 'bom':
        return { badge: '✅ Ideal', text: 'dentro do ideal' };
      case 'atencao':
        return { badge: '⚠️ Atenção', text: 'acima do ideal' };
      case 'critico':
        return { badge: '🔴 Crítico', text: 'muito acima - risco de prejuízo' };
      default:
        return { badge: 'N/A', text: '' };
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const statusInfo = getStatusInfo();

  return (
    <>
      <Card
        className={cn(
          "transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated border-l-4 cursor-pointer",
          getBorderColor()
        )}
        onClick={() => setDialogOpen(true)}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="text-sm uppercase font-semibold tracking-wide text-muted-foreground">
                  🧮 CMV GLOBAL
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Custo da Mercadoria Vendida</p>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger onClick={(e) => e.stopPropagation()}>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">
                    Percentual dos custos em relação ao faturamento. Clique para ver detalhes.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Valor Principal */}
          <div>
            <p className={cn("text-6xl font-bold", getValueColor())}>
              {cmv.toFixed(0)}%
            </p>
            <p className="text-sm text-muted-foreground mt-1">do faturamento</p>
          </div>

          {/* Breakdown Financeiro */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Faturamento:</span>
              <span className="font-semibold text-foreground">{formatCurrency(faturamento)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Custos totais:</span>
              <span className="font-semibold text-foreground">{formatCurrency(custosTotal)}</span>
            </div>

            <div className="border-t-2 border-border my-2"></div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-success">Lucro bruto:</span>
              <div className="text-right">
                <p className="font-bold text-success">{formatCurrency(lucroBruto)}</p>
                <p className="text-xs text-success">({margemLucro.toFixed(0)}%)</p>
              </div>
            </div>
          </div>

          {/* Referência */}
          <div className="pt-3 border-t border-border space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>📊 Ideal para confeitaria: 30-40%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Status:</span>
              <Badge className={cn(
                "text-xs",
                status === 'otimo' || status === 'bom' ? 'bg-success text-white' :
                status === 'atencao' ? 'bg-warning text-foreground' :
                'bg-error text-white'
              )}>
                {statusInfo.badge}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{statusInfo.text}</p>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-accent" />
              Composição dos Custos
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Breakdown com barras */}
            <div className="space-y-4">
              {/* Ingredientes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Ingredientes</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold">{formatCurrency(cmvData.breakdown.ingredientes)}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({((cmvData.breakdown.ingredientes / custosTotal) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/80"
                    style={{ width: `${(cmvData.breakdown.ingredientes / custosTotal) * 100}%` }}
                  />
                </div>
              </div>

              {/* Mão de Obra */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium">Mão de Obra</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold">{formatCurrency(cmvData.breakdown.maoObra)}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({((cmvData.breakdown.maoObra / custosTotal) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-accent/80"
                    style={{ width: `${(cmvData.breakdown.maoObra / custosTotal) * 100}%` }}
                  />
                </div>
              </div>

              {/* Operacionais */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-warning" />
                    <span className="text-sm font-medium">Operacionais</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold">{formatCurrency(cmvData.breakdown.operacionais)}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({((cmvData.breakdown.operacionais / custosTotal) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-warning to-warning/80"
                    style={{ width: `${(cmvData.breakdown.operacionais / custosTotal) * 100}%` }}
                  />
                </div>
              </div>

              {/* Custos Fixos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Custos Fixos</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold">{formatCurrency(cmvData.breakdown.custosFixosRateados)}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({((cmvData.breakdown.custosFixosRateados / custosTotal) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-muted-foreground to-muted-foreground/80"
                    style={{ width: `${(cmvData.breakdown.custosFixosRateados / custosTotal) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Dica */}
            <div className="bg-info/10 border-l-4 border-info p-4 rounded-lg mt-6">
              <p className="text-sm text-foreground">
                <span className="font-semibold">💡 Dica:</span> Focar em reduzir custos de ingredientes 
                (negociando com fornecedores ou otimizando receitas) para melhorar seu CMV.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
