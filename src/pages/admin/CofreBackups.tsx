import { useEffect, useState } from "react";
import { Archive, Download, RotateCcw, Loader2, Search, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/PageHeader";
import { PermissionGuard } from "@/components/PermissionGuard";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useGroup } from "@/contexts/GroupContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { RestaurarBackupDialog, type RestaurarBackupAlvo } from "@/components/backup/RestaurarBackupDialog";
import { useQueryClient } from "@tanstack/react-query";

interface CofreItem {
  id: string;
  owner_group_id: string | null;
  usuario_id_origem: string;
  nome: string;
  modulos: string[] | null;
  storage_path: string;
  tamanho: string | null;
  origem: string;
  eh_mensal: boolean;
  criado_em: string;
  group_name?: string;
  usuario_email?: string;
}

export default function CofreBackups() {
  const { isMother } = useGroup();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<CofreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [restaurando, setRestaurando] = useState(false);
  const [restaurarAlvo, setRestaurarAlvo] = useState<RestaurarBackupAlvo | null>(null);
  const [restaurarCofreId, setRestaurarCofreId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (isMother) carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMother]);

  async function carregar() {
    setLoading(true);
    try {
      const { data, error } = await (supabase
        .from("backups_cofre" as any)
        .select("id, owner_group_id, usuario_id_origem, nome, modulos, storage_path, tamanho, origem, eh_mensal, criado_em")
        .order("criado_em", { ascending: false }) as any);
      if (error) throw error;

      const lista = (data ?? []) as CofreItem[];

      // Enriquecer com nome do grupo e e-mail do usuário
      const groupIds = [...new Set(lista.map((i) => i.owner_group_id).filter(Boolean))] as string[];
      const userIds = [...new Set(lista.map((i) => i.usuario_id_origem))];

      const [{ data: groups }, { data: profs }] = await Promise.all([
        supabase.from("groups").select("id, name").in("id", groupIds.length ? groupIds : ["00000000-0000-0000-0000-000000000000"]),
        supabase.from("profiles").select("id, email").in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
      ]);
      const mapGroup = new Map((groups ?? []).map((g: any) => [g.id, g.name]));
      const mapEmail = new Map((profs ?? []).map((p: any) => [p.id, p.email]));

      setItems(lista.map((i) => ({
        ...i,
        group_name: i.owner_group_id ? mapGroup.get(i.owner_group_id) : "—",
        usuario_email: mapEmail.get(i.usuario_id_origem) ?? "—",
      })));
    } catch (err: any) {
      toast.error("Erro ao carregar cofre: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function baixar(item: CofreItem) {
    try {
      const { data, error } = await supabase.storage.from("backups-cofre").download(item.storage_path);
      if (error || !data) throw error ?? new Error("Arquivo não encontrado");
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url; a.download = `${item.nome}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error("Erro ao baixar: " + err.message);
    }
  }

  function abrirRestauracao(item: CofreItem) {
    setRestaurarAlvo({
      nome: item.nome,
      dataCriacao: format(new Date(item.criado_em), "dd/MM/yyyy HH:mm"),
      modulos: item.modulos ?? undefined,
    });
    setRestaurarCofreId(item.id);
    setDialogOpen(true);
  }

  async function executarRestauracao(confirmacao: string) {
    if (!restaurarCofreId) return;
    setRestaurando(true);
    try {
      const { data, error } = await supabase.functions.invoke("restaurar-backup", {
        body: { cofre_id: restaurarCofreId, confirmacao },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Restauração concluída para o grupo ${restaurarAlvo?.nome}.`);
      setDialogOpen(false);
      setRestaurarAlvo(null);
      setRestaurarCofreId(null);
      await queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error("Erro ao restaurar: " + (err.message || err));
    } finally {
      setRestaurando(false);
    }
  }

  async function excluir() {
    if (!deleteId) return;
    try {
      const item = items.find((i) => i.id === deleteId);
      if (item?.storage_path) {
        await supabase.storage.from("backups-cofre").remove([item.storage_path]);
      }
      const { error } = await (supabase.from("backups_cofre" as any).delete().eq("id", deleteId) as any);
      if (error) throw error;
      toast.success("Backup do cofre excluído.");
      await carregar();
    } catch (err: any) {
      toast.error("Erro ao excluir: " + err.message);
    } finally {
      setDeleteId(null);
    }
  }

  if (!isMother) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <PageHeader title="Cofre de Backups" description="Acesso restrito" />
        <div className="flex-1 p-6"><PermissionGuard requireMother /></div>
      </div>
    );
  }

  const filtrados = items.filter((i) => {
    if (!busca.trim()) return true;
    const q = busca.toLowerCase();
    return (
      i.nome.toLowerCase().includes(q) ||
      (i.group_name ?? "").toLowerCase().includes(q) ||
      (i.usuario_email ?? "").toLowerCase().includes(q)
    );
  });

  const mensaisTotal = items.filter((i) => i.eh_mensal).length;

  return (
    <div className="container mx-auto px-6 pt-1 pb-6 space-y-6">
      <PageHeader
        title="Cofre de Backups"
        description="Espelho automático de backups para suporte. Retenção: dia 1 de cada mês + 5 mais recentes por grupo."
        backButton={<BackButton to="/governanca" />}
      />

      <Card className="bg-sfb-dourado/10 border-sfb-dourado/30">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-sfb-preto/70">Total no cofre</div>
              <div className="text-2xl font-bold text-sfb-vinho">{items.length}</div>
            </div>
            <div>
              <div className="text-sfb-preto/70">Snapshots mensais</div>
              <div className="text-2xl font-bold text-sfb-vinho">{mensaisTotal}</div>
            </div>
            <div>
              <div className="text-sfb-preto/70">Recentes (rolling)</div>
              <div className="text-2xl font-bold text-sfb-vinho">{items.length - mensaisTotal}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-lg">Backups disponíveis</CardTitle>
              <CardDescription>Inclui todos os grupos. Restaurações são logadas em admin_logs.</CardDescription>
            </div>
            <div className="relative w-72 max-w-full">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, grupo ou e-mail"
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtrados.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum backup no cofre.</p>
          ) : (
            <div className="space-y-2">
              {filtrados.map((i) => (
                <div key={i.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Archive className="h-4 w-4 text-sfb-vinho shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{i.nome}</p>
                        {i.eh_mensal && <Badge className="text-[10px] h-4 px-1.5 bg-sfb-dourado text-sfb-preto hover:bg-sfb-dourado">mensal</Badge>}
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{i.origem}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {format(new Date(i.criado_em), "dd/MM/yyyy HH:mm")} • {i.tamanho ?? "—"} • {i.group_name} • {i.usuario_email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => baixar(i)} title="Baixar JSON">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => abrirRestauracao(i)} title="Restaurar para grupo">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(i.id)}
                      title="Excluir do cofre"
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

      <RestaurarBackupDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          if (!restaurando) {
            setDialogOpen(v);
            if (!v) { setRestaurarAlvo(null); setRestaurarCofreId(null); }
          }
        }}
        alvo={restaurarAlvo}
        onConfirm={executarRestauracao}
        restaurando={restaurando}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir do cofre"
        description="Esta cópia será removida permanentemente do cofre. O backup original do usuário não é afetado."
        onConfirm={excluir}
        confirmLabel="Excluir"
      />
    </div>
  );
}
