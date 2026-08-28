import { useNavigate } from 'react-router-dom';
import { HeroBanner } from '@/components/HeroBanner';
import { LoadingState } from '@/components/LoadingState';
import { useEstoque, escopoDoItem } from '@/hooks/useEstoque';
import { Package, ShoppingBag, ArrowRight, AlertTriangle } from 'lucide-react';

const formatarMoeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function EstoqueHub() {
  const navigate = useNavigate();
  const { itens, loading } = useEstoque();

  if (loading) return <LoadingState />;

  const cards = [
    {
      titulo: 'Estoque Operacional',
      descricao: 'Insumos e embalagens utilizados nos seus serviços e receitas.',
      rota: '/estoque/operacional',
      Icon: Package,
      itens: itens.filter((i) => escopoDoItem(i) === 'operacional'),
    },
    {
      titulo: 'Estoque de Revenda',
      descricao: 'Produtos para revenda (Natura, Avon e demais marcas).',
      rota: '/estoque/revenda',
      Icon: ShoppingBag,
      itens: itens.filter((i) => escopoDoItem(i) === 'revenda'),
    },
  ];

  return (
    <div className="space-y-6">
      <HeroBanner
        title="Estoque"
        subtitle="Escolha qual estoque você deseja administrar"
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {cards.map(({ titulo, descricao, rota, Icon, itens: lista }) => {
          const valor = lista.reduce((acc, i) => acc + i.quantidade_atual * i.custo_medio, 0);
          const abaixo = lista.filter(
            (i) => i.estoque_minimo != null && i.quantidade_atual < (i.estoque_minimo || 0),
          ).length;
          return (
            <button
              key={rota}
              type="button"
              onClick={() => navigate(rota)}
              className="group flex flex-col gap-4 rounded-xl border border-sfb-cacau/10 bg-white p-6 text-left transition hover:border-sfb-terracota/50 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sfb-terracota/15 ring-1 ring-sfb-terracota/30">
                  <Icon className="h-6 w-6 text-sfb-terracota" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-xl text-sfb-cacau">{titulo}</h2>
                  <p className="font-body text-sm text-sfb-cacau/60">{descricao}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="font-body text-[11px] uppercase tracking-wide text-sfb-cacau/50">Itens</p>
                  <p className="font-display text-2xl text-sfb-cacau">{lista.length}</p>
                </div>
                <div>
                  <p className="font-body text-[11px] uppercase tracking-wide text-sfb-cacau/50">Valor</p>
                  <p className="font-display text-2xl text-sfb-cacau">{formatarMoeda(valor)}</p>
                </div>
                <div>
                  <p className="font-body text-[11px] uppercase tracking-wide text-sfb-cacau/50">Alertas</p>
                  <p
                    className={`flex items-center gap-1 font-display text-2xl ${
                      abaixo > 0 ? 'text-sfb-terracota' : 'text-sfb-cacau'
                    }`}
                  >
                    {abaixo > 0 && <AlertTriangle className="h-4 w-4" />}
                    {abaixo}
                  </p>
                </div>
              </div>

              <span className="mt-auto inline-flex items-center gap-2 font-body text-sm text-sfb-terracota">
                Administrar <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
