import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface TablePaginationProps {
  pagina: number;
  totalPaginas: number;
  total: number;
  porPagina: number;
  onPaginaChange: (pagina: number) => void;
  onPorPaginaChange: (porPagina: number) => void;
  label?: string;
  opcoes?: number[];
}

export function TablePagination({
  pagina,
  totalPaginas,
  total,
  porPagina,
  onPaginaChange,
  onPorPaginaChange,
  label = 'itens',
  opcoes = [10, 25, 50, 100],
}: TablePaginationProps) {
  if (total === 0) return null;

  const inicio = (pagina - 1) * porPagina + 1;
  const fim = Math.min(pagina * porPagina, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-sfb-areia/60">
      <p className="text-sm text-sfb-cacau/70">
        Mostrando <strong className="text-sfb-cacau">{inicio}</strong>–
        <strong className="text-sfb-cacau">{fim}</strong> de{' '}
        <strong className="text-sfb-cacau">{total}</strong> {label}
      </p>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-sfb-cacau/70 whitespace-nowrap">Por página</span>
          <Select value={String(porPagina)} onValueChange={(v) => onPorPaginaChange(Number(v))}>
            <SelectTrigger className="h-8 w-[80px] bg-white border-sfb-areia">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {opcoes.map((o) => (
                <SelectItem key={o} value={String(o)}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-sfb-areia"
            disabled={pagina <= 1}
            onClick={() => onPaginaChange(pagina - 1)}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-sfb-cacau px-2 whitespace-nowrap">
            {pagina} / {totalPaginas}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-sfb-areia"
            disabled={pagina >= totalPaginas}
            onClick={() => onPaginaChange(pagina + 1)}
            aria-label="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
