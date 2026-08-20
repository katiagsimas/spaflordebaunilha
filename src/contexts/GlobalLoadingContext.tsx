import React, { createContext, useContext, useState, ReactNode } from "react";

type GlobalLoadingContextType = {
  isLoading: boolean;
  setLoading: (value: boolean) => void;
  showLoading: (label?: string) => void;
  hideLoading: () => void;
  loadingLabel?: string;
};

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined);

export function GlobalLoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState<string | undefined>();

  const setLoading = (value: boolean) => {
    setIsLoading(value);
    if (!value) {
      setLoadingLabel(undefined);
    }
  };

  const showLoading = (label?: string) => {
    setIsLoading(true);
    setLoadingLabel(label);
  };

  const hideLoading = () => {
    setIsLoading(false);
    setLoadingLabel(undefined);
  };

  return (
    <GlobalLoadingContext.Provider 
      value={{ 
        isLoading, 
        setLoading, 
        showLoading, 
        hideLoading,
        loadingLabel 
      }}
    >
      {children}
    </GlobalLoadingContext.Provider>
  );
}

/**
 * Hook para controlar o loading global com a mascote da Spa Flor de Baunilha
 * 
 * Uso:
 * ```tsx
 * const { showLoading, hideLoading } = useGlobalLoading();
 * 
 * async function handleAction() {
 *   showLoading("Processando...");
 *   try {
 *     // sua ação assíncrona
 *   } finally {
 *     hideLoading();
 *   }
 * }
 * ```
 */
export function useGlobalLoading() {
  const context = useContext(GlobalLoadingContext);
  if (!context) {
    throw new Error("useGlobalLoading deve ser usado dentro de GlobalLoadingProvider");
  }
  return context;
}
