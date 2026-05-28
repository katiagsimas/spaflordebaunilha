import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import capa from "@/assets/organizacao-doce-capa.png";

export default function OrganizacaoDoceLanding() {
  const navigate = useNavigate();

  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)] -m-4 sm:-m-6 lg:-m-8">
      <img
        src={capa}
        alt="Organização Doce — Rotinas inteligentes para confeiteiras"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      <div className="absolute inset-0 flex items-end justify-start pb-[6%] sm:pb-[5%] lg:pb-[4%] px-4">
        <Button
          size="lg"
          onClick={() => navigate("/organizacao-doce/ritual")}
          className="bg-cda-vinho text-cda-creme hover:bg-cda-vinho-escuro hover:text-cda-creme border-2 border-cda-dourado shadow-elevated font-display text-base sm:text-lg px-8 py-6 rounded-full tracking-wide"
        >
          Organizando meu Mundo Doce
        </Button>
      </div>
    </div>
  );
}
