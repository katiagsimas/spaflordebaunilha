import { Card, CardContent } from '@/components/ui/card';
import { Cake } from 'lucide-react';

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

export function AlertaAniversariantesContatos({ contatos, onContatoClick }: AlertaAniversariantesContatosProps) {
  const mesAtual = new Date().getMonth();
  
  const aniversariantesDoMes = contatos.filter((contato) => {
    if (!contato.data_aniversario) return false;
    const dataAniversario = new Date(contato.data_aniversario + 'T00:00:00');
    return dataAniversario.getMonth() === mesAtual;
  }).sort((a, b) => {
    const diaA = new Date(a.data_aniversario! + 'T00:00:00').getDate();
    const diaB = new Date(b.data_aniversario! + 'T00:00:00').getDate();
    return diaA - diaB;
  });

  if (aniversariantesDoMes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Cake className="h-5 w-5 animate-bounce" />
        🎉 Aniversariantes do Mês
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {aniversariantesDoMes.map((contato) => (
          <Card 
            key={contato.id}
            className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 dark:from-purple-500/20 dark:via-pink-500/20 dark:to-orange-500/20 border-2 border-purple-300/50 dark:border-purple-500/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={() => {
              if (contato.fornecedor_id) {
                onContatoClick(contato.fornecedor_id);
              }
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Cake className="h-6 w-6 text-white animate-bounce" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {contato.nome}
                  </p>
                  {contato.cargo && (
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      {contato.cargo} - {contato.fornecedor_nome}
                    </p>
                  )}
                  {!contato.cargo && contato.fornecedor_nome && (
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      {contato.fornecedor_nome}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(contato.data_aniversario! + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                  </p>
                  {contato.telefone && (
                    <p className="text-xs text-muted-foreground truncate">
                      {contato.telefone}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
