import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  HardDrive, Download, Upload, Clock, Play, Loader2, FileDown, Info, Trash2, RotateCcw, Database, Package,
  ChevronLeft, Archive, UtensilsCrossed, ShoppingBag, Briefcase, Settings2, Shield,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/BackButton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { BACKUP_MODULOS, DEFAULT_MODULOS, tabelasDosModulos, modulosDisponiveis, type BackupModuloId } from "@/lib/backupCatalog";
import { useGroup } from "@/contexts/GroupContext";
import { RestaurarBackupDialog, type RestaurarBackupAlvo } from "@/components/backup/RestaurarBackupDialog";
import { ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Tooltip } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import backupHeroImg from "@/assets/backup-hero-banner.png";
import { backupLocation } from "@/lib/backupLocation";
import { FolderOpen, FolderCheck } from "lucide-react";

const MODULO_ICONS: Record<BackupModuloId, React.ComponentType<{ className?: string }>> = {
  operacao: UtensilsCrossed,
  comercial: ShoppingBag,
  negocio: Briefcase,
  sistema: Settings2,
  governanca: Shield,
};

const PLAYFAIR = "'Playfair Display', serif";

interface BackupRecord {
  id: string;
  nome: string;
  created_at: string;
  tamanho: string;
  modulos?: string[] | null;
  origem?: string | null;
}

function gerarIniciais(nomeCompleto: string): string {
  if (!nomeCompleto) return "USR";
  return nomeCompleto.trim().split(/\s+/).map((p) => p.charAt(0).toUpperCase()).join("");
}

function gerarNomeBackup(nomeCompleto: string): string {
  return `CAIXA${gerarIniciais(nomeCompleto)}${format(new Date(), "ddMMyyyy")}`;
}

const RETENCAO_OPCOES = [7, 15, 30, 60, 90, 180, 365];

import { useIsGroupMaster } from "@/hooks/useIsGroupMaster";
import { MasterOnlyGuard } from "@/components/MasterOnlyGuard";

