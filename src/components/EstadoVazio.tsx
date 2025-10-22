import { useState } from "react";
import { Settings, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUserProfile } from "@/hooks/useUserProfile";

interface BannerBoasVindasProps {
  onConfigurar: () => void;
}

export function BannerBoasVindas({ onConfigurar }: BannerBoasVindasProps) {
  const { profile, updateProfile } = useUserProfile();
  const dismissed = profile?.planejamento_banner_dismissed || false;
  
  const setDismissed = (value: boolean) => {
    updateProfile({ planejamento_banner_dismissed: value });
  };

  if (dismissed) return null;

  return (
    <Alert className="mb-6 bg-gradient-to-r from-secondary to-background border-l-4 border-l-primary shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            👋 Bem-vinda ao Planejamento Financeiro!
          </h3>
          <AlertDescription className="text-muted-foreground mb-4">
            Configure suas metas para acompanhar o desempenho do seu negócio com precisão.
            Você terá acesso a métricas estratégicas e insights personalizados.
          </AlertDescription>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onConfigurar} className="bg-primary">
              Configurar Metas Agora
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setDismissed(true)}
            >
              Depois
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDismissed(true)}
          className="flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}

interface EstadoVazioCardProps {
  titulo: string;
  icone: React.ReactNode;
  onConfigurar: () => void;
}

export function EstadoVazioCard({ titulo, icone, onConfigurar }: EstadoVazioCardProps) {
  return (
    <Card className="transition-all duration-300 hover:shadow-elevated animate-fade-in">
      <CardHeader>
        <div className="flex items-center gap-3">
          {icone}
          <h3 className="text-sm uppercase font-semibold tracking-wide text-muted-foreground">
            {titulo}
          </h3>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Settings className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-center text-muted-foreground mb-1 max-w-xs">
          Configure suas metas para ver
        </p>
        <p className="text-center text-muted-foreground mb-6 max-w-xs">
          métricas personalizadas
        </p>
        <Button onClick={onConfigurar} variant="outline">
          Configurar Agora
        </Button>
      </CardContent>
    </Card>
  );
}
