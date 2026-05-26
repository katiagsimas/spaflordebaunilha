export function saudacaoPorHora(date: Date = new Date()): { texto: string; emoji: string } {
  const h = date.getHours();
  if (h >= 5 && h < 12) return { texto: "Bom dia", emoji: "☀️" };
  if (h >= 12 && h < 18) return { texto: "Boa tarde", emoji: "🌤️" };
  return { texto: "Boa noite", emoji: "🌙" };
}
