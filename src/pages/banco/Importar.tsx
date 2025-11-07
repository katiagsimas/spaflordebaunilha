import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserId } from "@/hooks/useUserId";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { FileQuestion } from "lucide-react";

interface BankRule {
  id: string;
  bank_name: string;
}

export default function BankImportPage() {
  const userId = useUserId();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [selectedRuleId, setSelectedRuleId] = useState<string>("");
  const [previewLines, setPreviewLines] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const { data: rules, isLoading } = useQuery({
    queryKey: ["bank-rules", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_rules")
        .select("id, bank_name")
        .eq("usuario_id", userId)
        .order("bank_name");

      if (error) throw error;
      return data as BankRule[];
    }
  });

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande (máx. 10MB)", variant: "destructive" });
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim()).slice(0, 20);
      setPreviewLines(lines);
    };
    reader.readAsText(selectedFile);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.endsWith(".csv")) {
      handleFileSelect(droppedFile);
    } else {
      toast({ title: "Apenas arquivos .csv são aceitos", variant: "destructive" });
    }
  }, [handleFileSelect]);

  const handleProcess = async () => {
    if (!file || !selectedRuleId) {
      toast({ title: "Selecione um arquivo e uma regra", variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvContent = e.target?.result as string;
        const lines = csvContent.split("\n").filter(l => l.trim());

        const { data: importData, error: importError } = await supabase
          .from("bank_imports")
          .insert({
            usuario_id: userId,
            filename: file.name,
            uploaded_by: userId,
            rows_count: lines.length,
            status: "uploaded"
          })
          .select()
          .single();

        if (importError) throw importError;

        const rawEntries = lines.map((line, idx) => ({
          import_id: importData.id,
          line_number: idx + 1,
          raw_data: { line },
          hash_key: `${importData.id}-${idx}`
        }));

        const { error: entriesError } = await supabase
          .from("bank_raw_entries")
          .insert(rawEntries);

        if (entriesError) throw entriesError;

        const { data: ingestResult, error: ingestError } = await supabase
          .rpc("fn_ingest_bank_csv", {
            p_import_id: importData.id,
            p_rules_id: selectedRuleId
          });

        if (ingestError) throw ingestError;

        const { data: matchResult, error: matchError } = await supabase
          .rpc("fn_suggest_matches", {
            p_import_id: importData.id,
            p_from_date: null,
            p_to_date: null
          });

        if (matchError) throw matchError;

        toast({
          title: "Processamento concluído",
          description: `${ingestResult?.[0]?.inserted_count || 0} lançamentos processados, ${matchResult?.[0]?.suggested_count || 0} sugestões encontradas`
        });

        navigate(`/banco/reconciliar/${importData.id}`);
      };

      reader.readAsText(file);
    } catch (error: any) {
      toast({ title: "Erro ao processar arquivo", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-6">Carregando...</div>;
  }

  if (!rules || rules.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <PageHeader title="Importar Extrato" description="Faça upload de arquivos CSV bancários" />
        <Card className="mt-6">
          <CardContent className="pt-6">
            <EmptyState
              icon={FileQuestion}
              title="Nenhuma regra cadastrada"
              description="Você precisa criar uma regra de importação antes de processar arquivos CSV"
              actionLabel="Ir para Regras"
              onAction={() => navigate("/banco/regras")}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader title="Importar Extrato" description="Faça upload de arquivos CSV bancários" />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Upload do Arquivo</CardTitle>
            <CardDescription>Arraste ou selecione um arquivo CSV (máx. 10MB)</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 mx-auto text-primary" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  <Button variant="outline" size="sm" onClick={() => { setFile(null); setPreviewLines([]); }}>
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">Arraste um arquivo CSV aqui</p>
                    <p className="text-sm text-muted-foreground">ou</p>
                  </div>
                  <Button variant="outline" onClick={() => document.getElementById("file-input")?.click()}>
                    Selecionar Arquivo
                  </Button>
                  <input
                    id="file-input"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Selecionar Regra</CardTitle>
            <CardDescription>Escolha a configuração do banco correspondente</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedRuleId} onValueChange={setSelectedRuleId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma regra..." />
              </SelectTrigger>
              <SelectContent>
                {rules.map((rule) => (
                  <SelectItem key={rule.id} value={rule.id}>
                    {rule.bank_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {previewLines.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>3. Preview</CardTitle>
              <CardDescription>Primeiras {previewLines.length} linhas do arquivo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Conteúdo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewLines.map((line, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-xs">{line}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/banco/regras")}>
            Editar Regra
          </Button>
          <Button
            onClick={handleProcess}
            disabled={!file || !selectedRuleId || isProcessing}
          >
            {isProcessing ? (
              "Processando..."
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Processar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
