import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HardDrive, Download, Upload, Clock, Play, Loader2, FileDown, Info, Trash2, RotateCcw, Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [restaurarDialogOpen, setRestaurarDialogOpen] = useState(false);
  const [backupSelecionado, setBackupSelecionado] = useState<string | null>(null);

  // Agendamento persistido no banco (por usuário)
  const [agendamentoAtivo, setAgendamentoAtivo] = useState(false);
  const [frequencia, setFrequencia] = useState("semanal");
  const [horario, setHorario] = useState("08:00");
  const [salvandoAgendamento, setSalvandoAgendamento] = useState(false);

  useEffect(() => {
    carregarBackups();
    carregarAgendamento();
  }, [user]);

  async function carregarAgendamento() {
    if (!user) return;
    const { data } = await (supabase
      .from("backup_agendamentos" as any)
      .select("ativo, frequencia, horario")
      .eq("usuario_id", user.id)
      .maybeSingle() as any);
    if (data) {
      setAgendamentoAtivo(!!data.ativo);
      setFrequencia(data.frequencia ?? "semanal");
      setHorario((data.horario ?? "08:00:00").slice(0, 5));
    }
  }

  async function salvarAgendamento(ativo: boolean, freq: string, hr: string) {
    if (!user) return;
    setSalvandoAgendamento(true);
    try {
      const { data: prox } = await (supabase.rpc("calcular_proxima_execucao_backup" as any, {
        p_frequencia: freq,
        p_horario: hr,
        p_referencia: new Date().toISOString(),
      }) as any);

      const { error } = await (supabase.from("backup_agendamentos" as any).upsert({
        usuario_id: user.id,
        ativo,
        frequencia: freq,
        horario: hr,
        proximo_execucao_em: ativo ? prox : null,
      }, { onConflict: "usuario_id" }) as any);

      if (error) throw error;
    } catch (err: any) {
      toast.error("Erro ao salvar agendamento: " + err.message);
      throw err;
    } finally {
      setSalvandoAgendamento(false);
    }
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

  async function restaurarDoHistorico(backupId: string) {
    setRestaurando(true);
    try {
      const { data, error } = await (supabase
        .from("backups" as any)
        .select("dados, nome")
        .eq("id", backupId)
        .single() as any);

      if (error || !data) throw new Error("Erro ao buscar backup.");

      const tabelasRestauradas = Object.keys(data.dados).length;
      toast.success(
        `Backup "${data.nome}" carregado com ${tabelasRestauradas} tabelas. A restauração completa requer suporte técnico para evitar conflitos de dados.`
      );
    } catch (err: any) {
      toast.error("Erro ao restaurar: " + err.message);
    } finally {
      setRestaurando(false);
      setRestaurarDialogOpen(false);
      setBackupSelecionado(null);
    }
  }

  function handleRestaurarArquivo() {
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
        setRestaurarDialogOpen(false);
      }
    };
    input.click();
  }

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
            <Select
              value={frequencia}
              onValueChange={async (v) => {
                setFrequencia(v);
                try {
                  await salvarAgendamento(agendamentoAtivo, v, horario);
                } catch {}
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
                onChange={(e) => setHorario(e.target.value)}
                onBlur={async () => {
                  try {
                    await salvarAgendamento(agendamentoAtivo, frequencia, horario);
                  } catch {}
                }}
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <Label htmlFor="agendamento" className="text-sm">
                Ativar agendamento
              </Label>
              <Switch
                id="agendamento"
                disabled={salvandoAgendamento}
                checked={agendamentoAtivo}
                onCheckedChange={async (checked) => {
                  setAgendamentoAtivo(checked);
                  try {
                    await salvarAgendamento(checked, frequencia, horario);
                    toast.success(
                      checked
                        ? "Agendamento ativado e salvo!"
                        : "Agendamento desativado."
                    );
                  } catch {
                    setAgendamentoAtivo(!checked);
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Restaurar Backup */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Restaurar</CardTitle>
                <CardDescription className="text-xs">
                  Restaure a partir do histórico ou arquivo
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => setRestaurarDialogOpen(true)}
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
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restaurar Backup
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

      {/* Dialog Restaurar */}
      <Dialog open={restaurarDialogOpen} onOpenChange={setRestaurarDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Restaurar Backup</DialogTitle>
            <DialogDescription>
              Selecione um backup salvo no banco de dados ou importe um arquivo .json
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Opção: Do banco de dados */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Database className="h-4 w-4" /> Backups salvos
              </Label>
              {backups.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">
                  Nenhum backup encontrado no banco de dados.
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
                  {backups.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setBackupSelecionado(b.id)}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                        backupSelecionado === b.id
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <HardDrive className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{b.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(b.created_at), "dd/MM/yyyy HH:mm")} • {b.tamanho}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button
                onClick={() => backupSelecionado && restaurarDoHistorico(backupSelecionado)}
                disabled={!backupSelecionado || restaurando}
                className="w-full"
                size="sm"
              >
                {restaurando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Restaurando...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restaurar Selecionado
                  </>
                )}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            {/* Opção: Importar arquivo */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4" /> Importar arquivo
              </Label>
              <Button
                variant="outline"
                onClick={handleRestaurarArquivo}
                disabled={restaurando}
                className="w-full"
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Selecionar Arquivo .json
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
