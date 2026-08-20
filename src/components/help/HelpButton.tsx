import { HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HelpButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export const HelpButton = ({ isOpen, onClick }: HelpButtonProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={`flex items-center gap-2 border-sfb-terracota/60 text-sfb-terracota hover:bg-sfb-terracota/10 hover:text-sfb-terracota transition-all duration-200 ${
        isOpen ? "bg-sfb-terracota/10" : ""
      }`}
    >
      {isOpen ? (
        <>
          <X className="h-4 w-4" />
          <span>Fechar Ajuda</span>
        </>
      ) : (
        <>
          <HelpCircle className="h-4 w-4" />
          <span>Ajuda</span>
        </>
      )}
    </Button>
  );
};
