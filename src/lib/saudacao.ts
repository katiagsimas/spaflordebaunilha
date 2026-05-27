import imgBomDia from "@/assets/saudacao-bom-dia.png";
import imgBoaTarde from "@/assets/saudacao-boa-tarde.png";
import imgBoaNoite from "@/assets/saudacao-boa-noite.png";

export type PeriodoDia = "bom-dia" | "boa-tarde" | "boa-noite";

export function periodoPorHora(date: Date = new Date()): PeriodoDia {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "bom-dia";
  if (h >= 12 && h < 18) return "boa-tarde";
  return "boa-noite";
}

const MAPA = {
  "bom-dia":   { texto: "Bom dia",   emoji: "☀️",  imagem: imgBomDia },
  "boa-tarde": { texto: "Boa tarde", emoji: "🌤️", imagem: imgBoaTarde },
  "boa-noite": { texto: "Boa noite", emoji: "🌙",  imagem: imgBoaNoite },
} as const;

export function saudacaoPorHora(date: Date = new Date()): { texto: string; emoji: string; imagem: string; periodo: PeriodoDia } {
  const periodo = periodoPorHora(date);
  return { ...MAPA[periodo], periodo };
}
