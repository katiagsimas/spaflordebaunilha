import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar todos os perfis com avatar_url em base64
    const { data: profiles, error: fetchError } = await supabaseClient
      .from('profiles')
      .select('id, avatar_url')
      .like('avatar_url', 'data:image%');

    if (fetchError) throw fetchError;

    const results = {
      total: profiles?.length || 0,
      migrated: 0,
      errors: [] as any[],
    };

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'Nenhuma logo em base64 encontrada',
          results 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Migrar cada perfil
    for (const profile of profiles) {
      try {
        const base64Data = profile.avatar_url;
        
        // Extrair MIME type e dados base64
        const matches = base64Data.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          results.errors.push({
            user_id: profile.id,
            error: 'Formato de base64 inválido'
          });
          continue;
        }

        const mimeType = matches[1];
        const base64Content = matches[2];
        
        // Determinar extensão
        const ext = mimeType === 'svg+xml' ? 'svg' : mimeType;
        
        // Converter base64 para bytes
        const bytes = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));
        
        // Upload para Storage
        const filePath = `logotipos/${profile.id}/logo.${ext}`;
        const { error: uploadError } = await supabaseClient.storage
          .from('logotipos')
          .upload(filePath, bytes, {
            contentType: `image/${mimeType}`,
            upsert: true
          });

        if (uploadError) throw uploadError;

        // Obter URL pública
        const { data: { publicUrl } } = supabaseClient.storage
          .from('logotipos')
          .getPublicUrl(filePath);

        // Atualizar perfil com nova URL
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', profile.id);

        if (updateError) throw updateError;

        results.migrated++;
        
      } catch (error: any) {
        results.errors.push({
          user_id: profile.id,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Migração concluída: ${results.migrated}/${results.total} logos migradas`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});