import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MiniCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  datesWithOrders: Record<string, { count: number; status: string }>;
}

export function MiniCalendar({ selectedDate, onSelectDate, datesWithOrders }: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay();

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    onSelectDate(today);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return '#D88B8B'; // vermelho
      case 'producao': return '#E5C89F'; // amarelo
      case 'pronto': return '#8BA888'; // verde
      case 'entregue': return '#9C8B82'; // cinza
      default: return '#D89B8C'; // rosa coral
    }
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#6B5047]">
          {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday} className="text-xs">
            Hoje
          </Button>
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
          <div key={day} className="text-xs font-semibold text-[#9C8B82] text-center uppercase">
            {day}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-7 gap-1">
        {/* Dias vazios do mês anterior */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="h-10 md:h-10" />
        ))}

        {/* Dias do mês */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
          date.setHours(0, 0, 0, 0);
          const dateKey = formatDateKey(date);
          const orderInfo = datesWithOrders[dateKey];
          const isSelected = formatDateKey(selectedDate) === dateKey;
          const isToday = date.getTime() === today.getTime();

          return (
            <button
              key={day}
              onClick={() => onSelectDate(date)}
              className={cn(
                "h-10 md:h-10 rounded-lg text-sm font-medium transition-all duration-200 relative",
                "hover:bg-[#F5E6E0] cursor-pointer",
                isSelected && "bg-[#D89B8C] text-white font-semibold hover:bg-[#D89B8C]",
                !isSelected && isToday && "border-2 border-[#D89B8C] bg-[#F5E6E0] font-semibold",
                !isSelected && !isToday && "text-[#6B5047]"
              )}
            >
              {day}
              {orderInfo && (
                <>
                  {/* Dot indicator */}
                  <div
                    className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: getStatusColor(orderInfo.status) }}
                  />
                  {/* Count badge */}
                  {orderInfo.count > 0 && (
                    <div
                      className="absolute -top-1 -right-1 text-[10px] font-bold text-white rounded-full w-4 h-4 flex items-center justify-center"
                      style={{ backgroundColor: getStatusColor(orderInfo.status) }}
                    >
                      {orderInfo.count}
                    </div>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
