import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export function MigrateEncomendasImagensToStorage() {
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
      // Buscar todas as encomendas que têm imagens no formato antigo (URLs do topo-bolo)
      const { data: encomendas, error: fetchError } = await supabase
        .from('encomendas')
        .select('id, usuario_id, cliente, topo_imagens')
        .not('topo_imagens', 'is', null);

      if (fetchError) {
        throw fetchError;
      }

      if (!encomendas || encomendas.length === 0) {
        toast.info('Não há encomendas com imagens para processar');
        setIsLoading(false);
        return;
      }

      // Filtrar apenas encomendas que têm URLs antigas (começam com http e contém topo-bolo)
      const encomendasComImagensAntigas = encomendas.filter((enc: any) => {
        const imagens = enc.topo_imagens;
        if (!Array.isArray(imagens) || imagens.length === 0) {
          return false;
        }
        // Verificar se alguma imagem é URL antiga do topo-bolo
        return imagens.some((url: string) => 
          typeof url === 'string' && url.startsWith('http') && url.includes('topo-bolo')
        );
      });

      if (encomendasComImagensAntigas.length === 0) {
        toast.info('Todas as imagens de encomendas já estão no formato novo');
        setIsLoading(false);
        return;
      }

      toast.info(`Encontradas ${encomendasComImagensAntigas.length} encomendas com imagens antigas`);

      const results = [];

      // Processar cada encomenda
      for (const encomenda of encomendasComImagensAntigas) {
        try {
          const novasImagens = [];
          let imagensMigradas = 0;
          
          // Garantir que topo_imagens é um array
          const topoImagens = Array.isArray(encomenda.topo_imagens) ? encomenda.topo_imagens : [];

          // Processar cada imagem da encomenda
          for (let i = 0; i < topoImagens.length; i++) {
            const urlAntiga = topoImagens[i] as string;

            // Se já é um path novo (não começa com http), manter
            if (!urlAntiga.startsWith('http')) {
              novasImagens.push(urlAntiga);
              continue;
            }

            // Se não é do topo-bolo, manter como está
            if (!urlAntiga.includes('topo-bolo')) {
              novasImagens.push(urlAntiga);
              continue;
            }

            try {
              // Extrair o nome do arquivo da URL antiga
              const fileName = urlAntiga.split('/').pop();
              if (!fileName) {
                novasImagens.push(urlAntiga);
                continue;
              }

              // Baixar a imagem do bucket antigo
              const { data: fileData, error: downloadError } = await supabase.storage
                .from('topo-bolo')
                .download(fileName);

              if (downloadError) {
                console.error('Erro ao baixar imagem:', downloadError);
                novasImagens.push(urlAntiga); // Manter URL antiga em caso de erro
                continue;
              }

              // Determinar extensão
              const ext = fileName.split('.').pop() || 'jpg';
              
              // Criar novo path organizado
              const timestamp = Date.now();
              const novoPath = `encomendas/${encomenda.usuario_id}/${encomenda.id}/${timestamp}_${i}.${ext}`;

              // Fazer upload para o novo bucket
              const { error: uploadError } = await supabase.storage
                .from('encomendas')
                .upload(novoPath, fileData, { upsert: false });

              if (uploadError) {
                console.error('Erro ao fazer upload:', uploadError);
                novasImagens.push(urlAntiga); // Manter URL antiga em caso de erro
                continue;
              }

              // Adicionar novo path à lista
              novasImagens.push(novoPath);
              imagensMigradas++;

              // Opcional: Deletar arquivo antigo (comentado por segurança)
              // await supabase.storage.from('topo-bolo').remove([fileName]);

            } catch (error) {
              console.error('Erro ao processar imagem:', error);
              novasImagens.push(urlAntiga); // Manter URL antiga em caso de erro
            }
          }

          // Atualizar encomenda com os novos paths
          if (imagensMigradas > 0) {
            const { error: updateError } = await supabase
              .from('encomendas')
              .update({ topo_imagens: novasImagens })
              .eq('id', encomenda.id);

            if (updateError) {
              results.push({
                encomenda_id: encomenda.id,
                cliente: encomenda.cliente,
                success: false,
                error: updateError.message,
                imagens_migradas: 0
              });
              continue;
            }

            results.push({
              encomenda_id: encomenda.id,
              cliente: encomenda.cliente,
              success: true,
              imagens_migradas: imagensMigradas,
              total_imagens: topoImagens.length
            });
          } else {
            results.push({
              encomenda_id: encomenda.id,
              cliente: encomenda.cliente,
              success: false,
              error: 'Nenhuma imagem foi migrada',
              imagens_migradas: 0
            });
          }

        } catch (error: any) {
          results.push({
            encomenda_id: encomenda.id,
            cliente: encomenda.cliente,
            success: false,
            error: error.message,
            imagens_migradas: 0
          });
        }
      }

      setMigrationResults(results);

      const successCount = results.filter(r => r.success).length;
      const totalMigrated = results.reduce((sum, r) => sum + (r.imagens_migradas || 0), 0);
      const errorCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast.success(`${successCount} encomenda(s) migradas com ${totalMigrated} imagem(ns) no total!`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} encomenda(s) falharam na migração`);
      }

    } catch (error: any) {
      console.error('Erro na migração:', error);
      toast.error(`Erro na migração: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-purple-200 bg-purple-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Upload className="h-5 w-5" />
          Migração de Imagens de Encomendas
        </CardTitle>
        <CardDescription className="text-purple-700">
          Migrar imagens do bucket antigo (topo-bolo) para o novo bucket organizado (encomendas)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-purple-700">
          Esta ferramenta migra imagens de encomendas do bucket antigo e desorganizado 
          para o novo bucket com estrutura organizada por usuário e encomenda.
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
            <h4 className="font-semibold text-sm text-purple-900">Resultados da Migração:</h4>
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
                      <div className="font-semibold">✓ Encomenda: {result.cliente}</div>
                      <div className="text-xs opacity-75">
                        {result.imagens_migradas} de {result.total_imagens} imagem(ns) migradas
                      </div>
                      <div className="text-xs opacity-75">ID: {result.encomenda_id.substring(0, 8)}...</div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-semibold">✗ Erro: {result.cliente}</div>
                      <div className="text-xs opacity-75">Motivo: {result.error}</div>
                      <div className="text-xs opacity-75">ID: {result.encomenda_id.substring(0, 8)}...</div>
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
