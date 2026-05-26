import { Lock, ArrowLeft, MessageCircle, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { usePlano } from "@/hooks/usePlano";
import { Badge } from "@/components/ui/badge";
import { URL_UPGRADE_EXTERNO } from "@/lib/constants";

export default function Upgrade() {
  const navigate = useNavigate();
  const { plano } = usePlano();
  const ehImersao = plano?.id === "aluna_imersao";

  // Alunas da Imersão: redirecionar direto para a página externa de renovação
  useEffect(() => {
    if (ehImersao) {
      window.location.href = URL_UPGRADE_EXTERNO;
    }
  }, [ehImersao]);

  if (ehImersao) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground font-body">Redirecionando para a página de renovação…</p>
          <a
            href={URL_UPGRADE_EXTERNO}
            className="inline-flex items-center gap-2 text-cda-coral font-body underline"
          >
            Continuar manualmente
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-in-up">
        {/* Ícone */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-cda-coral/15 flex items-center justify-center">
            <Lock className="h-10 w-10 text-cda-coral" />
          </div>
        </div>

        {/* Texto */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold font-display text-foreground">
            Este módulo não está disponível no seu plano.
          </h1>
          <p className="text-muted-foreground font-body">
            Fale com a Ká para fazer o upgrade e liberar o acesso.
          </p>
          {plano && (
            <Badge variant="outline" className="font-body text-xs">
              Seu plano atual: {plano.nome}
            </Badge>
          )}
        </div>

        {/* Botões */}
        <div className="space-y-3">
          <Button
            className="w-full bg-cda-coral text-white hover:bg-cda-coral/90 font-body"
            size="lg"
            onClick={() => window.open("https://wa.me/5511999999999?text=Olá Ká! Gostaria de fazer upgrade do meu plano no Caixa de Açúcar.", "_blank")}
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Falar no WhatsApp
          </Button>
          <Button
            variant="outline"
            className="w-full font-body"
            size="lg"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}
