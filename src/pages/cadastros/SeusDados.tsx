import { PageHeader } from "@/components/PageHeader";
import { LoadingMascote } from "@/components/LoadingMascote";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useViaCEP } from "@/hooks/useViaCEP";
import {
  Save,
  Upload,
  X,
  Search,
  UserRound,
  Building2,
  MapPin,
  Landmark,
  ShieldCheck,
  PenLine,
  CalendarDays,
  Clock,
  ChevronLeft,
} from "lucide-react";
import meusDadosFooter from "@/assets/meus-dados-hero-banner.png";
import { HeroBanner } from "@/components/HeroBanner";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { formatPhone, formatCpfCnpj } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/contexts/GroupContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

interface SeusDadosForm {
  // Pessoal
  nomeResponsavel: string;
  email: string;

  // Empresa
  razaoSocial: string;       // Razão Social (corresponds to profiles.razao_social)
  nomeFantasia: string;      // Nome Fantasia (corresponds to profiles.nome_confeitaria)
  cnpjCpf: string;
  documentoTipo: "cpf" | "cnpj";
  telefone: string;          // WhatsApp
  telefoneFixo: string;
  emailComercial: string;
  instagram: string;

  // Endereço
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;

  // Bancário
  banco: string;
  agencia: string;
  conta: string;
  tipoConta: string;
  titular: string;
  pix: string;

  // Legal
  inscricaoEstadual: string;
  inscricaoMunicipal: string;
  certificacoes: string;
}

const BANKS = [
  "Banco do Brasil",
  "Bradesco",
  "Caixa Econômica",
  "Itaú",
  "Santander",
  "Nubank",
  "Inter",
  "C6 Bank",
  "PagBank",
  "Mercado Pago",
  "Sicoob",
  "Sicredi",
  "Outro",
];

