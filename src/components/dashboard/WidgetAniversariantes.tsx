import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cake, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface Aniversariante {
  id: string;
  nome: string;
  tipo: string;
  data_aniversario: string;
  telefone?: string;
  email?: string;
  dias_ate_aniversario: number;
  observacoes?: string;
  cliente_nome?: string;
}

interface WidgetAniversariantesProps {}

export function WidgetAniversariantes({}: WidgetAniversariantesProps) {
  // Buscar todos os aniversariantes deste mês
  const { data: aniversariantes = [], isLoading } = useQuery({
    queryKey: ['todos-aniversariantes-mes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_todos_aniversariantes', { 
          p_tenant_id: (await supabase.auth.getUser()).data.user?.id 
        });
      
      if (error) throw error;
      
      // Retornar todos os aniversariantes do mês
      return data || [];
    },
    refetchInterval: 60000 // Recarrega a cada 1 minuto
  });

  const enviarMensagemWhatsApp = (nome: string, telefone: string) => {
    const telefoneLimpo = telefone.replace(/\D/g, '');
    const mensagem = `Oi ${nome}! 🎂 Feliz aniversário! Que tal comemorar com um docinho especial? Temos promoções especiais para aniversariantes! 🎉`;
    const mensagemEncoded = encodeURIComponent(mensagem);
    window.open(`https://wa.me/55${telefoneLimpo}?text=${mensagemEncoded}`, '_blank');
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'cliente':
        return '👤';
      case 'familiar':
        return '👶';
      case 'contato_fornecedor':
        return '👔';
      default:
        return '🎂';
    }
  };

  const getTipoLabel = (tipo: string, clienteNome?: string) => {
    switch (tipo) {
      case 'cliente':
        return 'Cliente';
      case 'familiar':
        return clienteNome ? `Familiar - ${clienteNome}` : 'Familiar';
      case 'contato_fornecedor':
        return 'Contato Fornecedor';
      default:
        return 'Aniversariante';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🎂 Aniversariantes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Carregando...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🎂 Aniversariantes</CardTitle>
      </CardHeader>
      <CardContent>
        {aniversariantes.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhum aniversariante este mês
          </p>
        ) : (
          <div className="space-y-3">
            {aniversariantes.map((aniversariante) => (
              <div
                key={aniversariante.id}
                className="p-3 rounded-lg border"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">{getTipoIcon(aniversariante.tipo)}</div>
                    <div className="space-y-1 flex-1">
                      <p className="font-medium">{aniversariante.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {getTipoLabel(aniversariante.tipo, aniversariante.cliente_nome)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(aniversariante.data_aniversario + 'T00:00:00').toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={aniversariante.dias_ate_aniversario === 0 ? 'default' : 'secondary'}
                    >
                      {aniversariante.dias_ate_aniversario === 0 ? '🎉 HOJE!' :
                       aniversariante.dias_ate_aniversario === 1 ? '⭐ Amanhã' :
                       `${aniversariante.dias_ate_aniversario} dias`}
                    </Badge>
                    {aniversariante.telefone && (
                      <Button
                        size="sm"
                        onClick={() =>
                          enviarMensagemWhatsApp(
                            aniversariante.nome,
                            aniversariante.telefone!
                          )
                        }
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Mensagem
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
