import { useEffect, useMemo, useState } from "react";
import { Cake, Calendar, PartyPopper, ArrowRight, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import decorImg from "@/assets/aniversariantes-decor.png";

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
  /** Chave para persistir no localStorage (default: "cda:aniversariantes:cache") */
  storageKey?: string;
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

function normalizar(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function AniversariantesPremiumCard({
  titulo = "Aniversariantes do mês",
  subtitulo = "Celebre, presenteie e fortaleça conexões.",
  itens,
  limite = 5,
  storageKey = "cda:aniversariantes:cache",
}: AniversariantesPremiumCardProps) {
  const [expandido, setExpandido] = useState(false);
  const [busca, setBusca] = useState("");
  const [mesFiltro, setMesFiltro] = useState<string>("todos");

  // Cache: usa itens recebidos; se vazio, recupera o último cache salvo
  const [cache, setCache] = useState<AniversarianteItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as AniversarianteItem[]) : [];
    } catch {
      return [];
    }
  });

  // Persiste sempre que vierem itens
  useEffect(() => {
    if (!itens || itens.length === 0) return;
    try {
      // Não persistimos `onClick` (não serializável)
      const safe = itens.map(({ onClick: _omit, ...rest }) => rest);
      window.localStorage.setItem(storageKey, JSON.stringify(safe));
      setCache(itens);
    } catch {
      /* ignore quota errors */
    }
  }, [itens, storageKey]);

  const fonte = itens && itens.length > 0 ? itens : cache;

  const filtrados = useMemo(() => {
    const q = normalizar(busca.trim());
    return fonte.filter((item) => {
      if (mesFiltro !== "todos") {
        const m = item.data_aniversario.split("-")[1];
        if (m !== mesFiltro) return false;
      }
      if (q && !normalizar(item.nome).includes(q)) return false;
      return true;
    });
  }, [fonte, busca, mesFiltro]);

  const ordenados = useMemo(() => {
    return [...filtrados].sort((a, b) => {
      const [, ma, da] = a.data_aniversario.split("-").map(Number);
      const [, mb, db] = b.data_aniversario.split("-").map(Number);
      if (ma !== mb) return (ma ?? 0) - (mb ?? 0);
      return (da ?? 0) - (db ?? 0);
    });
  }, [filtrados]);

  const visiveis = expandido ? ordenados : ordenados.slice(0, limite);
  const total = ordenados.length;
  const totalFonte = fonte.length;

  if (totalFonte === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-sfb-areia/30 bg-sfb-baunilha shadow-[0_10px_40px_-20px_rgba(61,47,40,0.35)]">
      {/* Cabeçalho — layout em grid, ilustração nunca cortada */}
      <div className="relative bg-sfb-terracota px-5 py-5 sm:px-8 sm:py-7">
        <div className="grid grid-cols-[1fr_auto] items-center gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sfb-baunilha/15 ring-1 ring-sfb-baunilha/40 sm:h-12 sm:w-12">
              <Cake className="h-5 w-5 text-sfb-baunilha sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl tracking-tight text-sfb-baunilha sm:text-3xl">
                {titulo}
              </h2>
              <p className="mt-1 font-body text-xs italic text-sfb-baunilha/80 sm:text-sm">
                {subtitulo}
              </p>
            </div>
          </div>
          <img
            src={decorImg}
            alt=""
            aria-hidden="true"
            loading="lazy"
            width={1024}
            height={1024}
            className="pointer-events-none h-20 w-auto shrink-0 select-none sm:h-28 lg:h-32 opacity-90"
          />
        </div>
      </div>

      {/* Busca + filtro por mês */}
      <div className="flex flex-col gap-2 border-b border-sfb-areia/15 bg-sfb-areia/5 px-5 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-8">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sfb-cacau/50" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome..."
            className="h-9 pl-9 pr-9 bg-sfb-baunilha border-sfb-areia/30 focus-visible:ring-sfb-terracota/30 text-sfb-cacau"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-sfb-cacau/60 hover:bg-sfb-areia/10 hover:text-sfb-cacau"
              aria-label="Limpar busca"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Select value={mesFiltro} onValueChange={setMesFiltro}>
          <SelectTrigger className="h-9 sm:w-44 bg-sfb-baunilha border-sfb-areia/30 text-sfb-cacau">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os meses</SelectItem>
            {MESES.map((m, i) => (
              <SelectItem key={m} value={String(i + 1).padStart(2, "0")}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Conteúdo */}
      <div className="px-5 py-5 sm:px-8 sm:py-6">
        {visiveis.length === 0 ? (
          <p className="py-6 text-center font-body text-sm italic text-sfb-cacau/60">
            Nenhum aniversariante encontrado para os filtros aplicados.
          </p>
        ) : (
          <ul className="divide-y divide-sfb-areia/15">
            {visiveis.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "flex items-center gap-3 py-3 sm:gap-4 sm:py-3.5",
                  item.onClick &&
                    "cursor-pointer rounded-xl px-2 -mx-2 transition hover:bg-sfb-areia/5",
                )}
                onClick={item.onClick}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sfb-terracota text-[0.65rem] font-bold tracking-wider text-sfb-baunilha ring-2 ring-sfb-areia/60 sm:h-11 sm:w-11 sm:text-[0.7rem]">
                  {iniciais(item.nome)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm text-sfb-cacau sm:text-lg truncate">
                    {item.nome}
                  </p>
                  {item.legenda && (
                    <p className="font-body text-xs text-sfb-cacau/60 truncate">
                      {item.legenda}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1.5 text-sfb-cacau sm:gap-2">
                  <Calendar className="h-3.5 w-3.5 text-sfb-cacau/70 sm:h-4 sm:w-4" />
                  <span className="font-body text-xs sm:text-sm">
                    {formatarDia(item.data_aniversario)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Rodapé */}
      <div className="flex flex-col gap-3 border-t border-sfb-areia/20 bg-sfb-areia/10 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-4">
        <div className="flex items-center gap-2 font-body text-xs italic text-sfb-cacau/80 sm:text-sm">
          <PartyPopper className="h-4 w-4 text-sfb-terracota" />
          Pequenos gestos criam grandes lembranças.
        </div>
        {total > limite && (
          <Button
            size="sm"
            onClick={() => setExpandido((v) => !v)}
            className="gap-2 bg-sfb-terracota text-sfb-baunilha hover:bg-sfb-terracota/90 tracking-[0.18em] text-xs uppercase"
          >
            {expandido ? "Ver menos" : `Ver todos (${total})`}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
