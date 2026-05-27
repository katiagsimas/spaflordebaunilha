import { Users, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { TileCard } from "@/components/TileCard";

export default function ClientesFornecedores() {
  const navigate = useNavigate();

  return (
    <div className="flex-1">
      <PageHeader
        title="Clientes & Fornecedores"
        description="Cuide das pessoas que sustentam a sua confeitaria."
      />

      <div className="p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TileCard
            icon={Users}
            title="Clientes"
            description="Cadastro completo, contatos e familiares de quem encomenda com você."
            tone="vinho"
            onClick={() => navigate("/clientes")}
          />
          <TileCard
            icon={Truck}
            title="Fornecedores"
            description="Parcerias de insumos, embalagens e serviços que abastecem o seu ateliê."
            tone="dourado"
            onClick={() => navigate("/fornecedores")}
          />
        </div>
      </div>
    </div>
  );
}
