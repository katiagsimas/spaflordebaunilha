import { useState } from 'react';
import caixaAcucarLogoFull from '@/assets/caixa-acucar-logo-full.png';

/**
 * Cabeçalho de marca padronizado para as telas de autenticação.
 * - Dimensões consistentes em Login, ForgotPassword e ResetPassword.
 * - Responsivo: escala proporcionalmente em mobile e desktop.
 * - Fallback textual em caso de falha de carregamento da imagem.
 */
export function AuthBrandHeader() {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="text-center w-full">
      <div className="mx-auto w-full max-w-[200px] sm:max-w-[240px] md:max-w-[280px] aspect-[4/3] flex items-center justify-center">
        {!imgError ? (
          <img
            src={caixaAcucarLogoFull}
            alt="Caixa de Açúcar — by Umbrella Doce"
            loading="eager"
            decoding="async"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center px-2">
            <span className="font-display text-2xl sm:text-3xl text-cda-creme leading-tight">
              Caixa de Açúcar
            </span>
            <span className="font-body text-[10px] sm:text-xs tracking-[0.2em] text-cda-dourado mt-1">
              by UMBRELLA DOCE
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
