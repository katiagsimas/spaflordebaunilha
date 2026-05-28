import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CalendariosEncomendas } from "@/components/CalendariosEncomendas";

export default function EncomendasCalendarios() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/encomendas")}
          className="text-[#3D0F1C] hover:bg-[#5B1A2B]/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <section>
        <CalendariosEncomendas />
      </section>
    </div>
  );
}
