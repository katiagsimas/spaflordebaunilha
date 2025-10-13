import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface SeusDadosForm {
  razaoSocial: string;
  cnpjCpf: string;
  nomeResponsavel: string;
  telefone: string;
  email: string;
}

export default function SeusDados() {
  const navigate = useNavigate();
  const [dados, setDados] = useLocalStorage<SeusDadosForm>("seusDados", {
    razaoSocial: "",
    cnpjCpf: "",
    nomeResponsavel: "",
    telefone: "",
    email: "",
  });

  const { register, handleSubmit } = useForm<SeusDadosForm>({
    defaultValues: dados,
  });

  const onSubmit = (data: SeusDadosForm) => {
    setDados(data);
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