export default function Backup() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { isMother } = useGroup();
  const { isMaster, isLoading: isMasterLoading } = useIsGroupMaster();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const modulosVisiveis = modulosDisponiveis(isMother);


  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [realizandoBackup, setRealizandoBackup] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [restaurarDialogOpen, setRestaurarDialogOpen] = useState(false);
  const [backupSelecionado, setBackupSelecionado] = useState<string | null>(null);
  const [restaurarAlvo, setRestaurarAlvo] = useState<RestaurarBackupAlvo | null>(null);
  const [restaurarPayload, setRestaurarPayload] = useState<
    | { tipo: "historico"; backup_id: string }
    | { tipo: "upload"; dados: Record<string, any[]>; nome: string }
    | null
  >(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Seleção de módulos para backup manual
  const [modulosManual, setModulosManual] = useState<BackupModuloId[]>(DEFAULT_MODULOS);

  // Local de salvamento (pasta do computador) — opcional
  const fsApiSupported = backupLocation.isSupported();
  const [pastaSalvamento, setPastaSalvamento] = useState<string | null>(null);
  const [escolhendoPasta, setEscolhendoPasta] = useState(false);

  // Agendamento persistido no banco
  const [agendamentoAtivo, setAgendamentoAtivo] = useState(false);
  const [frequencia, setFrequencia] = useState("semanal");
  const [horario, setHorario] = useState("08:00");
  const [retencaoDias, setRetencaoDias] = useState(30);
  const [modulosAgendamento, setModulosAgendamento] = useState<BackupModuloId[]>(DEFAULT_MODULOS);
  const [salvandoAgendamento, setSalvandoAgendamento] = useState(false);

  useEffect(() => {
    carregarBackups();
    carregarAgendamento();
    setPastaSalvamento(backupLocation.getSavedFolderName());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function escolherPasta() {
    if (!fsApiSupported) {
      toast.info("Seu navegador não permite escolher pasta. Tente Chrome, Edge ou Brave.");
      return;
    }
    setEscolhendoPasta(true);
    try {
      const res = await backupLocation.pickFolder();
      if (res) {
        setPastaSalvamento(res.name);
        toast.success(`Backups serão salvos em "${res.name}"`);
      }
    } catch (err: any) {
      toast.error("Não foi possível selecionar a pasta: " + (err?.message || ""));
    } finally {
      setEscolhendoPasta(false);
    }
  }

  async function limparPasta() {
    await backupLocation.clearFolder();
    setPastaSalvamento(null);
    toast.success("Backups voltarão para a pasta Downloads do navegador.");
  }

  async function carregarAgendamento() {
    if (!user) return;
    const { data } = await (supabase
      .from("backup_agendamentos" as any)
      .select("ativo, frequencia, horario, retencao_dias, modulos")
      .eq("usuario_id", user.id)
      .maybeSingle() as any);
    if (data) {
      setAgendamentoAtivo(!!data.ativo);
      setFrequencia(data.frequencia ?? "semanal");
      setHorario((data.horario ?? "08:00:00").slice(0, 5));
      setRetencaoDias(data.retencao_dias ?? 30);
      if (Array.isArray(data.modulos) && data.modulos.length > 0) {
        setModulosAgendamento(data.modulos as BackupModuloId[]);
      }
    }
  }

  async function salvarAgendamento(patch: Partial<{
    ativo: boolean; frequencia: string; horario: string; retencao_dias: number; modulos: BackupModuloId[];
  }>) {
    if (!user) return;
    setSalvandoAgendamento(true);
    try {
      const novo = {
        ativo: patch.ativo ?? agendamentoAtivo,
        frequencia: patch.frequencia ?? frequencia,
        horario: patch.horario ?? horario,
        retencao_dias: patch.retencao_dias ?? retencaoDias,
        modulos: patch.modulos ?? modulosAgendamento,
      };
      const { data: prox } = await (supabase.rpc("calcular_proxima_execucao_backup" as any, {
        p_frequencia: novo.frequencia,
        p_horario: novo.horario,
        p_referencia: new Date().toISOString(),
      }) as any);

      const { error } = await (supabase.from("backup_agendamentos" as any).upsert({
        usuario_id: user.id,
        ativo: novo.ativo,
        frequencia: novo.frequencia,
        horario: novo.horario,
        retencao_dias: novo.retencao_dias,
        modulos: novo.modulos,
        proximo_execucao_em: novo.ativo ? prox : null,
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
        .select("id, nome, created_at, tamanho, modulos, origem")
        .order("created_at", { ascending: false })
        .limit(30) as any);

      if (!error && data) setBackups(data);
    } catch {
      // silently fail
    } finally {
      setCarregando(false);
    }
  }

  async function coletarDados(modulos: BackupModuloId[]) {
    if (!user) return null;
    const tabelas = tabelasDosModulos(modulos);
    const dados: Record<string, any[]> = {};
    for (const tabela of tabelas) {
      try {
        const { data, error } = await (supabase.from(tabela as any).select("*") as any);
        if (!error && data) dados[tabela] = data;
      } catch {
        // ignora tabelas inacessíveis
      }
    }
    return dados;
  }

  async function realizarBackup() {
    if (!user || !profile) {
      toast.error("Perfil do usuário não carregado.");
      return;
    }
    if (modulosManual.length === 0) {
      toast.error("Selecione pelo menos um módulo para incluir no backup.");
      return;
    }

    setRealizandoBackup(true);
    try {
      const dados = await coletarDados(modulosManual);
      if (!dados) throw new Error("Falha ao coletar dados");

      const nomeBackup = gerarNomeBackup(profile.nome_completo || "");
      const jsonStr = JSON.stringify(dados);
      const tamanhoKB = (new Blob([jsonStr]).size / 1024).toFixed(1);

      const storagePath = `${user.id}/${nomeBackup}-${Date.now()}.json`;
      const { error: upErr } = await supabase.storage
        .from("backups")
        .upload(storagePath, new Blob([jsonStr], { type: "application/json" }), {
          contentType: "application/json",
          upsert: false,
        });
      if (upErr) throw upErr;

      const { error } = await (supabase.from("backups" as any).insert({
        usuario_id: user.id,
        nome: nomeBackup,
        tamanho: `${tamanhoKB} KB`,
        storage_path: storagePath,
        modulos: modulosManual,
        origem: "manual",
      }) as any);

      if (error) {
        await supabase.storage.from("backups").remove([storagePath]);
        throw error;
      }

      // Salva localmente (na pasta escolhida ou em Downloads do navegador)
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
      const destino = await backupLocation.saveFile(`${nomeBackup}.json`, blob);

      await carregarBackups();
      queryClient.invalidateQueries({ queryKey: ['ultimo-backup'] });
      const ondeMsg = destino === "folder"
        ? `salvo em "${backupLocation.getSavedFolderName()}"`
        : "baixado para sua pasta de Downloads";
      toast.success(`Backup "${nomeBackup}" gerado, na nuvem e ${ondeMsg}!`);
    } catch (err: any) {
      toast.error("Erro ao realizar backup: " + err.message);
    } finally {
      setRealizandoBackup(false);
    }
  }

  async function carregarDadosBackup(backupId: string): Promise<any | null> {
    const { data, error } = await (supabase
      .from("backups" as any)
      .select("dados, storage_path")
      .eq("id", backupId)
      .single() as any);
    if (error || !data) return null;
    if (data.storage_path) {
      const { data: dl, error: dlErr } = await supabase.storage
        .from("backups")
        .download(data.storage_path);
      if (dlErr || !dl) return null;
      return JSON.parse(await dl.text());
    }
    return data.dados ?? null;
  }

  async function downloadBackup(backupId: string, nome: string) {
    try {
      const dados = await carregarDadosBackup(backupId);
      if (!dados) {
        toast.error("Erro ao baixar backup.");
        return;
      }
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
      const destino = await backupLocation.saveFile(`${nome}.json`, blob);
      if (destino === "folder") {
        toast.success(`Backup salvo em "${backupLocation.getSavedFolderName()}"`);
      }
    } catch {
      toast.error("Erro ao baixar backup.");
    }
  }

  async function deletarBackup() {
    if (!deleteId) return;
    try {
      const { data: row } = await (supabase
        .from("backups" as any)
        .select("storage_path")
        .eq("id", deleteId)
        .single() as any);

      const { error } = await (supabase
        .from("backups" as any)
        .delete()
        .eq("id", deleteId) as any);
      if (error) throw error;

      if (row?.storage_path) {
        await supabase.storage.from("backups").remove([row.storage_path]);
      }
      toast.success("Backup excluído.");
      await carregarBackups();
    } catch {
      toast.error("Erro ao excluir backup.");
    } finally {
      setDeleteId(null);
    }
  }

  async function abrirRestauracaoHistorico(backupId: string) {
    const { data: meta } = await (supabase
      .from("backups" as any)
      .select("nome, created_at, modulos")
      .eq("id", backupId)
      .single() as any);
    if (!meta) {
      toast.error("Backup não encontrado.");
      return;
    }
    setRestaurarAlvo({
      nome: meta.nome,
      dataCriacao: format(new Date(meta.created_at), "dd/MM/yyyy HH:mm"),
      modulos: meta.modulos ?? undefined,
    });
    setRestaurarPayload({ tipo: "historico", backup_id: backupId });
    setRestaurarDialogOpen(false);
    setConfirmDialogOpen(true);
  }

  function handleRestaurarArquivo() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const dados = JSON.parse(await file.text());
        if (typeof dados !== "object" || Array.isArray(dados)) {
          throw new Error("Arquivo de backup inválido.");
        }
        const nome = file.name.replace(/\.json$/i, "");
        setRestaurarAlvo({
          nome,
          dataCriacao: undefined,
          modulos: Object.keys(dados),
        });
        setRestaurarPayload({ tipo: "upload", dados, nome });
        setRestaurarDialogOpen(false);
        setConfirmDialogOpen(true);
      } catch (err: any) {
        toast.error("Erro ao ler arquivo: " + err.message);
      }
    };
    input.click();
  }

  async function executarRestauracao(confirmacao: string) {
    if (!restaurarPayload) return;
    setRestaurando(true);
    try {
      const body: any = { confirmacao };
      if (restaurarPayload.tipo === "historico") {
        body.backup_id = restaurarPayload.backup_id;
      } else {
        body.dados = restaurarPayload.dados;
        body.nome = restaurarPayload.nome;
      }
      const { data, error } = await supabase.functions.invoke("restaurar-backup", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const totalInseridos = Object.values(data?.tabelas ?? {}).reduce(
        (acc: number, t: any) => acc + (t.inseridos ?? 0), 0
      );
      toast.success(`Restauração concluída: ${totalInseridos} registros restaurados.`);
      setConfirmDialogOpen(false);
      setRestaurarAlvo(null);
      setRestaurarPayload(null);
      // Invalida tudo — dados de várias áreas mudaram
      await queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error("Erro ao restaurar: " + (err.message || err));
    } finally {
      setRestaurando(false);
    }
  }

  function toggleModulo(list: BackupModuloId[], setList: (v: BackupModuloId[]) => void, id: BackupModuloId) {
    setList(list.includes(id) ? list.filter((m) => m !== id) : [...list, id]);
  }

  async function toggleModuloAgendamento(id: BackupModuloId) {
    const novo = modulosAgendamento.includes(id)
      ? modulosAgendamento.filter((m) => m !== id)
      : [...modulosAgendamento, id];
    if (novo.length === 0) {
      toast.error("Mantenha pelo menos um módulo selecionado.");
      return;
    }
    setModulosAgendamento(novo);
    try { await salvarAgendamento({ modulos: novo }); } catch {}
  }

  const nomeBackupAtual = profile?.nome_completo ? gerarNomeBackup(profile.nome_completo) : "CAIXAKGSS00000000";

  // Métricas derivadas dos backups reais
  const historicoChips = useMemo(
    () => backups.slice(0, 8).map((b) => ({
      id: b.id,
      label: format(new Date(b.created_at), "dd/MM/yyyy"),
    })),
    [backups],
  );

  const historicoSerie = useMemo(() => {
    const ordered = [...backups].reverse();
    return ordered.map((b) => {
      const t = parseFloat(String(b.tamanho).replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
      return { x: format(new Date(b.created_at), "dd/MM"), v: t };
    });
  }, [backups]);

  const totalKB = useMemo(
    () => backups.reduce((acc, b) => acc + (parseFloat(String(b.tamanho).replace(/[^\d.,]/g, "").replace(",", ".")) || 0), 0),
    [backups],
  );
  const espacoTotalKB = 500 * 1024; // 500 MB cota ilustrativa
  const pctEspaco = Math.min(100, Math.round((totalKB / espacoTotalKB) * 100));
  const pctSalvos = backups.length > 0 ? Math.min(100, backups.length * 10) : 0;
  const pctComprimido = 30;

  const ultimoBackup = backups[0]
    ? formatDistanceToNow(new Date(backups[0].created_at), { addSuffix: true, locale: ptBR })
    : "—";

  const donutData = (pct: number) => [
    { name: "v", value: pct },
    { name: "r", value: 100 - pct },
  ];

  return (
    <div className="min-h-screen bg-background px-4 md:px-6 pt-1 pb-4 md:pb-6 space-y-6">
      {/* ===== HEADER PREMIUM (mesmo padrão do módulo Encomendas) ===== */}
      <div
        className="relative overflow-hidden rounded-2xl border border-cda-dourado/40 shadow-[0_4px_24px_-16px_rgba(91,26,43,0.18)]"
        style={{ background: "#FAEFEB" }}
      >
        <div className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 pr-[150px] sm:pr-[200px] lg:pr-[260px] min-h-[130px] sm:min-h-[150px] lg:min-h-[170px]">
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-normal leading-tight text-[#3D0F1C] sm:text-3xl lg:text-[36px]">
              Backup
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <span className="h-px w-8 bg-[#C9A14A] sm:w-10" />
              <p className="text-xs italic text-[#C9A14A] sm:text-sm">
                Gerencie backups do seu projeto por módulo
              </p>
            </div>
          </div>
        </div>
          <img
            src={backupHeroImg}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-1/2 h-[140px] w-auto -translate-y-1/2 object-contain sm:h-[180px] lg:h-[220px]"
          />
      </div>



      <div className="bg-white border border-cda-dourado/30 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-[#5B1A2B]" />
          <span className="text-sm font-medium text-[#3D0F1C]">Sobre os backups</span>
        </div>
        <p className="text-[13px] text-[#3D0F1C]/70 leading-relaxed">
          Cada backup é salvo na nuvem do Caixa de Açúcar e baixado para o seu computador. Você pode escolher quais{" "}
          <span className="font-bold text-[#3D0F1C]">módulos</span> incluir e por quantos dias manter os backups antigos. Nome do arquivo:{" "}
          <code className="font-mono text-[12px] bg-[#FDF6EE] px-2 py-0.5 rounded">{nomeBackupAtual}</code>
        </p>
      </div>

      {/* LOCAL DE SALVAMENTO */}
      <div className="bg-white border border-cda-dourado/30 rounded-xl p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            {pastaSalvamento ? (
              <FolderCheck className="h-[18px] w-[18px] text-[#C9A14A] mt-0.5 shrink-0" />
            ) : (
              <FolderOpen className="h-[18px] w-[18px] text-[#C9A14A] mt-0.5 shrink-0" />
            )}
            <div className="min-w-0">
              <h3 className="text-[15px] font-bold text-[#3D0F1C]">Local de salvamento</h3>
              <p className="text-xs text-[#3D0F1C]/60 mt-0.5">
                {pastaSalvamento ? (
                  <>Os arquivos de backup serão salvos em{" "}
                    <code className="font-mono text-[12px] bg-[#FDF6EE] px-2 py-0.5 rounded text-[#3D0F1C]">
                      {pastaSalvamento}
                    </code>
                  </>
                ) : fsApiSupported ? (
                  <>Nenhuma pasta personalizada. Por padrão, os arquivos vão para a pasta <strong>Downloads</strong> do seu navegador.</>
                ) : (
                  <>Seu navegador não permite escolher pasta. Os arquivos vão para a pasta <strong>Downloads</strong> do navegador. Use Chrome, Edge ou Brave para escolher um local.</>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pastaSalvamento && (
              <button
                type="button"
                onClick={limparPasta}
                className="text-xs text-[#5B1A2B] hover:underline underline-offset-2 px-2 py-1"
              >
                Usar padrão
              </button>
            )}
            <button
              type="button"
              onClick={escolherPasta}
              disabled={!fsApiSupported || escolhendoPasta}
              className="inline-flex items-center gap-2 bg-[#5B1A2B] hover:bg-[#3D0F1C] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg px-3 py-2 transition-colors"
            >
              {escolhendoPasta ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Abrindo...</>
              ) : (
                <><FolderOpen className="h-3.5 w-3.5" /> {pastaSalvamento ? "Alterar pasta" : "Escolher pasta"}</>
              )}
            </button>
          </div>
        </div>
      </div>


      {/* BACKUP MANUAL */}
      <div className="bg-white border border-cda-dourado/30 rounded-xl p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            <Download className="h-[18px] w-[18px] text-[#C9A14A] mt-0.5" />
            <div>
              <h3 className="text-[15px] font-bold text-[#3D0F1C]">Backup manual</h3>
              <p className="text-xs text-[#3D0F1C]/60">Selecione os módulos e gere um backup agora</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <button
              type="button"
              onClick={() => setModulosManual(modulosVisiveis.map((m) => m.id))}
              className="text-[#5B1A2B] hover:underline underline-offset-2"
            >
              Marcar todos
            </button>
            <span className="text-[#5B1A2B]/40">|</span>
            <button
              type="button"
              onClick={() => setModulosManual([])}
              className="text-[#5B1A2B] hover:underline underline-offset-2"
            >
              Limpar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {modulosVisiveis.map((mod) => {
            const checked = modulosManual.includes(mod.id);
            const Icon = MODULO_ICONS[mod.id] ?? Package;
            return (
              <label
                key={mod.id}
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  checked
                    ? "border-[#5B1A2B] bg-[#FDF6EE]"
                    : "border-[#5B1A2B]/12 bg-white opacity-90 hover:opacity-100"
                }`}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleModulo(modulosManual, setModulosManual, mod.id)}
                  className="border-[#5B1A2B]/40 data-[state=checked]:bg-[#5B1A2B] data-[state=checked]:border-[#5B1A2B]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[#3D0F1C]">{mod.titulo}</span>
                    <span className="bg-[#5B1A2B]/10 text-[#5B1A2B] text-[10px] px-2 py-0.5 rounded-full font-medium">
                      {mod.tabelas.length} tabelas
                    </span>
                  </div>
                  <p className="text-[11px] text-[#3D0F1C]/60 mt-0.5 line-clamp-2">{mod.descricao}</p>
                </div>
                <div className="w-11 h-11 rounded-full bg-[#FDF6EE] border border-[#5B1A2B]/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-[#5B1A2B]" />
                </div>
              </label>
            );
          })}
        </div>

        <button
          type="button"
          onClick={realizarBackup}
          disabled={realizandoBackup || profileLoading || modulosManual.length === 0}
          className="w-full bg-[#3D0F1C] hover:bg-[#5B1A2B] text-white rounded-xl py-4 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {realizandoBackup ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Gerando backup...</>
          ) : (
            <>Realizar backup agora ({modulosManual.length} módulos) <Play className="h-4 w-4" /></>
          )}
        </button>
      </div>

      {/* PAINEIS INFERIORES — Histórico recentes / KPIs / Espaço */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Histórico Recentes */}
        <div className="bg-white border border-cda-dourado/30 rounded-xl p-5">
          <h3 className="text-[15px] text-[#3D0F1C] mb-3" style={{ fontFamily: PLAYFAIR }}>
            Histórico de Backups Recentes
          </h3>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {historicoChips.length === 0 ? (
              <span className="text-xs text-[#3D0F1C]/50">Sem backups ainda</span>
            ) : (
              historicoChips.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => downloadBackup(c.id, backups.find((b) => b.id === c.id)?.nome || c.label)}
                  className={`rounded-full px-3 py-1 text-xs transition-colors border ${
                    backupSelecionado === c.id
                      ? "bg-[#5B1A2B] text-white border-[#5B1A2B]"
                      : "bg-[#FDF6EE] border-[#5B1A2B]/15 text-[#3D0F1C] hover:border-[#5B1A2B]/40"
                  }`}
                >
                  {c.label}
                </button>
              ))
            )}
          </div>
          <div className="h-[80px]">
            {historicoSerie.length > 1 && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicoSerie} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grBkp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C9A14A" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#C9A14A" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid rgba(91,26,43,0.2)", borderRadius: 8, fontSize: 11 }}
                    formatter={(v: number) => `${v.toFixed(1)} KB`}
                  />
                  <Area type="monotone" dataKey="v" stroke="#C9A14A" strokeWidth={2} fill="url(#grBkp)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="bg-white border border-cda-dourado/30 rounded-xl p-5">
          <div className="grid grid-cols-3 gap-2">
            {[
              { pct: pctSalvos, label: "Dados salvos" },
              { pct: pctEspaco, label: "Espaço usado" },
              { pct: pctComprimido, label: "Comprimido" },
            ].map((m, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="relative h-[80px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData(m.pct)}
                        innerRadius={28}
                        outerRadius={38}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell fill="#C9A14A" />
                        <Cell fill="#FDF6EE" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-[#3D0F1C]">
                    {m.pct}%
                  </div>
                </div>
                <span className="text-[11px] text-[#3D0F1C]/60 mt-1 text-center leading-tight">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Espaço */}
        <div className="bg-white border border-cda-dourado/30 rounded-xl p-5">
          <h3 className="text-[15px] text-[#3D0F1C] mb-3" style={{ fontFamily: PLAYFAIR }}>
            Espaço
          </h3>
          <div className="flex items-center justify-between text-[11px] text-[#3D0F1C]/60 mb-1">
            <span>Usado / Total</span>
            <span>{(totalKB / 1024).toFixed(1)} / 500 MB</span>
          </div>
          <div className="h-2.5 rounded-full bg-[#FDF6EE] overflow-hidden">
            <div
              className="h-full bg-[#C9A14A] rounded-full transition-all"
              style={{ width: `${pctEspaco}%` }}
            />
          </div>
          <div className="mt-4 space-y-1.5 text-[12px] text-[#3D0F1C]/80">
            <div className="flex justify-between">
              <span className="text-[#3D0F1C]/60">Backups</span>
              <span className="font-medium text-[#3D0F1C]">{backups.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#3D0F1C]/60">Tamanho total</span>
              <span className="font-medium text-[#3D0F1C]">{(totalKB / 1024).toFixed(2)} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#3D0F1C]/60">Último backup</span>
              <span className="font-medium text-[#3D0F1C]">{ultimoBackup}</span>
            </div>
          </div>
        </div>
      </div>


      {/* Agendamento + Retenção + Restaurar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Agendamento */}
        <Card className="border-l-4 border-l-blue-500 border-cda-dourado/40">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Agendamento automático</CardTitle>
                <CardDescription className="text-xs">Frequência, horário, retenção e módulos</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Frequência</Label>
                <Select
                  value={frequencia}
                  onValueChange={async (v) => { setFrequencia(v); try { await salvarAgendamento({ frequencia: v }); } catch {} }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diario">Diário</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="quinzenal">Quinzenal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="horario" className="text-xs text-muted-foreground">Horário</Label>
                <Input
                  id="horario"
                  type="time"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  onBlur={async () => { try { await salvarAgendamento({ horario }); } catch {} }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Manter backups por (retenção)
              </Label>
              <Select
                value={String(retencaoDias)}
                onValueChange={async (v) => {
                  const n = parseInt(v, 10);
                  setRetencaoDias(n);
                  try { await salvarAgendamento({ retencao_dias: n }); } catch {}
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RETENCAO_OPCOES.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d >= 365 ? `${d / 365} ano` : `${d} dias`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Backups mais antigos que esse período são removidos automaticamente após cada execução agendada.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs text-muted-foreground">Módulos incluídos automaticamente</Label>
              <div className="flex flex-wrap gap-1.5">
                {modulosVisiveis.map((m) => {
                  const ativo = modulosAgendamento.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleModuloAgendamento(m.id)}
                      disabled={salvandoAgendamento}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                        ativo ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"
                      }`}
                    >
                      {m.titulo}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <Label htmlFor="agendamento" className="text-sm">Ativar agendamento</Label>
              <Switch
                id="agendamento"
                disabled={salvandoAgendamento}
                checked={agendamentoAtivo}
                onCheckedChange={async (checked) => {
                  setAgendamentoAtivo(checked);
                  try {
                    await salvarAgendamento({ ativo: checked });
                    toast.success(checked ? "Agendamento ativado!" : "Agendamento desativado.");

                    if (checked && user) {
                      const { count } = await (supabase
                        .from("backups" as any)
                        .select("id", { count: "exact", head: true })
                        .eq("usuario_id", user.id) as any);
                      const eraOnboarding = (count ?? 0) === 0;
                      if (eraOnboarding) {
                        toast.info("Gerando seu primeiro backup...");
                        await realizarBackup();
                      }
                      await queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
                      await queryClient.refetchQueries({ queryKey: ["onboarding-status"], type: "active" });
                      if (eraOnboarding) {
                        toast.success("Configuração concluída! Bem-vindo(a) ao Caixa de Açúcar 🎉");
                        setTimeout(() => navigate("/onboarding/concluido", { replace: true }), 50);
                      }
                    }
                  } catch {
                    setAgendamentoAtivo(!checked);
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Restaurar */}
        <Card className="border-l-4 border-l-amber-500 border-cda-dourado/40">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Restaurar</CardTitle>
                <CardDescription className="text-xs">A partir da nuvem ou de um arquivo local</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              onClick={() => setRestaurarDialogOpen(true)}
              disabled={restaurando}
              className="w-full"
            >
              {restaurando ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...</>
              ) : (
                <><RotateCcw className="h-4 w-4 mr-2" /> Abrir restauração</>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              A restauração é definitiva e exige dupla confirmação para evitar perda acidental de dados.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Histórico */}
      <Card className="border-cda-dourado/40">
        <CardHeader>
          <CardTitle className="text-lg">Histórico de backups</CardTitle>
          <CardDescription>Salvos na nuvem do Caixa de Açúcar</CardDescription>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : backups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum backup realizado ainda.</p>
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{b.nome}</p>
                        {b.origem === "agendado" && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">auto</Badge>
                        )}
                        {Array.isArray(b.modulos) && b.modulos.length > 0 && b.modulos.length < BACKUP_MODULOS.length && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                            {b.modulos.length} módulos
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(b.created_at), "dd/MM/yyyy HH:mm")} • {b.tamanho}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => downloadBackup(b.id, b.nome)}>
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
              Escolha um backup salvo na nuvem ou importe um arquivo .json
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Database className="h-4 w-4" /> Backups salvos
              </Label>
              {backups.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">Nenhum backup encontrado na nuvem.</p>
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
                onClick={() => backupSelecionado && abrirRestauracaoHistorico(backupSelecionado)}
                disabled={!backupSelecionado || restaurando}
                className="w-full"
                size="sm"
              >
                <RotateCcw className="h-4 w-4 mr-2" /> Restaurar selecionado
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
                <Upload className="h-4 w-4 mr-2" /> Selecionar arquivo .json
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

      <RestaurarBackupDialog
        open={confirmDialogOpen}
        onOpenChange={(v) => {
          if (!restaurando) {
            setConfirmDialogOpen(v);
            if (!v) {
              setRestaurarAlvo(null);
              setRestaurarPayload(null);
            }
          }
        }}
        alvo={restaurarAlvo}
        onConfirm={executarRestauracao}
        restaurando={restaurando}
      />

      <button
        type="button"
        onClick={() => navigate("/cadastros")}
        aria-label="Voltar"
        className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-[#5B1A2B] hover:bg-[#3D0F1C] text-white shadow-lg flex items-center justify-center transition"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    </div>
  );
}
