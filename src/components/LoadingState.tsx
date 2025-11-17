import { LoadingMascote } from "./LoadingMascote";

interface LoadingStateProps {
  message?: string;
  submessage?: string;
}

export const LoadingState = ({ 
  message = "Carregando...", 
  submessage = "Aguarde enquanto preparamos tudo para você" 
}: LoadingStateProps) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center space-y-6">
        <LoadingMascote size={96} label="" />
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">{message}</h3>
          <p className="text-muted-foreground">{submessage}</p>
        </div>
      </div>
    </div>
  );
};

export const LoadingStateFullScreen = ({ 
  message = "Carregando...", 
  submessage = "Aguarde enquanto preparamos tudo para você" 
}: LoadingStateProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <LoadingMascote size={96} label="" />
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">{message}</h3>
          <p className="text-muted-foreground">{submessage}</p>
        </div>
      </div>
    </div>
  );
};
