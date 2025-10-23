import { PageHeader } from "@/components/PageHeader";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Users, Truck, Cake } from "lucide-react";
import { useClientes } from "@/hooks/useClientes";
import { useFornecedores } from "@/hooks/useFornecedores";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";

const opcoes = [
  {
    title: "Clientes",
    description: "Cadastro de clientes",
    icon: Users,
    url: "/cadastros/clientes",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950",
  },
  {
    title: "Fornecedores",
    description: "Cadastro de fornecedores",
    icon: Truck,
    url: "/cadastros/fornecedores",
    color: "text-green-600 bg-green-50 dark:bg-green-950",
  },
];

export default function ClientesFornecedores() {
  const navigate = useNavigate();
  const { clientes } = useClientes();
  const { fornecedores } = useFornecedores();

  // Contar aniversariantes do mês de clientes
  const aniversariantesClientes = useMemo(() => {
    const mesAtual = new Date().getMonth();
    return clientes.filter(cliente => {
      if (!cliente.data_aniversario) return false;
      const dataAniversario = new Date(cliente.data_aniversario + 'T00:00:00');
      return dataAniversario.getMonth() === mesAtual;
    }).length;
  }, [clientes]);

  // Contar aniversariantes do mês de fornecedores
  const aniversariantesFornecedores = useMemo(() => {
    const mesAtual = new Date().getMonth();
    return fornecedores.filter(fornecedor => {
      if (!fornecedor.data_aniversario_contato || !fornecedor.contato) return false;
      const dataAniversario = new Date(fornecedor.data_aniversario_contato + 'T00:00:00');
      return dataAniversario.getMonth() === mesAtual;
    }).length;
  }, [fornecedores]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes e Fornecedores"
        description="Gerencie seus clientes e fornecedores"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {opcoes.map((opcao, index) => {
          const Icon = opcao.icon;
          const isClientes = opcao.url === "/cadastros/clientes";
          const isFornecedores = opcao.url === "/cadastros/fornecedores";
          const aniversariantes = isClientes ? aniversariantesClientes : isFornecedores ? aniversariantesFornecedores : 0;
          
          return (
            <Card
              key={opcao.url}
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-4 border-l-[#D89B8C] group relative"
              onClick={() => navigate(opcao.url)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {aniversariantes > 0 && (
                <Badge 
                  className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white flex items-center gap-1 animate-bounce"
                >
                  <Cake className="h-3 w-3" />
                  {aniversariantes}
                </Badge>
              )}
              <CardHeader className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${opcao.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base mb-1">{opcao.title}</CardTitle>
                    <CardDescription className="text-sm line-clamp-2">{opcao.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
