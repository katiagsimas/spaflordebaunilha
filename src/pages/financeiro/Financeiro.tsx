import { useNavigate } from 'react-router-dom';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  PieChart,
  Info
} from 'lucide-react';

export default function Financeiro() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Financeiro</h1>
        <p className="text-muted-foreground">
          Gerencie suas receitas e despesas
        </p>
      </div>

      {/* Informativo */}
      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-800 dark:text-blue-300">
          Clique em um dos cards abaixo para acessar o módulo desejado. 
          Você pode gerenciar tanto suas receitas (Contas a Receber) quanto 
          suas despesas (Contas a Pagar) de forma completa e detalhada.
        </AlertDescription>
      </Alert>

      {/* Cards de Navegação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Contas a Receber */}
        <Card 
          className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-l-4 border-l-green-500"
          onClick={() => navigate('/financeiro/contas-receber')}
        >
          <CardHeader className="p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xl font-semibold leading-tight">
                  Contas a Receber
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  Gerenciar recebimentos de clientes
                </CardDescription>
              </div>
            </div>
            
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span>Controle de recebimentos e parcelas</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span>Pagamentos parciais e histórico</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PieChart className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span>Relatórios e exportação</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Card Contas a Pagar */}
        <Card 
          className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-l-4 border-l-red-500"
          onClick={() => navigate('/financeiro/contas-pagar')}
        >
          <CardHeader className="p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xl font-semibold leading-tight">
                  Contas a Pagar
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  Gerenciar pagamentos a fornecedores
                </CardDescription>
              </div>
            </div>
            
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span>Controle de pagamentos e fornecedores</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span>Parcelamento e pagamentos parciais</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PieChart className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span>Relatórios e exportação</span>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
