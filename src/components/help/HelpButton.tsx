import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export function HelpButton({ isOpen, onClick, className }: HelpButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isOpen ? "Fechar ajuda" : "Abrir ajuda"}
      aria-pressed={isOpen}
      className={cn(
        "relative inline-flex h-[30px] w-[30px] items-center justify-center rounded-full border-[1.5px] border-[#5B1A2B] transition-all duration-200",
        isOpen
          ? "bg-[#5B1A2B] text-[#FFF9F5]"
          : "bg-transparent text-[#5B1A2B] hover:bg-[#5B1A2B]/5",
        className,
      )}
    >
      <HelpCircle className="h-[16px] w-[16px]" strokeWidth={2} />
      {!isOpen && (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 h-2 w-2 rounded-full border-[1.5px] border-white bg-[#C9A14A]"
        />
      )}
    </button>
  );
}
