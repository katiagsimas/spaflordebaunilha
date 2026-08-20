import React from "react";
import { logarErro } from "@/lib/errorLogger";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logarErro("ErrorBoundary", error, {
      componentStack: info.componentStack,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleVoltarInicio = () => {
    window.location.href = "/dashboard";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-app px-4">
        <div className="max-w-md w-full bg-sfb-branco border border-sfb-dourado/40 rounded-2xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">🍰</div>
          <h1 className="text-2xl font-heading text-sfb-vinho mb-2">
            Algo deu errado por aqui
          </h1>
          <p className="text-sfb-preto/80 font-body mb-6">
            Tivemos um imprevisto ao carregar essa tela. Não se preocupe — seus dados estão seguros.
            Tente recarregar a página ou voltar para o início.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-lg bg-sfb-vinho text-sfb-creme font-body hover:bg-sfb-vinho-escuro transition-colors"
            >
              Recarregar página
            </button>
            <button
              onClick={this.handleVoltarInicio}
              className="px-4 py-2 rounded-lg border border-sfb-vinho text-sfb-vinho font-body hover:bg-sfb-vinho/5 transition-colors"
            >
              Voltar para o início
            </button>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-6 text-left text-xs bg-sfb-creme/50 p-3 rounded overflow-auto max-h-40 text-sfb-preto/70">
              {this.state.error.message}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
