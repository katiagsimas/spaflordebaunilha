import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Database } from 'lucide-react';

export function MigrateLogosToStorage() {
  const [migrating, setMigrating] = useState(false);
  const [results, setResults] = useState<{
    total: number;
    migrated: number;
    errors: any[];
  } | null>(null);

  const migrateLogos = async () => {
    setMigrating(true);
    const migrationResults = {
      total: 0,
      migrated: 0,
      errors: [] as any[],
    };

    try {
      // Buscar perfis com avatar_url em base64
      const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .like('avatar_url', 'data:image%');

      if (fetchError) throw fetchError;

      migrationResults.total = profiles?.length || 0;

      if (!profiles || profiles.length === 0) {
        toast.info('Nenhuma logo em base64 encontrada para migrar');
        setResults(migrationResults);
        setMigrating(false);
        return;
      }

      // Migrar cada perfil
      for (const profile of profiles) {
        try {
          const base64Data = profile.avatar_url;
          
          // Extrair MIME type e dados base64
          const matches = base64Data.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
          if (!matches || matches.length !== 3) {
            migrationResults.errors.push({
              user_id: profile.id,
              error: 'Formato de base64 inválido'
            });
            continue;
          }

          const mimeType = matches[1].replace('+', '-');
          const base64Content = matches[2];
          
          // Determinar extensão
          const ext = mimeType === 'svg-xml' ? 'svg' : mimeType;
          
          // Converter base64 para Blob
          const byteCharacters = atob(base64Content);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: `image/${mimeType.replace('-', '+')}` });
          
          // Upload para Storage
          const filePath = `logotipos/${profile.id}/logo.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from('logotipos')
            .upload(filePath, blob, {
              contentType: `image/${mimeType.replace('-', '+')}`,
              upsert: true
            });

          if (uploadError) throw uploadError;

          // Obter URL pública
          const { data: { publicUrl } } = supabase.storage
            .from('logotipos')
            .getPublicUrl(filePath);

          // Atualizar perfil com nova URL
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', profile.id);

          if (updateError) throw updateError;

          migrationResults.migrated++;
          
        } catch (error: any) {
          migrationResults.errors.push({
            user_id: profile.id,
            error: error.message
          });
        }
      }

      setResults(migrationResults);
      toast.success(`Migração concluída: ${migrationResults.migrated}/${migrationResults.total} logos migradas`);

    } catch (error: any) {
      console.error('Erro na migração:', error);
      toast.error('Erro ao migrar logos: ' + error.message);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <Database className="h-5 w-5" />
          Migração de Logos para Storage
        </CardTitle>
        <CardDescription className="text-orange-700">
          Esta ferramenta migra logos antigas armazenadas em base64 para o Supabase Storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={migrateLogos} 
          disabled={migrating}
          variant="outline"
          className="w-full"
        >
          {migrating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {migrating ? 'Migrando...' : 'Iniciar Migração'}
        </Button>

        {results && (
          <div className="mt-4 p-4 bg-white rounded-lg border">
            <h4 className="font-semibold mb-2">Resultados da Migração:</h4>
            <ul className="space-y-1 text-sm">
              <li>Total de logos encontradas: {results.total}</li>
              <li className="text-green-600">Migradas com sucesso: {results.migrated}</li>
              {results.errors.length > 0 && (
                <li className="text-red-600">Erros: {results.errors.length}</li>
              )}
            </ul>
            {results.errors.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-red-600">Ver erros</summary>
                <pre className="mt-2 text-xs bg-red-50 p-2 rounded overflow-auto">
                  {JSON.stringify(results.errors, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}