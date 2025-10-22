import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useViaCEP } from "@/hooks/useViaCEP";
import { Save, Upload, X, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { formatPhone, formatCpfCnpj } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

interface SeusDadosForm {
  razaoSocial: string;
  nomeFantasia: string;
  cnpjCpf: string;
  inscricaoEstadual: string;
  nomeResponsavel: string;
  telefone: string;
  email: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  logomarca?: string;
}

export default function SeusDados() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dados, setDados] = useLocalStorage<SeusDadosForm>("seusDados", {
    razaoSocial: "",
    nomeFantasia: "",
    cnpjCpf: "",
    inscricaoEstadual: "",
    nomeResponsavel: "",
    telefone: "",
    email: "",
    endereco: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    logomarca: "",
  });

  // Buscar perfil do usuário
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const [logomarca, setLogomarca] = useState<string>(dados.logomarca || "");
  const { buscarCEP, loading } = useViaCEP();

  const { register, handleSubmit, setValue, watch, reset } = useForm<SeusDadosForm>({
    defaultValues: dados,
  });

  // Pré-preencher com dados do perfil quando disponível
  useEffect(() => {
    if (profile && !dados.razaoSocial) {
      const initialData = {
        ...dados,
        razaoSocial: profile.nome_confeitaria || "",
        nomeResponsavel: profile.nome_completo || "",
        email: profile.email || "",
        telefone: profile.whatsapp || profile.telefone || "",
        cpfCpf: profile.cpf || "",
        endereco: profile.endereco || "",
        cidade: profile.cidade || "",
        estado: profile.estado || "",
        cep: profile.cep || "",
        logomarca: profile.avatar_url || "",
      };
      setDados(initialData);
      reset(initialData);
      if (profile.avatar_url) {
        setLogomarca(profile.avatar_url);
      }
    }
  }, [profile]);

  const cepValue = watch("cep");

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

  const handleBuscarCEP = async () => {
    const endereco = await buscarCEP(cepValue);
    if (endereco) {
      setValue("endereco", endereco.endereco);
      setValue("bairro", endereco.bairro);
      setValue("cidade", endereco.cidade);
      setValue("estado", endereco.estado);
    }
  };

  // Mutation para atualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: SeusDadosForm) => {
      if (!user) throw new Error("Usuário não autenticado");
      
      const { error } = await supabase
        .from('profiles')
        .update({
          nome_confeitaria: data.razaoSocial,
          nome_completo: data.nomeResponsavel,
          telefone: data.telefone,
          cpf: data.cnpjCpf,
          endereco: data.endereco,
          cidade: data.cidade,
          estado: data.estado,
          cep: data.cep,
          whatsapp: data.telefone,
          avatar_url: logomarca || null,
          primeiro_acesso: false,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Erro do Supabase:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success("✅ Dados salvos com sucesso!");
      
      // Redirecionar automaticamente após salvar
      setTimeout(() => {
        if (profile?.primeiro_acesso) {
          navigate('/');
        } else {
          navigate('/configuracoes');
        }
      }, 1000);
    },
    onError: (error: any) => {
      console.error('Erro ao salvar dados:', error);
      
      // Mensagens de erro mais específicas
      let errorMessage = "Erro ao salvar dados. Tente novamente.";
      
      if (error?.message?.includes("value too long")) {
        errorMessage = "Um dos campos excedeu o tamanho máximo permitido. Verifique os dados e tente novamente.";
      } else if (error?.message) {
        errorMessage = `Erro: ${error.message}`;
      }
      
      toast.error(errorMessage);
    },
  });

  const onSubmit = (data: SeusDadosForm) => {
    setDados({ ...data, logomarca });
    updateProfileMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {!profile?.primeiro_acesso && <BackButton to="/configuracoes" />}
        <div className="flex-1">
          <PageHeader
            title={profile?.primeiro_acesso ? "Bem-vinda! Complete seus dados" : "Dados da Sua Confeitaria"}
            description={profile?.primeiro_acesso ? "Por favor, complete as informações da sua confeitaria para começar" : "Informações da sua empresa"}
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="razaoSocial">Razão Social</Label>
              <Input
                id="razaoSocial"
                {...register("razaoSocial")}
                placeholder="Nome da empresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
              <Input
                id="nomeFantasia"
                {...register("nomeFantasia")}
                placeholder="Nome fantasia da empresa"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cnpjCpf">CNPJ ou CPF</Label>
                <Input
                  id="cnpjCpf"
                  {...register("cnpjCpf")}
                  placeholder="00.000.000/0000-00"
                  onBlur={(e) => setValue("cnpjCpf", formatCpfCnpj(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                <Input
                  id="inscricaoEstadual"
                  {...register("inscricaoEstadual")}
                  placeholder="000.000.000.000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomeResponsavel">Nome da(o) Responsável</Label>
              <Input
                id="nomeResponsavel"
                {...register("nomeResponsavel")}
                placeholder="Nome completo"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone/WhatsApp</Label>
                <Input
                  id="telefone"
                  {...register("telefone")}
                  placeholder="(00) 00000-0000"
                  onBlur={(e) => setValue("telefone", formatPhone(e.target.value))}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <div className="flex gap-2">
                <Input
                  id="cep"
                  {...register("cep")}
                  placeholder="00000-000"
                  maxLength={9}
                  className="max-w-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBuscarCEP}
                  disabled={loading || !cepValue}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? "Buscando..." : "Buscar"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Digite o CEP e clique em Buscar para preencher automaticamente
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  {...register("endereco")}
                  placeholder="Rua, Avenida"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  {...register("numero")}
                  placeholder="Nº"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  {...register("bairro")}
                  placeholder="Bairro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  {...register("cidade")}
                  placeholder="Cidade"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  {...register("estado")}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={updateProfileMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {updateProfileMutation.isPending ? "Salvando..." : profile?.primeiro_acesso ? "Salvar e Continuar" : "Salvar Dados"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
