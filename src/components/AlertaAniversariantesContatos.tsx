import { AniversariantesPremiumCard } from "@/components/AniversariantesPremiumCard";

interface Contato {
  id: string;
  nome: string;
  cargo?: string;
  data_aniversario?: string;
  telefone?: string;
  fornecedor_nome?: string;
  fornecedor_id?: string;
}

interface AlertaAniversariantesContatosProps {
  contatos: Contato[];
  onContatoClick: (fornecedorId: string) => void;
}

export function AlertaAniversariantesContatos({
  contatos,
  onContatoClick,
}: AlertaAniversariantesContatosProps) {
  const mesAtual = new Date().getMonth();

  const aniversariantesDoMes = contatos.filter((contato) => {
    if (!contato.data_aniversario) return false;
    const dataAniversario = new Date(contato.data_aniversario + "T00:00:00");
    return dataAniversario.getMonth() === mesAtual;
  });

  if (aniversariantesDoMes.length === 0) return null;

  return (
    <AniversariantesPremiumCard
      subtitulo="Cultive parcerias com pequenos gestos."
      itens={aniversariantesDoMes.map((c) => ({
        id: c.id,
        nome: c.nome,
        data_aniversario: c.data_aniversario!,
        telefone: c.telefone,
        legenda: [c.cargo, c.fornecedor_nome].filter(Boolean).join(" • ") || undefined,
        onClick: c.fornecedor_id ? () => onContatoClick(c.fornecedor_id!) : undefined,
      }))}
    />
  );
}
