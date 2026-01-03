import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { formatDateToISO, parseISOToDate, formatDateBR } from "@/lib/dateUtils";

interface DatePickerFieldProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onDateSelected?: () => void; // Callback para mover foco após seleção
}

export function DatePickerField({
  value,
  onChange,
  placeholder = "Selecione a data...",
  disabled = false,
  className,
  onDateSelected,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleSelect = (date: Date | undefined) => {
    onChange(date);
    setOpen(false); // Fecha o popover
    
    // Move o foco para o próximo campo
    setTimeout(() => {
      if (triggerRef.current) {
        const form = triggerRef.current.closest('form');
        if (form) {
          const inputs = Array.from(
            form.querySelectorAll<HTMLElement>(
              'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button[type="button"]:not([disabled])'
            )
          );
          const currentIndex = inputs.findIndex(el => 
            el === triggerRef.current || el.contains(triggerRef.current)
          );
          
          if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
            inputs[currentIndex + 1].focus();
          }
        }
      }
      onDateSelected?.();
    }, 100);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal border-[#E8E3DF] focus:border-[#D89B8C] focus:ring-[#D89B8C]",
            !value && "text-muted-foreground",
            className
          )}
        >
        <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? formatDateBR(formatDateToISO(value)) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
