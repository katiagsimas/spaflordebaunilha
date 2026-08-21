import { useNavigate } from "react-router-dom";
import { Leaf, Sparkles, ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export default function ProdutosRevenda() {
  const navigate = useNavigate();

  const marcas = [
    { id: 'natura', label: 'Natura', icon: Leaf, desc: 'Gestão de produtos e pedidos Natura' },
    { id: 'avon', label: 'Avon', icon: Sparkles, desc: 'Gestão de produtos e pedidos Avon' }
  ];

  return (
    <div className="min-h-screen bg-sfb-baunilha pb-24">
      <PageHeader
        title="Produtos para Revenda"
        description="Escolha uma das marcas abaixo para gerenciar seus produtos."
      />

      <div className="container mx-auto px-6 pt-4 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {marcas.map((m) => (
            <button
              key={m.id}
              onClick={() => navigate(`/precificacao/produtos-revenda/${m.id}`)}
              className="group text-left bg-white border-2 border-sfb-areia/60 rounded-xl p-5 transition-all duration-200 hover:border-sfb-terracota hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="w-[52px] h-[52px] rounded-full bg-sfb-baunilha flex items-center justify-center shrink-0">
                  <m.icon className="h-6 w-6 text-sfb-cacau" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[15px] font-semibold text-sfb-cacau leading-tight">
                    {m.label}
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    {m.desc}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => navigate("/precificacao")}
        className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-sfb-cacau text-sfb-baunilha flex items-center justify-center shadow-lg hover:opacity-90 transition"
        aria-label="Voltar"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    </div>
  );
}
