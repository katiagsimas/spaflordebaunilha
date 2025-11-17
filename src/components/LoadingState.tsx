import { CakeSlice } from "lucide-react";

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
        <div className="relative">
          <CakeSlice className="w-24 h-24 text-primary mx-auto animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        </div>
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
        <div className="relative">
          <CakeSlice className="w-24 h-24 text-primary mx-auto animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">{message}</h3>
          <p className="text-muted-foreground">{submessage}</p>
        </div>
      </div>
    </div>
  );
};