const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export default function SeusDados() {
  const { user } = useAuth();
  const { activeGroup } = useGroup();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id, activeGroup?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [logomarca, setLogomarca] = useState<string>("");
  const [assinatura, setAssinatura] = useState<string>(""); // path no Storage (bucket privado)
  const [assinaturaPreview, setAssinaturaPreview] = useState<string>(""); // URL assinada para exibição
  const { buscarCEP, loading } = useViaCEP();

  const { register, handleSubmit, setValue, watch, reset } = useForm<SeusDadosForm>();

  useEffect(() => {
    if (!profile) return;
    const bancarios = (profile as any).dados_bancarios || {};
    reset({
      nomeResponsavel: profile.nome_completo || "",
      email: profile.email || "",
      razaoSocial: (profile as any).razao_social || "",
      nomeFantasia: profile.nome_confeitaria || "",
      cnpjCpf: profile.cpf || "",
      documentoTipo: ((profile as any).documento_tipo as "cpf" | "cnpj") || "cpf",
      telefone: profile.whatsapp || profile.telefone || "",
      telefoneFixo: (profile as any).telefone_fixo || "",
      emailComercial: (profile as any).email_comercial || "",
      instagram: (profile as any).instagram || "",
      cep: profile.cep || "",
      endereco: profile.endereco || "",
      numero: (profile as any).numero || "",
      complemento: (profile as any).complemento || "",
      bairro: (profile as any).bairro || "",
      cidade: profile.cidade || "",
      estado: profile.estado || "",
      banco: bancarios.banco || "",
      agencia: bancarios.agencia || "",
      conta: bancarios.conta || "",
      tipoConta: bancarios.tipo_conta || "",
      titular: bancarios.titular || "",
      pix: bancarios.pix || "",
      inscricaoEstadual: (profile as any).inscricao_estadual || "",
      inscricaoMunicipal: (profile as any).inscricao_municipal || "",
      certificacoes: (profile as any).certificacoes || "",
    });
    if (profile.avatar_url) setLogomarca(profile.avatar_url);
    const ass = (profile as any).assinatura_url as string | null;
    if (ass) {
      setAssinatura(ass);
      // Gera URL assinada para exibição (bucket privado)
      if (ass.startsWith("http")) {
        setAssinaturaPreview(ass);
      } else {
        supabase.storage.from("assinaturas").createSignedUrl(ass, 3600).then(({ data }) => {
          if (data?.signedUrl) setAssinaturaPreview(data.signedUrl);
        });
      }
    } else {
      setAssinatura("");
      setAssinaturaPreview("");
    }
  }, [profile, reset]);

  const cepValue = watch("cep");
  const documentoTipo = watch("documentoTipo");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const filePath = `${user.id}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("logotipos")
        .upload(filePath, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from("logotipos").getPublicUrl(filePath);
      setLogomarca(publicUrl);
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id, activeGroup?.id] });
      queryClient.invalidateQueries({ queryKey: ["business-profile", user?.id] });
      toast.success("Logo enviada com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao enviar logo: " + error.message);
    }
  };

  const handleRemoveImage = async () => {
    if (!user) return;
    try {
      const { data: files } = await supabase.storage.from("logotipos").list(`${user.id}`);
      if (files?.length) {
        await supabase.storage.from("logotipos").remove(files.map((f) => `${user.id}/${f.name}`));
      }
      setLogomarca("");
      await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id, activeGroup?.id] });
      queryClient.invalidateQueries({ queryKey: ["business-profile", user?.id] });
      toast.success("Logo removida!");
    } catch (error: any) {
      toast.error("Erro ao remover logo: " + error.message);
    }
  };

  const [salvandoAssinatura, setSalvandoAssinatura] = useState(false);

  const handleAssinaturaDesenhada = async (blob: Blob) => {
    if (!user) return;
    setSalvandoAssinatura(true);
    try {
      const filePath = `${user.id}/assinatura.png`;
      const { error: uploadError } = await supabase.storage
        .from("assinaturas")
        .upload(filePath, blob, { upsert: true, contentType: "image/png" });
      if (uploadError) throw uploadError;
      setAssinatura(filePath);
      const { data: signed } = await supabase.storage
        .from("assinaturas")
        .createSignedUrl(filePath, 3600);
      setAssinaturaPreview(signed?.signedUrl || "");
      await supabase.from("profiles").update({ assinatura_url: filePath } as any).eq("id", user.id);
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id, activeGroup?.id] });
      queryClient.invalidateQueries({ queryKey: ["business-profile", user?.id] });
      toast.success("Assinatura salva!");
    } catch (error: any) {
      toast.error("Erro ao salvar assinatura: " + error.message);
    } finally {
      setSalvandoAssinatura(false);
    }
  };

  const handleRemoveAssinatura = async () => {
    if (!user) return;
    try {
      const { data: files } = await supabase.storage.from("assinaturas").list(`${user.id}`);
      if (files?.length) {
        await supabase.storage.from("assinaturas").remove(files.map((f) => `${user.id}/${f.name}`));
      }
      setAssinatura("");
      setAssinaturaPreview("");
      await supabase.from("profiles").update({ assinatura_url: null } as any).eq("id", user.id);
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id, activeGroup?.id] });
      queryClient.invalidateQueries({ queryKey: ["business-profile", user?.id] });
      toast.success("Assinatura removida!");
    } catch (error: any) {
      toast.error("Erro ao remover assinatura: " + error.message);
    }
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

  const updateProfileMutation = useMutation({
    mutationFn: async (data: SeusDadosForm) => {
      if (!user) throw new Error("Usuário não autenticado");
      const payload: any = {
        nome_completo: data.nomeResponsavel,
        email: data.email,
        nome_confeitaria: data.nomeFantasia,
        razao_social: data.razaoSocial,
        cpf: data.cnpjCpf,
        documento_tipo: data.documentoTipo,
        whatsapp: data.telefone,
        telefone: data.telefone,
        telefone_fixo: data.telefoneFixo || null,
        email_comercial: data.emailComercial || null,
        instagram: data.instagram || null,
        cep: data.cep,
        endereco: data.endereco,
        numero: data.numero,
        complemento: data.complemento || null,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        inscricao_estadual: data.inscricaoEstadual || null,
        inscricao_municipal: data.inscricaoMunicipal || null,
        certificacoes: data.certificacoes || null,
        dados_bancarios: {
          banco: data.banco || null,
          agencia: data.agencia || null,
          conta: data.conta || null,
          tipo_conta: data.tipoConta || null,
          titular: data.titular || null,
          pix: data.pix || null,
        },
        avatar_url: logomarca || null,
        assinatura_url: assinatura || null,
        primeiro_acesso: false,
      };
      const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      const eraOnboarding =
        profile?.primeiro_acesso === true || (profile as any)?.onboarding_concluido !== true;
      await queryClient.invalidateQueries({ queryKey: ["profile", user?.id, activeGroup?.id] });
      await queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      await queryClient.invalidateQueries({ queryKey: ["business-profile", user?.id] });
      await queryClient.refetchQueries({ queryKey: ["profile", user?.id], type: "active" });
      toast.success("✅ Dados salvos com sucesso!");
      if (eraOnboarding) {
        setTimeout(
          () => navigate("/configuracoes/precificacao/mao-de-obra", { replace: true }),
          50
        );
      }
    },
    onError: (error: any) => {
      toast.error(error?.message ? `Erro: ${error.message}` : "Erro ao salvar dados.");
    },
  });

  const onSubmit = (data: SeusDadosForm) => {
    const obrigatorios: Array<{ campo: keyof SeusDadosForm; label: string }> = [
      { campo: "nomeResponsavel", label: "Nome do responsável" },
      { campo: "nomeFantasia", label: "Nome Fantasia" },
      { campo: "cnpjCpf", label: "CPF/CNPJ" },
      { campo: "telefone", label: "WhatsApp" },
      { campo: "cep", label: "CEP" },
      { campo: "endereco", label: "Endereço" },
      { campo: "cidade", label: "Cidade" },
      { campo: "estado", label: "Estado" },
    ];
    for (const { campo, label } of obrigatorios) {
      const valor = data[campo];
      if (!valor || String(valor).trim() === "") {
        toast.error(`${label} é obrigatório`);
        return;
      }
    }
    updateProfileMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingMascote size={72} label="Carregando seus dados..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* ===== HERO BANNER padronizado (mesmo padrão da página Cadastros) ===== */}
      <HeroBanner
        image={meusDadosFooter}
        title={profile?.primeiro_acesso ? "Bem-vinda! Complete seus dados" : "Meus Dados"}
        subtitle="Gerencie seu perfil e os dados empresariais usados em toda a plataforma."
        imageAlt="Meus Dados"
      />




      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="pessoal" className="w-full">
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1 h-auto p-0 mb-6 bg-transparent">
                {[
                  { v: "pessoal", l: "Pessoal", Icon: UserRound },
                  { v: "empresa", l: "Empresa", Icon: Building2 },
                  { v: "endereco", l: "Endereço", Icon: MapPin },
                  { v: "bancario", l: "Bancário", Icon: Landmark },
                  { v: "legal", l: "Legal", Icon: ShieldCheck },
                  { v: "assinatura", l: "Assinatura", Icon: PenLine },
                ].map(({ v, l, Icon }) => (
                  <TabsTrigger
                    key={v}
                    value={v}
                    className="rounded-lg px-4 py-2 text-sm bg-white border border-[#5B1A2B]/15 text-[#3D0F1C]/60 hover:border-[#C9A14A]/50 data-[state=active]:bg-[#C9A14A] data-[state=active]:text-[#3D0F1C] data-[state=active]:font-bold data-[state=active]:border-[#C9A14A] data-[state=active]:shadow-none"
                  >
                    <Icon className="h-3.5 w-3.5 mr-1.5" />
                    <span className="hidden sm:inline">{l}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* PESSOAL */}
              <TabsContent value="pessoal" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nomeResponsavel">Nome Completo</Label>
                    <Input id="nomeResponsavel" {...register("nomeResponsavel")} placeholder="Seu nome completo" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail de Acesso</Label>
                    <Input id="email" type="email" {...register("email")} placeholder="seu@email.com" />
                  </div>
                </div>
              </TabsContent>

              {/* EMPRESA */}
              <TabsContent value="empresa" className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Logo do Negócio
                  </h3>
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
                      <Input type="file" accept="image/*" onChange={handleImageUpload} className="max-w-sm" />
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Formatos: JPG, PNG, WEBP. Máx. 5MB.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Identificação
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nomeFantasia">
                        Nome Fantasia <span className="text-destructive">*</span>
                      </Label>
                      <Input id="nomeFantasia" {...register("nomeFantasia", { required: true })} placeholder="Nome da confeitaria" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="razaoSocial">Razão Social</Label>
                      <Input id="razaoSocial" {...register("razaoSocial")} placeholder="Razão social" />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Documento</Label>
                      <Select value={documentoTipo} onValueChange={(v) => setValue("documentoTipo", v as "cpf" | "cnpj")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cpf">CPF</SelectItem>
                          <SelectItem value="cnpj">CNPJ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpjCpf">CPF / CNPJ</Label>
                      <Input
                        id="cnpjCpf"
                        {...register("cnpjCpf")}
                        placeholder="000.000.000-00 ou 00.000.000/0001-00"
                        onBlur={(e) => setValue("cnpjCpf", formatCpfCnpj(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Contato
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="telefone">
                        WhatsApp <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="telefone"
                        {...register("telefone", { required: true })}
                        placeholder="(00) 00000-0000"
                        onBlur={(e) => setValue("telefone", formatPhone(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefoneFixo">Telefone Fixo</Label>
                      <Input
                        id="telefoneFixo"
                        {...register("telefoneFixo")}
                        placeholder="(00) 0000-0000"
                        onBlur={(e) => setValue("telefoneFixo", formatPhone(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input id="instagram" {...register("instagram")} placeholder="@seuinstagram" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailComercial">E-mail Comercial</Label>
                      <Input id="emailComercial" type="email" {...register("emailComercial")} placeholder="contato@suaconfeitaria.com" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ENDEREÇO */}
              <TabsContent value="endereco" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="flex gap-2">
                    <Input id="cep" {...register("cep")} placeholder="00000-000" maxLength={9} className="max-w-xs" />
                    <Button type="button" variant="outline" onClick={handleBuscarCEP} disabled={loading || !cepValue}>
                      <Search className="h-4 w-4 mr-2" />
                      {loading ? "Buscando..." : "Buscar"}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="endereco">Rua / Avenida</Label>
                    <Input id="endereco" {...register("endereco")} placeholder="Rua, Avenida" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input id="numero" {...register("numero")} placeholder="Nº" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input id="complemento" {...register("complemento")} placeholder="Apto, Sala..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input id="bairro" {...register("bairro")} placeholder="Bairro" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input id="cidade" {...register("cidade")} placeholder="Cidade" />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado (UF)</Label>
                    <Select value={watch("estado")} onValueChange={(v) => setValue("estado", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {UF_LIST.map((uf) => (
                          <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* BANCÁRIO */}
              <TabsContent value="bancario" className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Landmark className="h-4 w-4" /> Dados Bancários
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Banco</Label>
                      <Select value={watch("banco")} onValueChange={(v) => setValue("banco", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o banco" />
                        </SelectTrigger>
                        <SelectContent>
                          {BANKS.map((b) => (
                            <SelectItem key={b} value={b}>{b}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agencia">Agência</Label>
                      <Input id="agencia" {...register("agencia")} placeholder="0000" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="conta">Conta</Label>
                      <Input id="conta" {...register("conta")} placeholder="00000-0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Conta</Label>
                      <Select value={watch("tipoConta")} onValueChange={(v) => setValue("tipoConta", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="corrente">Conta Corrente</SelectItem>
                          <SelectItem value="poupanca">Conta Poupança</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="titular">Titular da Conta</Label>
                      <Input id="titular" {...register("titular")} placeholder="Nome completo do titular" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Chave PIX
                  </h3>
                  <div className="space-y-2">
                    <Input id="pix" {...register("pix")} placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória" />
                    <p className="text-xs text-muted-foreground">
                      Esta chave será exibida nas propostas e contratos para recebimento de pagamentos.
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* LEGAL */}
              <TabsContent value="legal" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                    <Input id="inscricaoEstadual" {...register("inscricaoEstadual")} placeholder="Número da inscrição estadual" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inscricaoMunicipal">Inscrição Municipal</Label>
                    <Input id="inscricaoMunicipal" {...register("inscricaoMunicipal")} placeholder="Número da inscrição municipal" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certificacoes">Certificações / Registros</Label>
                  <Textarea
                    id="certificacoes"
                    {...register("certificacoes")}
                    placeholder="Ex: Alvará Sanitário, Curso de Boas Práticas, MEI nº..."
                    rows={3}
                  />
                </div>
              </TabsContent>

              {/* ASSINATURA */}
              <TabsContent value="assinatura" className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Assinatura Digitalizada
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Envie uma imagem da sua assinatura para inseri-la automaticamente em propostas e contratos.
                  </p>
                  {assinatura ? (
                    <div className="relative inline-block">
                      <img
                        src={assinaturaPreview || assinatura}
                        alt="Assinatura"
                        className="max-w-xs max-h-32 rounded-lg border-2 border-border object-contain bg-muted p-4"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2"
                        onClick={handleRemoveAssinatura}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAssinaturaUpload} className="max-w-sm" />
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Formatos: PNG, JPG, WEBP. Máx. 2MB. Prefira PNG com fundo transparente.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Resumo do Perfil */}
        {(() => {
          const p: any = profile || {};
          const bancarios = p.dados_bancarios || {};
          const secoes = [
            { label: "Pessoal", ok: !!(p.nome_completo && p.email), cor: "#C9A14A" },
            { label: "Empresa", ok: !!(p.nome_confeitaria && p.cpf), cor: "#C9A14A" },
            { label: "Contatos", ok: !!(p.whatsapp || p.telefone), cor: "#5B1A2B" },
            { label: "Endereço", ok: !!(p.cep && p.endereco && p.cidade && p.estado), cor: "#5B1A2B" },
            { label: "Completo", ok: !!(bancarios.banco || bancarios.pix), cor: "#FDF6EE", border: true },
          ];
          const preenchidas = secoes.filter((s) => s.ok).length;
          const pct = Math.round((preenchidas / secoes.length) * 100);

          const lastSignIn = (user as any)?.last_sign_in_at as string | undefined;
          const ultimoAcesso = lastSignIn
            ? new Date(lastSignIn).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "UTC",
              }) + " UTC"
            : "—";

          return (
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-[#3D0F1C]">
                  <CalendarDays className="h-5 w-5 text-[#5B1A2B]" />
                  <h2 className="text-[18px]" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Resumo do Perfil
                  </h2>
                </div>
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="rounded-lg px-5 py-2.5 text-sm bg-[#3D0F1C] hover:bg-[#5B1A2B] text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateProfileMutation.isPending
                    ? "Salvando..."
                    : profile?.primeiro_acesso
                    ? "Salvar e Continuar"
                    : "Salvar Dados"}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Completude */}
                <div className="bg-white border border-[#5B1A2B]/10 rounded-xl p-5 flex gap-4 items-start">
                  <div className="w-13 h-13 rounded-full bg-[#FDF6EE] flex items-center justify-center shrink-0" style={{ width: 52, height: 52 }}>
                    <ShieldCheck className="h-6 w-6 text-[#C9A14A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] text-[#3D0F1C] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Completude do Perfil
                    </h3>
                    <div className="h-3 rounded-full bg-[#FDF6EE] overflow-hidden">
                      <div
                        className="h-full bg-[#C9A14A] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3">
                      {secoes.map((s) => (
                        <div key={s.label} className="flex items-center gap-1.5 text-[11px] text-[#3D0F1C]/80">
                          <span
                            className={`inline-block w-2.5 h-2.5 rounded-sm ${s.border ? "border border-[#5B1A2B]/20" : ""}`}
                            style={{ backgroundColor: s.cor }}
                          />
                          {s.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Último Acesso */}
                <div
                  className="border border-[#5B1A2B]/10 rounded-xl p-5 flex gap-4 items-center"
                  style={{ background: "linear-gradient(135deg, #FDF6EE 0%, #FFFFFF 100%)" }}
                >
                  <div className="rounded-full bg-white flex items-center justify-center shrink-0 border border-[#5B1A2B]/10" style={{ width: 52, height: 52 }}>
                    <Clock className="h-6 w-6 text-[#5B1A2B]" />
                  </div>
                  <div>
                    <h3 className="text-[15px] text-[#3D0F1C]" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Último Acesso
                    </h3>
                    <p className="text-sm text-[#3D0F1C] mt-1">{ultimoAcesso}</p>
                  </div>
                </div>
              </div>
            </section>
          );
        })()}
      </form>

      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Voltar"
        className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-[#5B1A2B] hover:bg-[#3D0F1C] text-white shadow-lg flex items-center justify-center transition"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    </div>
  );
}
