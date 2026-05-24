import { Users, Truck } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function ClientesFornecedores() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes e Fornecedores</h1>
            <p className="text-muted-foreground">Gerencie seus clientes e fornecedores</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <Card
          className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-2 border-[#C9A14A]/60"
          onClick={() => navigate("/clientes")}
        >
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FDF6EE] text-[#C9A14A] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                  Clientes
                </CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs line-clamp-2">
              Cadastre e gerencie seus clientes, contatos e familiares
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          className="group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-2 border-[#C9A14A]/60"
          onClick={() => navigate("/fornecedores")}
        >
          <CardHeader className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FDF6EE] text-[#C9A14A] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Truck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                  Fornecedores
                </CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs line-clamp-2">
              Cadastre e gerencie seus fornecedores e contatos
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
