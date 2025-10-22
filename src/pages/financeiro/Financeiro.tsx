import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  ArrowRight,
  Calendar,
  PieChart
} from 'lucide-react';

export default function Financeiro() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Financeiro</h1>
        <p className="text-muted-foreground">
          Gerencie suas receitas e despesas
        </p>
      </div>

      {/* Cards de Navegação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Contas a Receber */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-green-500"
          onClick={() => navigate('/financeiro/contas-receber')}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Contas a Receber</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Gerenciar recebimentos de clientes
                  </CardDescription>
                </div>
              </div>
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Controle de recebimentos e parcelas</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Pagamentos parciais e histórico</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PieChart className="h-4 w-4" />
                <span>Relatórios e exportação</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Contas a Pagar */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-red-500"
          onClick={() => navigate('/financeiro/contas-pagar')}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Contas a Pagar</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Gerenciar pagamentos a fornecedores
                  </CardDescription>
                </div>
              </div>
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Controle de pagamentos e fornecedores</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Parcelamento e pagamentos parciais</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PieChart className="h-4 w-4" />
                <span>Relatórios e exportação</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informativo */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Dica</h3>
        <p className="text-sm text-blue-800">
          Clique em um dos cards acima para acessar o módulo desejado. 
          Você pode gerenciar tanto suas receitas (Contas a Receber) quanto 
          suas despesas (Contas a Pagar) de forma completa e detalhada.
        </p>
      </div>
    </div>
  );
}
