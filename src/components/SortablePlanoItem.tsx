import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Copy, Trash2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlanoConta {
  id: string;
  nome: string;
  descricao?: string;
  categoriaId: string;
  tipo: 'receita' | 'despesa';
  ativo: boolean;
  iconeCustomizado?: string;
  corCustomizada?: string;
}

interface SortablePlanoItemProps {
  plano: PlanoConta;
  categoriaColor: string;
  onEdit: (plano: PlanoConta) => void;
  onDuplicate: (plano: PlanoConta) => void;
  onDelete: (plano: PlanoConta) => void;
  onViewHistory: (plano: PlanoConta) => void;
}

export function SortablePlanoItem({
  plano,
  categoriaColor,
  onEdit,
  onDuplicate,
  onDelete,
  onViewHistory
}: SortablePlanoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: plano.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-3 ml-6 mr-2 border border-border rounded-lg hover:shadow-sm transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {plano.iconeCustomizado && (
                <span className="text-lg">{plano.iconeCustomizado}</span>
              )}
              <h4 
                className="font-semibold text-base text-foreground"
                style={{ color: plano.corCustomizada || undefined }}
              >
                {plano.nome}
              </h4>
            </div>
            <p className="text-sm text-muted-foreground italic mt-1">
              {plano.descricao || 'Sem descrição'}
            </p>
          </div>
        </div>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewHistory(plano)}
            title="Ver histórico"
            className="h-8 w-8 p-0"
          >
            <History className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(plano)}
            title="Editar"
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate(plano)}
            title="Duplicar"
            className="h-8 w-8 p-0"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(plano)}
            title="Excluir"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
