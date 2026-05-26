import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiResponse {
  text: string;
  raw: any;
  quota?: {
    requests_used: number;
    limit?: number;
    unlimited: boolean;
    periodo: string;
  };
}

/**
 * Hook para chamadas à IA via edge function `ai-proxy`.
 * Aplica cap mensal por plano + rate limit por IP automaticamente.
 *
 * Uso:
 *   const { ask, loading } = useAi();
 *   const res = await ask([{ role: 'user', content: 'Olá' }]);
 */
export function useAi() {
  const [loading, setLoading] = useState(false);

  const ask = async (
    messages: AiMessage[],
    opts?: { model?: string; temperature?: number; max_tokens?: number }
  ): Promise<AiResponse | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: { messages, ...opts },
      });

      if (error) {
        // Erros HTTP do edge function (429, 402, etc.) chegam aqui
        const ctx = (error as any).context;
        const status = ctx?.status;
        let payload: any = null;
        try { payload = ctx ? await ctx.json() : null; } catch { /* ignore */ }

        if (status === 429 && payload?.error === 'monthly_quota_exceeded') {
          toast.error('Limite mensal de IA atingido', {
            description: payload.message || `Você atingiu ${payload.limit} requisições neste mês.`,
          });
        } else if (status === 429 && payload?.error === 'ip_rate_limit') {
          toast.error('Muitas requisições', {
            description: `Aguarde ${payload.retry_after_seconds}s e tente novamente.`,
          });
        } else if (status === 402) {
          toast.error('Créditos de IA esgotados', {
            description: 'Entre em contato com o administrador.',
          });
        } else {
          toast.error('Erro ao chamar a IA', { description: payload?.error || error.message });
        }
        return null;
      }

      const text = data?.choices?.[0]?.message?.content ?? '';
      return { text, raw: data, quota: data?._quota };
    } catch (err: any) {
      toast.error('Erro inesperado na IA', { description: err.message });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { ask, loading };
}
