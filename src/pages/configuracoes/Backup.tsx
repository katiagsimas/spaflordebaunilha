import React, { useState, useEffect } from "react";
import { HardDrive, Download, Upload, Clock, Play, Loader2, FileDown, Info, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BackButton } from "@/components/BackButton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface BackupRecord {
  id: string;
  nome: string;
  created_at: string;
  tamanho: string;
}

function gerarIniciais(nomeCompleto: string): string {
  if (!nomeCompleto) return "USR";
  return nomeCompleto
    .trim()
    .split(/\s+/)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

function gerarNomeBackup(nomeCompleto: string): string {
  const iniciais = gerarIniciais(nomeCompleto);
  const hoje = format(new Date(), "ddMMyyyy");
  return `CAIXA${iniciais}${hoje}`;
}

export default function Backup() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const queryClient = useQueryClient();
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [realizandoBackup, setRealizandoBackup] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [ultimoBackup, setUltimoBackup] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Agendamento local (persistido em localStorage)
  const [agendamentoAtivo, setAgendamentoAtivo] = useState(false);
  const [frequencia, setFrequencia] = useState("semanal");
  const [horario, setHorario] = useState("08:00");

  useEffect(() => {
    const saved = localStorage.getItem("backup_config");
    if (saved) {
      const config = JSON.parse(saved);
      setAgendamentoAtivo(config.ativo ?? false);
      setFrequencia(config.frequencia ?? "semanal");
      setHorario(config.horario ?? "08:00");
    }
    carregarBackups();
  }, [user]);

  function salvarConfigAgendamento(ativo: boolean, freq: string, hr: string) {
    localStorage.setItem("backup_config", JSON.stringify({ ativo, frequencia: freq, horario: hr }));
  }

  async function carregarBackups() {
    if (!user) return;
    setCarregando(true);
    try {
      const { data, error } = await (supabase
        .from("backups" as any)
        .select("id, nome, created_at, tamanho")
        .order("created_at", { ascending: false })
        .limit(20) as any);

      if (!error && data) {
        setBackups(data);
        if (data.length > 0) {
          setUltimoBackup(data[0].created_at);
        }
      }
    } catch {
      // silently fail
    } finally {
      setCarregando(false);
    }
  }

  async function coletarDados() {
    if (!user) return null;

    const tabelas = [
      "categorias", "clientes", "fornecedores", "ingredientes", "embalagens",
      "receitas", "encomendas", "encomenda_itens", "custos_fixos", "unidades_medida",
      "tipos_insumos", "pre_preparos", "mao_obra_perfis", "bancos", "plano_contas",
      "categorias_plano_contas", "tipos_documento", "contas_receber",
      "contas_receber_parcelas", "contas_pagar", "contas_pagar_parcelas",
      "tags_encomendas", "configuracoes_juros",
    ];

    const dados: Record<string, any[]> = {};

    for (const tabela of tabelas) {
      try {
        const { data, error } = await (supabase.from(tabela as any).select("*") as any);
        if (!error && data) {
          dados[tabela] = data;
        }
      } catch {
        // Tabela pode não existir ou não ter permissão
      }
    }

    return dados;
  }

  async function realizarBackup() {
    if (!user || !profile) {
      toast.error("Perfil do usuário não carregado.");
      return;
    }

    setRealizandoBackup(true);
    try {
      const dados = await coletarDados();
      if (!dados) throw new Error("Falha ao coletar dados");

      const nomeBackup = gerarNomeBackup(profile.nome_completo || "");
      const jsonStr = JSON.stringify(dados);
      const tamanhoKB = (new Blob([jsonStr]).size / 1024).toFixed(1);

      // Salvar no banco de dados
      const { error } = await (supabase.from("backups" as any).insert({
        usuario_id: user.id,
        nome: nomeBackup,
        tamanho: `${tamanhoKB} KB`,
        dados: dados,
      }) as any);

      if (error) throw error;

      await carregarBackups();
      queryClient.invalidateQueries({ queryKey: ['ultimo-backup'] });
      toast.success(`Backup "${nomeBackup}" realizado e salvo com sucesso!`);
    } catch (err: any) {
      toast.error("Erro ao realizar backup: " + err.message);
    } finally {
      setRealizandoBackup(false);
    }
  }

  async function downloadBackup(backupId: string, nome: string) {
    try {
      const { data, error } = await (supabase
        .from("backups" as any)
        .select("dados")
        .eq("id", backupId)
        .single() as any);

      if (error || !data) {
        toast.error("Erro ao baixar backup.");
        return;
      }

      const jsonStr = JSON.stringify(data.dados, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${nome}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao baixar backup.");
    }
  }

  async function deletarBackup() {
    if (!deleteId) return;
    try {
      const { error } = await (supabase
        .from("backups" as any)
        .delete()
        .eq("id", deleteId) as any);

      if (error) throw error;
      toast.success("Backup excluído.");
      await carregarBackups();
    } catch {
      toast.error("Erro ao excluir backup.");
    } finally {
      setDeleteId(null);
    }
  }

  function handleRestaurar() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setRestaurando(true);
      try {
        const text = await file.text();
        const dados = JSON.parse(text);

        if (typeof dados !== "object" || Array.isArray(dados)) {
          throw new Error("Arquivo de backup inválido.");
        }

        const tabelasRestauradas = Object.keys(dados).length;
        toast.success(
          `Backup "${file.name}" carregado com ${tabelasRestauradas} tabelas. A restauração completa requer suporte técnico para evitar conflitos de dados.`
        );
      } catch (err: any) {
        toast.error("Erro ao ler arquivo: " + err.message);
      } finally {
        setRestaurando(false);
      }
    };
    input.click();
  }

  const ultimoBackupFormatado = ultimoBackup
    ? format(new Date(ultimoBackup), "dd/MM 'às' HH:mm")
    : null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BackButton to="/configuracoes" />
        <div className="flex items-center gap-3">
          <HardDrive className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Backup</h1>
            <p className="text-muted-foreground">
              Gerencie backups do seu projeto
            </p>
          </div>
        </div>
      </div>

      {/* Card Informativo */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                💾 Sobre os Backups
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                O backup exporta todos os dados do seu projeto e é salvo diretamente no banco de dados.
                O nome segue o padrão{" "}
                <strong>CAIXA + Iniciais do seu nome + Data (DDMMAAAA)</strong>.
                Exemplo:{" "}
                <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">
                  {profile?.nome_completo
                    ? gerarNomeBackup(profile.nome_completo)
                    : "CAIXAKGSS09042026"}
                </code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de ações */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Backup Manual */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Backup Manual</CardTitle>
                <CardDescription className="text-xs">
                  Exporte seus dados agora
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              onClick={realizarBackup}
              disabled={realizandoBackup || profileLoading}
              className="w-full"
            >
              {realizandoBackup ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando backup...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Realizar Backup Agora
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Agendar Backup */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Agendamento</CardTitle>
                <CardDescription className="text-xs">
                  Configure backups automáticos
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="agendamento" className="text-sm">
                Ativar agendamento
              </Label>
              <Switch
                id="agendamento"
                checked={agendamentoAtivo}
                onCheckedChange={(checked) => {
                  setAgendamentoAtivo(checked);
                  salvarConfigAgendamento(checked, frequencia, horario);
                  toast.success(
                    checked ? "Agendamento ativado!" : "Agendamento desativado."
                  );
                }}
              />
            </div>
            {agendamentoAtivo && (
              <div className="space-y-3">
                <Select
                  value={frequencia}
                  onValueChange={(v) => {
                    setFrequencia(v);
                    salvarConfigAgendamento(agendamentoAtivo, v, horario);
                    toast.success(`Frequência alterada para ${v}.`);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diario">Diário</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="quinzenal">Quinzenal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>
                <div className="space-y-1">
                  <Label htmlFor="horario" className="text-xs text-muted-foreground">
                    Horário do backup
                  </Label>
                  <Input
                    id="horario"
                    type="time"
                    value={horario}
                    onChange={(e) => {
                      const val = e.target.value;
                      setHorario(val);
                      salvarConfigAgendamento(agendamentoAtivo, frequencia, val);
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Restaurar Backup */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Restaurar</CardTitle>
                <CardDescription className="text-xs">
                  Importe um backup anterior
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={handleRestaurar}
              disabled={restaurando}
              className="w-full"
            >
              {restaurando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Arquivo .json
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Backups */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Backups</CardTitle>
          <CardDescription>
            Últimos backups realizados (salvos no banco de dados)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : backups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum backup realizado ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {backups.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <HardDrive className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{b.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(b.created_at), "dd/MM/yyyy HH:mm")} •{" "}
                        {b.tamanho}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => downloadBackup(b.id, b.nome)}
                    >
                      <FileDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(b.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir Backup"
        description="Tem certeza que deseja excluir este backup? Esta ação não pode ser desfeita."
        onConfirm={deletarBackup}
        confirmLabel="Excluir"
      />
    </div>
  );
}
