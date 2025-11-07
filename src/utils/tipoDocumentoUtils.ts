import { supabase } from '@/integrations/supabase/client';

/**
 * Incrementa o contador de uso de um tipo de documento
 * Isso faz com que tipos mais usados apareçam primeiro na lista
 */
export async function incrementarUsoTipoDocumento(tipoDocumentoId: string) {
  if (!tipoDocumentoId) return;
  
  try {
    await supabase.rpc('incrementar_uso_tipo_documento', {
      p_tipo_documento_id: tipoDocumentoId
    });
  } catch (error) {
    console.error('Erro ao incrementar uso do tipo de documento:', error);
  }
}
