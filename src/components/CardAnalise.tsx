interface FaixaMensagens {
  bom: string;
  ok: string;
  ruim: string;
}

interface CardAnaliseProps {
  valor: number;
  tipo: 'percentual' | 'reais';
  valorDisplay?: number;
  thresholds: { bom: number; ok: number };
  direcao: 'acima_e_melhor' | 'abaixo_e_melhor';
  titulo: string;
  mensagens: FaixaMensagens;
  emoji: FaixaMensagens;
  emoticon: FaixaMensagens;
  alertas: FaixaMensagens;
  descricoes: FaixaMensagens;
}

function obterFaixa(valor: number, thresholds: { bom: number; ok: number }, direcao: 'acima_e_melhor' | 'abaixo_e_melhor'): 'bom' | 'ok' | 'ruim' {
  if (direcao === 'acima_e_melhor') {
    if (valor >= thresholds.bom) return 'bom';
    if (valor >= thresholds.ok) return 'ok';
    return 'ruim';
  }
  if (valor <= thresholds.bom) return 'bom';
  if (valor <= thresholds.ok) return 'ok';
  return 'ruim';
}

const classesPorFaixa = {
  bom: {
    card: 'bg-green-50 border-green-500 shadow-lg shadow-green-200',
    valor: 'text-4xl text-green-600',
    status: 'text-green-700',
    alerta: 'bg-green-100 text-green-800 border-green-300',
  },
  ok: {
    card: 'bg-yellow-50 border-yellow-500 shadow-lg shadow-yellow-200',
    valor: 'text-3xl text-yellow-600',
    status: 'text-yellow-700',
    alerta: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  ruim: {
    card: 'bg-red-50 border-red-500 shadow-lg shadow-red-200 animate-pulse',
    valor: 'text-5xl text-red-600',
    status: 'text-red-700',
    alerta: 'bg-red-100 text-red-800 border-red-300',
  },
};

export function CardAnalise({
  valor,
  tipo,
  valorDisplay,
  thresholds,
  direcao,
  titulo,
  mensagens,
  emoji,
  emoticon,
  alertas,
  descricoes,
}: CardAnaliseProps) {
  const faixa = obterFaixa(valor, thresholds, direcao);
  const classes = classesPorFaixa[faixa];

  const valorExibido =
    tipo === 'percentual'
      ? `${valor.toFixed(1)}%`
      : `R$ ${(valorDisplay ?? valor).toFixed(2)}`;

  return (
    <div className="space-y-3">
      <div
        className={`space-y-2 p-4 rounded-lg border-2 transition-all duration-300 ${classes.card}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji[faixa]}</span>
          <h4 className="font-semibold text-sm">{titulo}</h4>
          <span className="text-2xl ml-auto">{emoticon[faixa]}</span>
        </div>
        <div className={`font-bold transition-all ${classes.valor}`}>
          {valorExibido}
        </div>
        <p className={`text-sm font-semibold ${classes.status}`}>
          {mensagens[faixa]}
        </p>
      </div>

      <div
        className={`text-sm p-3 rounded-lg font-medium border ${classes.alerta}`}
      >
        <p className="font-bold text-base mb-1">{alertas[faixa]}</p>
        <p className="text-xs leading-relaxed">{descricoes[faixa]}</p>
      </div>
    </div>
  );
}
