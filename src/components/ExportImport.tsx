import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ExportImportProps {
  storageKey: string;
  dataLabel: string;
}

export function ExportImport({ storageKey, dataLabel }: ExportImportProps) {
  const { toast } = useToast();

  const handleExport = () => {
    try {
      const data = localStorage.getItem(storageKey);
      if (!data) {
        toast({
          title: "Nenhum dado encontrado",
          description: `Não há ${dataLabel.toLowerCase()} para exportar.`,
          variant: "destructive",
        });
        return;
      }

      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${storageKey}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Dados exportados com sucesso!",
        description: `Seus ${dataLabel.toLowerCase()} foram salvos em arquivo.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      });
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        JSON.parse(content); // Valida se é JSON válido
        localStorage.setItem(storageKey, content);
        
        toast({
          title: "Dados importados com sucesso!",
          description: `Seus ${dataLabel.toLowerCase()} foram restaurados.`,
        });
        
        // Recarrega a página para atualizar os dados
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        toast({
          title: "Erro ao importar",
          description: "O arquivo não é válido ou está corrompido.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // Limpa o input
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleExport} variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        Exportar
      </Button>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Importar dados</AlertDialogTitle>
            <AlertDialogDescription>
              Atenção: Importar um arquivo substituirá todos os {dataLabel.toLowerCase()} atuais. 
              Esta ação não pode ser desfeita. Recomendamos fazer uma exportação antes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction asChild>
              <label className="cursor-pointer">
                Continuar e Selecionar Arquivo
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
