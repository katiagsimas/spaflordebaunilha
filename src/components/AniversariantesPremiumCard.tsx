import { useMemo, useState } from "react";
import { Cake, Calendar, Gift, PartyPopper, ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AniversarianteItem {
  id: string;
  nome: string;
  /** ISO YYYY-MM-DD */
  data_aniversario: string;
  legenda?: string; // ex: "Filha de Maria", "Cargo - Fornecedor"
  telefone?: string;
  onClick?: () => void;
}

interface AniversariantesPremiumCardProps {
  titulo?: string;
  subtitulo?: string;
  itens: AniversarianteItem[];
  /** Quantos mostrar antes do "Ver todos" */
  limite?: number;
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function iniciais(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatarDia(iso: string) {
  const [, mes, dia] = iso.split("-").map(Number);
  return `${String(dia).padStart(2, "0")} de ${MESES[(mes ?? 1) - 1]}`;
}

export function AniversariantesPremiumCard({
  titulo = "Aniversariantes do mês",
  subtitulo = "Celebre, presenteie e fortaleça conexões.",
  itens,
  limite = 5,
}: AniversariantesPremiumCardProps) {
  const [expandido, setExpandido] = useState(false);

  const ordenados = useMemo(() => {
    return [...itens].sort((a, b) => {
      const da = Number(a.data_aniversario.split("-")[2] ?? 0);
      const db = Number(b.data_aniversario.split("-")[2] ?? 0);
      return da - db;
    });
  }, [itens]);

  const visiveis = expandido ? ordenados : ordenados.slice(0, limite);
  const total = ordenados.length;

  if (total === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-cda-dourado/30 bg-cda-branco shadow-[0_10px_40px_-20px_rgba(91,26,43,0.35)]">
      {/* Faixa vinho — cabeçalho */}
      <div className="relative bg-gradient-to-br from-cda-vinho-escuro via-cda-vinho to-cda-vinho-escuro px-6 py-6 sm:px-8 sm:py-7">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cda-dourado/15 ring-1 ring-cda-dourado/40">
            <Cake className="h-6 w-6 text-cda-dourado" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl tracking-tight text-cda-creme sm:text-3xl">
              {titulo}
            </h2>
            <p className="mt-1 font-body text-sm italic text-cda-dourado/90">
              {subtitulo}
            </p>
          </div>
        </div>
        {/* Detalhe decorativo dourado canto direito */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cda-dourado/10 blur-2xl" />
        <div className="pointer-events-none absolute right-6 top-3 hidden text-cda-dourado/30 sm:block">
          <Gift className="h-16 w-16" strokeWidth={1.2} />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[1fr_240px]">
        {/* Lista */}
        <ul className="divide-y divide-cda-dourado/15">
          {visiveis.map((item) => (
            <li
              key={item.id}
              className={cn(
                "flex items-center gap-4 py-3.5",
                item.onClick &&
                  "cursor-pointer rounded-xl px-2 -mx-2 transition hover:bg-cda-creme/60",
              )}
              onClick={item.onClick}
            >
              {/* Avatar com iniciais */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cda-vinho text-[0.7rem] font-bold tracking-wider text-cda-dourado ring-2 ring-cda-dourado/60">
                {iniciais(item.nome)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-display text-base text-cda-vinho-escuro sm:text-lg truncate">
                  {item.nome}
                </p>
                {item.legenda && (
                  <p className="font-body text-xs text-cda-vinho/60 truncate">
                    {item.legenda}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2 text-cda-vinho">
                <Calendar className="h-4 w-4 text-cda-vinho/70" />
                <span className="font-body text-sm">
                  {formatarDia(item.data_aniversario)}
                </span>
              </div>
            </li>
          ))}
        </ul>

        {/* Contador lateral */}
        <aside className="flex flex-col items-center justify-center rounded-2xl border border-cda-dourado/25 bg-cda-pink/25 px-5 py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cda-branco/80 ring-1 ring-cda-dourado/30">
            <Gift className="h-5 w-5 text-cda-vinho" />
          </div>
          <p className="mt-3 font-display text-4xl text-cda-vinho-escuro">
            {total}
          </p>
          <p className="mt-1 max-w-[10rem] font-body text-sm text-cda-vinho/70 leading-snug">
            {total === 1 ? "aniversariante este mês" : "aniversariantes este mês"}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="h-px w-10 bg-cda-dourado/60" />
            <Heart className="h-3.5 w-3.5 text-cda-dourado" fill="currentColor" />
            <span className="h-px w-10 bg-cda-dourado/60" />
          </div>
        </aside>
      </div>

      {/* Rodapé */}
      <div className="flex flex-col gap-3 border-t border-cda-dourado/20 bg-cda-pink/15 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-2 font-body text-sm italic text-cda-vinho/80">
          <PartyPopper className="h-4 w-4 text-cda-vinho" />
          Pequenos gestos criam grandes lembranças.
        </div>
        {total > limite && (
          <Button
            size="sm"
            onClick={() => setExpandido((v) => !v)}
            className="gap-2 bg-cda-vinho text-cda-creme hover:bg-cda-vinho-escuro tracking-[0.18em] text-xs uppercase"
          >
            {expandido ? "Ver menos" : "Ver todos"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
