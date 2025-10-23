import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  to: string;
  label?: string;
}

export function BackButton({ to, label = "Voltar" }: BackButtonProps) {
  const navigate = useNavigate();

  return (
    <Button
      variant="ghost"
      onClick={() => navigate(to)}
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
