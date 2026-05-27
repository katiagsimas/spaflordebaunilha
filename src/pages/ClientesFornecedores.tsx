import { Users, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HeroBanner } from "@/components/HeroBanner";
import { TileCard } from "@/components/TileCard";
import clientesFornecedoresHero from "@/assets/clientes-fornecedores-hero-banner.jpg";

export default function ClientesFornecedores() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FFF9F5] pb-24">
      <div className="container mx-auto p-6 space-y-6">
        <HeroBanner
          image={clientesFornecedoresHero}
          title="Clientes & Fornecedores"
          subtitle="Cuide das pessoas que sustentam a sua confeitaria."
          imageAlt="Clientes e Fornecedores"
        />

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
