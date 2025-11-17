import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export function MigrateReceitasImagensToStorage() {
  const [isLoading, setIsLoading] = useState(false);
  const [migrationResults, setMigrationResults] = useState<any[]>([]);
  const { isAdmin } = useIsAdmin();

  if (!isAdmin) {
    return null;
  }

  const migrateImages = async () => {
    setIsLoading(true);
    setMigrationResults([]);
    
    try {
      // Buscar todas as imagens com base64
      const { data: imagensBase64, error: fetchError } = await supabase
        .from('receitas_imagens')
        .select(`
          id,
          receita_id,
          url,
          ordem,
          receitas (
            usuario_id
          )
        `)
        .like('url', 'data:image%');

      if (fetchError) {
        throw fetchError;
      }

      if (!imagensBase64 || imagensBase64.length === 0) {
        toast.info('Não há imagens em base64 para migrar');
        setIsLoading(false);
        return;
      }

      toast.info(`Encontradas ${imagensBase64.length} imagens para migrar`);

      const results = [];

      // Processar cada imagem
      for (const imagem of imagensBase64) {
        try {
          const base64Url = imagem.url;
          const receitaId = imagem.receita_id;
          const usuarioId = (imagem.receitas as any)?.usuario_id;
          
          if (!usuarioId) {
            results.push({
              id: imagem.id,
              success: false,
              error: 'Usuario ID não encontrado'
            });
            continue;
          }

          // Converter base64 para blob
          const response = await fetch(base64Url);
          const blob = await response.blob();

          // Determinar extensão do arquivo
          const mimeType = blob.type;
          const ext = mimeType.split('/')[1] || 'jpg';

          // Criar path no Storage
          const timestamp = Date.now();
          const fileName = `migrated_${timestamp}.${ext}`;
          const path = `receitas/${usuarioId}/${receitaId}/${fileName}`;

          // Fazer upload para o Storage
          const { error: uploadError } = await supabase.storage
            .from('receitas')
            .upload(path, blob, { upsert: false });

          if (uploadError) {
            results.push({
              id: imagem.id,
              success: false,
              error: uploadError.message
            });
            continue;
          }

          // Atualizar o registro no banco com o novo path
          const { error: updateError } = await supabase
            .from('receitas_imagens')
            .update({ url: path })
            .eq('id', imagem.id);

          if (updateError) {
            results.push({
              id: imagem.id,
              success: false,
              error: updateError.message
            });
            continue;
          }

          results.push({
            id: imagem.id,
            receita_id: receitaId,
            old_url: base64Url.substring(0, 50) + '...',
            new_url: path,
            success: true
          });

        } catch (error: any) {
          results.push({
            id: imagem.id,
            success: false,
            error: error.message
          });
        }
      }

      setMigrationResults(results);

      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast.success(`${successCount} imagens migradas com sucesso!`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} imagens falharam na migração`);
      }

    } catch (error: any) {
      console.error('Erro na migração:', error);
      toast.error(`Erro na migração: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <Upload className="h-5 w-5" />
          Migração de Imagens de Receitas
        </CardTitle>
        <CardDescription className="text-orange-700">
          Migrar imagens em base64 para Supabase Storage (bucket: receitas)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-orange-700">
          Esta ferramenta migra todas as imagens de receitas que estão salvas em formato base64 
          para o Supabase Storage, melhorando a performance e reduzindo o tamanho do banco de dados.
        </div>

        <Button
          onClick={migrateImages}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Migrando imagens...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Iniciar Migração
            </>
          )}
        </Button>

        {migrationResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold text-sm text-orange-900">Resultados da Migração:</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {migrationResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-xs ${
                    result.success
                      ? 'bg-green-50 border border-green-200 text-green-900'
                      : 'bg-red-50 border border-red-200 text-red-900'
                  }`}
                >
                  {result.success ? (
                    <div className="space-y-1">
                      <div className="font-semibold">✓ Imagem {result.id.substring(0, 8)}... migrada</div>
                      <div className="text-xs opacity-75">Receita: {result.receita_id.substring(0, 8)}...</div>
                      <div className="text-xs opacity-75">Novo path: {result.new_url}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-semibold">✗ Erro ao migrar imagem {result.id.substring(0, 8)}...</div>
                      <div className="text-xs opacity-75">Erro: {result.error}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
