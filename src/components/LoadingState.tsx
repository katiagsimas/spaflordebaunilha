import { LoadingMascote } from "./LoadingMascote";

interface LoadingStateProps {
  message?: string;
  submessage?: string;
}

export const LoadingState = ({ 
  message = "Carregando...",
  submessage
}: LoadingStateProps) => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <LoadingMascote size={80} />
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">{message}</p>
          {submessage && (
            <p className="text-sm text-muted-foreground mt-1">{submessage}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export const LoadingStateFullScreen = ({ 
  message = "Carregando...",
  submessage
}: LoadingStateProps) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-app">
      <div className="flex flex-col items-center gap-4">
        <LoadingMascote size={96} />
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">{message}</p>
          {submessage && (
            <p className="text-sm text-muted-foreground mt-1">{submessage}</p>
          )}
        </div>
      </div>
    </div>
  );
};
