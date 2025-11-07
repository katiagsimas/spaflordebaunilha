import { useEffect, useState } from 'react';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ImpersonateBanner() {
  const { isImpersonating, targetUser, reason, expiresAt, endImpersonation } = useImpersonation();
  const [timeLeft, setTimeLeft] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!isImpersonating || !expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Expirado');
        endImpersonation();
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);

      // Aviso aos 10 minutos
      if (minutes <= 10 && !showWarning) {
        setShowWarning(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isImpersonating, expiresAt, showWarning, endImpersonation]);

  if (!isImpersonating) return null;

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 ${
        showWarning ? 'bg-destructive' : 'bg-orange-600'
      } text-white shadow-lg`}
      style={{ zIndex: 9999 }}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 animate-pulse flex-shrink-0" />
            <div>
              <p className="font-bold text-lg">🔴 MODO SUPORTE ATIVO</p>
              <p className="text-sm opacity-90">
                Você está vendo como: <strong>{targetUser?.email}</strong>
              </p>
              {reason && (
                <p className="text-xs opacity-75">
                  Motivo: {reason}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm opacity-75">Expira em:</p>
              <p className="text-2xl font-mono font-bold">{timeLeft}</p>
              {showWarning && (
                <p className="text-xs animate-pulse">⚠️ Menos de 10 minutos!</p>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={endImpersonation}
              className="bg-white text-destructive hover:bg-gray-100"
            >
              <X className="w-4 h-4 mr-2" />
              Sair do Modo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
