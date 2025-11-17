import React from "react";

interface LoadingMascoteProps {
  size?: number;
  label?: string;
}

export function LoadingMascote({
  size = 80,
  label = "Carregando...",
}: LoadingMascoteProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <img
        src="/mascote-caixa-de-acucar.png"
        alt="Carregando - Caixa de Açúcar"
        style={{ width: size, height: size }}
        className="animate-bounce drop-shadow-lg"
      />
      {label && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
}
