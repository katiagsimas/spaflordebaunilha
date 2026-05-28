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

        <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { l: "Clientes", Icon: Users, path: "/clientes" },
            { l: "Fornecedores", Icon: Truck, path: "/fornecedores" },
          ].map(({ l, Icon, path }) => (
            <button
              key={l}
              type="button"
              onClick={() => navigate(path)}
              className="flex items-center justify-center rounded-lg px-4 py-3 text-sm bg-white border border-[#5B1A2B]/15 text-[#3D0F1C]/70 hover:border-[#C9A14A] hover:bg-[#C9A14A] hover:text-[#3D0F1C] hover:font-bold transition-all"
            >
              <Icon className="h-4 w-4 mr-2" />
              <span>{l}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
