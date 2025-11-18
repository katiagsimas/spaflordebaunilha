import React from "react";

interface LoadingMascoteProps {
  size?: number;
  label?: string;
}

export function LoadingMascote({
  size = 64,
  label,
}: LoadingMascoteProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <img
        src="/mascote-caixa-de-acucar.png"
        alt="Carregando - Caixa de Açúcar"
        style={{ width: size, height: size }}
        className="animate-bounce"
      />
      {label && (
        <span className="text-sm text-muted-foreground font-medium">
          {label}
        </span>
      )}
    </div>
  );
}
