import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cake, Phone } from 'lucide-react';
import { format, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatPhone } from '@/lib/utils';

interface Contato {
  id: string;
  nome: string;
  cargo?: string;
  data_aniversario?: string;
  telefone?: string;
  fornecedor_nome?: string;
}

interface AlertaAniversariantesContatosProps {
  contatos: Contato[];
}

export function AlertaAniversariantesContatos({ contatos }: AlertaAniversariantesContatosProps) {
  const hoje = new Date();
  
  const aniversariantesDoMes = contatos.filter((contato) => {
    if (!contato.data_aniversario) return false;
    const dataAniversario = new Date(contato.data_aniversario + 'T00:00:00');
    return isSameMonth(dataAniversario, hoje);
  });

  if (aniversariantesDoMes.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border-pink-200 dark:border-pink-800">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-pink-100 dark:bg-pink-900 p-3">
            <Cake className="h-6 w-6 text-pink-600 dark:text-pink-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              Aniversariantes do Mês - Contatos de Fornecedores
              <Badge variant="secondary">{aniversariantesDoMes.length}</Badge>
            </h3>
            <div className="space-y-3">
              {aniversariantesDoMes.map((contato) => (
                <div
                  key={contato.id}
                  className="flex items-center justify-between bg-background/50 backdrop-blur-sm rounded-lg p-3 border"
                >
                  <div className="flex-1">
                    <p className="font-medium">{contato.nome}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      {contato.fornecedor_nome && (
                        <span>Fornecedor: {contato.fornecedor_nome}</span>
                      )}
                      {contato.cargo && <span>• {contato.cargo}</span>}
                      {contato.data_aniversario && (
                        <span className="flex items-center gap-1">
                          <Cake className="h-3 w-3" />
                          {format(new Date(contato.data_aniversario + 'T00:00:00'), 'dd/MM', { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>
                  {contato.telefone && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {formatPhone(contato.telefone)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
