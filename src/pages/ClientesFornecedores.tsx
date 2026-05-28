import { useMemo } from "react";
import { Users, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TileCard } from "@/components/TileCard";
import { AniversariantesPremiumCard } from "@/components/AniversariantesPremiumCard";
import { useClientes } from "@/hooks/useClientes";
import { useFamiliares } from "@/hooks/useFamiliares";
import { parseISOToDate } from "@/lib/dateUtils";
import clientesFornecedoresHero from "@/assets/clientes-fornecedores-hero-banner.png";
import { HeroBanner } from "@/components/HeroBanner";

export default function ClientesFornecedores() {
  const navigate = useNavigate();
  const { clientes } = useClientes();
  const { familiares: allFamiliares } = useFamiliares();

  const aniversariantesDoMes = useMemo(() => {
    const mesAtual = new Date().getMonth();

    const clientesAniversariantes = clientes
      .filter((cliente) => {
        if (!cliente.data_aniversario) return false;
        const data = parseISOToDate(cliente.data_aniversario);
        return data.getMonth() === mesAtual;
      })
      .map((cliente) => ({
        ...cliente,
        tipo_aniversariante: "cliente" as const,
      }));

    const familiaresAniversariantes = allFamiliares
      .filter((familiar: any) => {
        if (!familiar.data_nascimento) return false;
        const data = parseISOToDate(familiar.data_nascimento);
        return data.getMonth() === mesAtual;
      })
      .map((familiar: any) => {
        const cliente = clientes.find((c) => c.id === familiar.cliente_id);
        return {
          id: familiar.id,
          nome: familiar.nome,
          data_aniversario: familiar.data_nascimento,
          telefone: cliente?.telefone,
          tipo_aniversariante: "familiar" as const,
          parentesco: familiar.parentesco,
          cliente_nome: cliente?.nome,
          cliente_id: familiar.cliente_id,
        };
      });

    const todos = [...clientesAniversariantes, ...familiaresAniversariantes];

    return todos.sort((a, b) => {
      const dataA = parseISOToDate(a.data_aniversario)?.getDate() ?? 0;
      const dataB = parseISOToDate(b.data_aniversario)?.getDate() ?? 0;
      return dataA - dataB;
    });
  }, [clientes, allFamiliares]);

  return (
    <div className="min-h-screen bg-[#FFF9F5] pb-24">
      <div className="container mx-auto p-6 space-y-6">
        {/* HERO BANNER padronizado */}
        <HeroBanner
          image={clientesFornecedoresHero}
          title="Parceiros"
          subtitle="Cuide das pessoas que sustentam a sua confeitaria."
          imageAlt="Parceiros"
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

        {aniversariantesDoMes.length > 0 && (
          <AniversariantesPremiumCard
            itens={aniversariantesDoMes.map((item: any) => ({
              id: item.id,
              nome: item.nome,
              data_aniversario: item.data_aniversario,
              telefone: item.telefone,
              legenda:
                "tipo_aniversariante" in item && item.tipo_aniversariante === "familiar"
                  ? `${item.parentesco ?? "Familiar"} de ${item.cliente_nome ?? ""}`.trim()
                  : undefined,
              onClick: () => navigate("/clientes"),
            }))}
          />
        )}
      </div>
    </div>
  );
}
