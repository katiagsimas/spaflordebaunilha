import { useState } from "react";
import { ChevronDown, Calendar, Eye, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProductionCardProps {
  order: any;
  onUpdateChecklist: (orderId: string, checklist: any) => void;
  onMarkAsDelivered: (orderId: string) => void;
}

export function ProductionCard({ order, onUpdateChecklist, onMarkAsDelivered }: ProductionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendente': return '#D88B8B';
      case 'em produção': return '#E5C89F';
      case 'pronto': return '#8BA888';
      case 'entregue': return '#9C8B82';
      default: return '#D89B8C';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendente': return 'bg-[#D88B8B]/10 text-[#D88B8B] border-[#D88B8B]/20';
      case 'em produção': return 'bg-[#E5C89F]/10 text-[#9C8B82] border-[#E5C89F]/20';
      case 'pronto': return 'bg-[#8BA888]/10 text-[#8BA888] border-[#8BA888]/20';
      case 'entregue': return 'bg-[#9C8B82]/10 text-[#9C8B82] border-[#9C8B82]/20';
      default: return 'bg-[#D89B8C]/10 text-[#D89B8C] border-[#D89B8C]/20';
    }
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#D89B8C', '#B87C6D', '#8BA888', '#E5C89F'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatDate = (date: string) => {
    const d = new Date(date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const month = months[d.getMonth()];
    
    const isToday = d.getTime() === today.getTime();
    
    return {
      formatted: `${d.getDate()}/${month}`,
      isToday
    };
  };

  const dateInfo = formatDate(order.deliveryDate);

  const checklist = order.producao || {
    iniciada: false,
    pronta: false,
    embalada: false,
    prontoEntrega: false
  };

  const handleChecklistChange = (field: string, value: boolean) => {
    const newChecklist = { ...checklist, [field]: value };
    onUpdateChecklist(order.id, newChecklist);

    // Check if all items are completed
    if (Object.values(newChecklist).every(v => v === true)) {
      toast.success("Status atualizado para 'Pronto'! ✓", {
        duration: 3000,
      });
    }
  };

  return (
    <div
      className={cn(
        "bg-white border rounded-xl mb-3 transition-all duration-300",
        "hover:shadow-md hover:scale-[1.01]",
        isExpanded && "shadow-md"
      )}
      style={{ borderLeftWidth: '4px', borderLeftColor: getStatusColor(order.status) }}
    >
      {/* Collapsed State */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
            style={{ backgroundColor: getAvatarColor(order.client) }}
          >
            {getInitial(order.client)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[#6B5047] text-base">
              Cliente: {order.client}
            </div>
            <div className="text-sm text-[#9C8B82] mt-0.5">
              Produto: {order.product} {order.quantity && `• ${order.quantity}x`}
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-[#9C8B82]">
              <Calendar className="h-4 w-4" />
              <span className={dateInfo.isToday ? "text-[#D89B8C] font-semibold" : ""}>
                {dateInfo.formatted} às {order.deliveryTime || '00:00'}
              </span>
              <Badge className={cn("ml-2 rounded-full text-xs", getStatusBadgeClass(order.status))} variant="outline">
                {order.status}
              </Badge>
            </div>
          </div>

          {/* Expand icon */}
          <ChevronDown
            className={cn(
              "h-5 w-5 text-[#9C8B82] transition-transform duration-200 flex-shrink-0",
              isExpanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Expanded State */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 animate-fade-in">
          {/* Detalhes da Encomenda */}
          <div className="bg-[#FAF7F5] rounded-lg p-4 text-sm">
            <h3 className="font-semibold text-[#6B5047] mb-3">DETALHES DA ENCOMENDA</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[#9C8B82]">Telefone:</span>
                <span className="font-medium text-[#6B5047]">{order.phone || '(11) 00000-0000'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9C8B82]">Valor Total:</span>
                <span className="font-medium text-[#6B5047]">
                  R$ {(order.totalValue || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9C8B82]">Saldo Restante:</span>
                <span className="font-medium text-[#6B5047]">
                  R$ {(order.remainingBalance || 0).toFixed(2)}
                </span>
              </div>
              {order.observations && (
                <div className="pt-2 border-t border-[#E8E3DF]">
                  <span className="text-[#9C8B82]">Observações:</span>
                  <p className="mt-1 text-[#6B5047]">{order.observations}</p>
                </div>
              )}
            </div>
          </div>

          {/* Checklist de Produção */}
          <div className="bg-[#F5E6E0] rounded-lg p-4 border-l-4 border-[#D89B8C]">
            <h3 className="font-semibold text-[#6B5047] mb-3 flex items-center gap-2">
              <Check className="h-5 w-5" />
              CHECKLIST DE PRODUÇÃO
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={`iniciada-${order.id}`}
                  checked={checklist.iniciada}
                  onCheckedChange={(checked) => handleChecklistChange('iniciada', checked as boolean)}
                  className="accent-[#D89B8C]"
                />
                <label
                  htmlFor={`iniciada-${order.id}`}
                  className={cn(
                    "text-base cursor-pointer",
                    checklist.iniciada && "line-through opacity-60"
                  )}
                >
                  Produção Iniciada
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={`pronta-${order.id}`}
                  checked={checklist.pronta}
                  onCheckedChange={(checked) => handleChecklistChange('pronta', checked as boolean)}
                  className="accent-[#D89B8C]"
                />
                <label
                  htmlFor={`pronta-${order.id}`}
                  className={cn(
                    "text-base cursor-pointer",
                    checklist.pronta && "line-through opacity-60"
                  )}
                >
                  Produto Pronto
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={`embalada-${order.id}`}
                  checked={checklist.embalada}
                  onCheckedChange={(checked) => handleChecklistChange('embalada', checked as boolean)}
                  className="accent-[#D89B8C]"
                />
                <label
                  htmlFor={`embalada-${order.id}`}
                  className={cn(
                    "text-base cursor-pointer",
                    checklist.embalada && "line-through opacity-60"
                  )}
                >
                  Embalado
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={`prontoEntrega-${order.id}`}
                  checked={checklist.prontoEntrega}
                  onCheckedChange={(checked) => handleChecklistChange('prontoEntrega', checked as boolean)}
                  className="accent-[#D89B8C]"
                />
                <label
                  htmlFor={`prontoEntrega-${order.id}`}
                  className={cn(
                    "text-base cursor-pointer",
                    checklist.prontoEntrega && "line-through opacity-60"
                  )}
                >
                  Pronto para Entrega
                </label>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 gap-2">
              <Eye className="h-4 w-4" />
              Ver Encomenda Completa
            </Button>
            <Button
              className="flex-1 gap-2 bg-[#8BA888] hover:bg-[#8BA888]/90 text-white"
              onClick={() => onMarkAsDelivered(order.id)}
            >
              <Check className="h-4 w-4" />
              Marcar como Entregue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
