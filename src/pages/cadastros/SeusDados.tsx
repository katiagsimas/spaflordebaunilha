import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ArrowLeft, Save, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState } from "react";

interface SeusDadosForm {
  razaoSocial: string;
  cnpjCpf: string;
  nomeResponsavel: string;
  telefone: string;
  email: string;
  logomarca?: string;
}

export default function SeusDados() {
  const navigate = useNavigate();
  const [dados, setDados] = useLocalStorage<SeusDadosForm>("seusDados", {
    razaoSocial: "",
    cnpjCpf: "",
    nomeResponsavel: "",
    telefone: "",
    email: "",
    logomarca: "",
  });

  const [logomarca, setLogomarca] = useState<string>(dados.logomarca || "");

  const { register, handleSubmit } = useForm<SeusDadosForm>({
    defaultValues: dados,
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 5MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogomarca(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setLogomarca("");
  };

  const onSubmit = (data: SeusDadosForm) => {
    setDados({ ...data, logomarca });
    toast.success("Dados salvos com sucesso!");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seus Dados"
        description="Informações da sua empresa"
        actions={
          <Button variant="outline" onClick={() => navigate("/cadastros")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="razaoSocial">Razão Social</Label>
              <Input
                id="razaoSocial"
                {...register("razaoSocial")}
                placeholder="Nome da empresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpjCpf">CNPJ ou CPF</Label>
              <Input
                id="cnpjCpf"
                {...register("cnpjCpf")}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomeResponsavel">Nome da(o) Responsável</Label>
              <Input
                id="nomeResponsavel"
                {...register("nomeResponsavel")}
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone/WhatsApp</Label>
              <Input
                id="telefone"
                {...register("telefone")}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logomarca">Logomarca da Empresa</Label>
              <div className="space-y-4">
                {logomarca ? (
                  <div className="relative inline-block">
                    <img 
                      src={logomarca} 
                      alt="Logomarca" 
                      className="max-w-xs max-h-48 rounded-lg border-2 border-border object-contain bg-muted p-4"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Input
                      id="logomarca"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="max-w-sm"
                    />
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Formatos aceitos: JPG, PNG, WEBP. Tamanho máximo: 5MB
                </p>
              </div>
            </div>

            <Button type="submit" className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Salvar Dados
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
