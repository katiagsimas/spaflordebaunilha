import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AniversarianteItem {
  id: string;
  nome: string;
  /** ISO YYYY-MM-DD */
  data_aniversario: string;
  legenda?: string;
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

function isHoje(iso: string) {
  const hoje = new Date();
  const [, mes, dia] = iso.split("-").map(Number);
  return hoje.getDate() === dia && hoje.getMonth() + 1 === mes;
}

export function AniversariantesPremiumCard({
  titulo = "Aniversariantes",
  subtitulo = "Este Mês",
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
    <div className="relative overflow-hidden rounded-2xl border border-cda-vinho/10 bg-cda-branco shadow-[0_4px_24px_-12px_rgba(91,26,43,0.10)]">
      {/* Header minimalista */}
      <div className="flex items-baseline justify-between px-6 pt-6 sm:px-7">
        <div>
          <h2 className="font-display text-xl tracking-tight text-cda-vinho-escuro sm:text-2xl">
            {titulo}
          </h2>
          <p className="mt-0.5 font-body text-[11px] uppercase tracking-[0.2em] text-cda-vinho/50">
            {subtitulo}
          </p>
        </div>
        <span className="rounded-full border border-cda-dourado/30 bg-cda-dourado/5 px-3 py-1 font-body text-[11px] font-medium tracking-wider text-cda-dourado">
          {String(total).padStart(2, "0")}
        </span>
      </div>

      {/* Fio dourado */}
      <div className="mx-6 mt-3 h-px w-10 bg-cda-dourado/60 sm:mx-7" />

      {/* Lista */}
      <ul className="px-3 py-3 sm:px-4">
        {visiveis.map((item) => {
          const hoje = isHoje(item.data_aniversario);
          return (
            <li
              key={item.id}
              className={cn(
                "flex items-center gap-4 rounded-xl px-3 py-3 transition-colors",
                item.onClick &&
                  "cursor-pointer hover:bg-cda-creme/60"
              )}
              onClick={item.onClick}
            >
              {/* Avatar minimalista */}
              <div className="relative shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cda-vinho/15 bg-cda-creme">
                  <span className="font-display text-sm text-cda-vinho">
                    {iniciais(item.nome)}
                  </span>
                </div>
                {hoje && (
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-cda-branco bg-cda-dourado" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-body text-sm font-medium text-cda-preto truncate">
                  {item.nome}
                </p>
                {item.legenda && (
                  <p className="font-body text-xs text-cda-vinho/55 truncate">
                    {item.legenda}
                  </p>
                )}
              </div>

              <div className="shrink-0 text-right">
                {hoje ? (
                  <span className="font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-cda-dourado">
                    Hoje
                  </span>
                ) : (
                  <span className="font-body text-xs text-cda-vinho/60">
                    {formatarDia(item.data_aniversario)}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Footer */}
      {total > limite && (
        <div className="flex items-center justify-center border-t border-cda-vinho/5 px-6 py-3 sm:px-7">
          <button
            type="button"
            onClick={() => setExpandido((v) => !v)}
            className="group inline-flex items-center gap-2 font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-cda-vinho transition hover:text-cda-dourado"
          >
            {expandido ? "Ver menos" : "Ver todos"}
            <ArrowRight className="h-3.5 w-3.5 text-cda-dourado transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      )}
    </div>
  );
}
