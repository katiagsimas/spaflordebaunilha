import React, { createContext, useContext, useState, ReactNode } from "react";

type GlobalLoadingContextType = {
  isLoading: boolean;
  setLoading: (value: boolean) => void;
};

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined);

export function GlobalLoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setLoading] = useState(false);

  return (
    <GlobalLoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
    </GlobalLoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(GlobalLoadingContext);
  if (!context) {
    throw new Error("useGlobalLoading deve ser usado dentro de GlobalLoadingProvider");
  }
  return context;
}
