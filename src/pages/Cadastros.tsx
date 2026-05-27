import { PageHeader } from "@/components/PageHeader";
import { TileCard } from "@/components/TileCard";
import { DollarSign, Ruler, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Cadastros() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cadastros"
        description="Gerencie os cadastros que sustentam toda a sua operação."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TileCard
          icon={DollarSign}
          title="Valores de Mão de Obra"
          description="Configure valor/hora e tempo de preparo das receitas"
          tone="dourado"
          onClick={() => navigate("/configuracoes/precificacao/mao-de-obra")}
        />
        <TileCard
          icon={Ruler}
          title="Unidades de Medidas"
          description="Kg, litros, unidades e outras medidas usadas nas receitas"
          tone="vinho"
          onClick={() => navigate("/configuracoes/unidades-medida")}
        />
        <TileCard
          icon={Tag}
          title="Categorias de Receitas"
          description="Organize seus produtos por categorias"
          tone="pink"
          onClick={() => navigate("/configuracoes/categorias-receitas")}
        />
      </div>
    </div>
  );
}
