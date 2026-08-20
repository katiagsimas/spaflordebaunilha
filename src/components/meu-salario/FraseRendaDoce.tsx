import { useMemo } from "react";
import { FRASES_RENDA_DOCE } from "@/pages/meu-salario/copy";

export function FraseRendaDoce() {
  const frase = useMemo(
    () => FRASES_RENDA_DOCE[Math.floor(Math.random() * FRASES_RENDA_DOCE.length)],
    []
  );
  return (
    <div className="text-center py-6">
      <p className="text-base md:text-lg italic text-sfb-terracota font-light">
        “{frase}”
      </p>
    </div>
  );
}
