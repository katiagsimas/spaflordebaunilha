import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cake, MessageCircle } from 'lucide-react';
import { Aniversariante } from '@/hooks/useDashboardData';

interface WidgetAniversariantesProps {
  aniversariantes: Aniversariante[];
}

export function WidgetAniversariantes({ aniversariantes }: WidgetAniversariantesProps) {
  const enviarMensagemWhatsApp = (nome: string, telefone: string) => {
    const telefoneLimpo = telefone.replace(/\D/g, '');
    const mensagem = `Oi ${nome}! 🎂 Feliz aniversário! Que tal comemorar com um docinho especial? Temos promoções especiais para aniversariantes! 🎉`;
    const mensagemEncoded = encodeURIComponent(mensagem);
    window.open(`https://wa.me/55${telefoneLimpo}?text=${mensagemEncoded}`, '_blank');
  };

  const getTextoUrgencia = (quando: string) => {
    switch (quando) {
      case 'hoje':
        return '🎉 HOJE';
      case 'amanha':
        return '📅 Amanhã';
      default:
        return '📆 Esta semana';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🎂 Aniversariantes</CardTitle>
      </CardHeader>
      <CardContent>
        {aniversariantes.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhum aniversariante esta semana
          </p>
        ) : (
          <div className="space-y-3">
            {aniversariantes.map((aniversariante) => (
              <div
                key={aniversariante.cliente_id}
                className="p-3 rounded-lg border"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <Cake className="h-5 w-5 text-pink-500" />
                    <div className="space-y-1">
                      <p className="font-medium">{aniversariante.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {getTextoUrgencia(aniversariante.quando)}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() =>
                      enviarMensagemWhatsApp(
                        aniversariante.nome,
                        aniversariante.telefone
                      )
                    }
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Mensagem
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
