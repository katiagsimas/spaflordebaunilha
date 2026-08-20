import React from "react";

const cdaLogo = "/sfb-logo-dourado.png";

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
        src={cdaLogo}
        alt="Carregando - Spa Flor de Baunilha"
        style={{ width: size, height: size }}
        className="animate-spin-slow"
      />
      {label && (
        <span className="text-sm text-muted-foreground font-medium">
          {label}
        </span>
      )}
    </div>
  );
}
