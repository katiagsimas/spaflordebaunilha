import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Copy, AlertTriangle, Loader2, CookingPot, FileDown } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCalculosReceita } from "@/hooks/useCalculosReceita";
import { exportarReceitaPDF } from "@/utils/exportarReceitaPDF";


export default function Receitas() {
  const navigate = useNavigate();
  const { resumos, isLoading } = useCalculosReceita();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [receitaParaDeletar, setReceitaParaDeletar] = useState<string | null>(null);
  const [filtroAtivo, setFiltroAtivo] = useState<"todos" | "ativos" | "fora">("todos");

  const resumosFiltrados = resumos.filter((resumo) => {
    if (filtroAtivo === "todos") return true;
    if (filtroAtivo === "ativos") return resumo.cardapio === "ativo";
    if (filtroAtivo === "fora") return resumo.cardapio === "fora";
    return true;
  });

  const resumosOrdenados = [...resumosFiltrados].sort((a, b) => 
    a.nome.localeCompare(b.nome, 'pt-BR')
  );

  const handleDeletar = async () => {
    if (!receitaParaDeletar) return;

    try {
      await Promise.all([
        supabase.from("receitas_ingredientes").delete().eq("receita_id", receitaParaDeletar),
        supabase.from("receitas_embalagens").delete().eq("receita_id", receitaParaDeletar),
        supabase.from("receitas_despesas_venda").delete().eq("receita_id", receitaParaDeletar),
        supabase.from("receitas_imagens").delete().eq("receita_id", receitaParaDeletar),
        supabase.from("receitas_mao_obra").delete().eq("receita_id", receitaParaDeletar),
      ]);

      const { error } = await supabase.from("receitas").delete().eq("id", receitaParaDeletar);
      if (error) throw error;

      toast.success("Receita deletada com sucesso!");
      setDialogAberto(false);
      setReceitaParaDeletar(null);
      window.location.reload();
    } catch (error) {
      console.error("Erro ao deletar receita:", error);
      toast.error("Erro ao deletar receita");
    }
  };

  const handleDuplicar = async (receitaId: string) => {
    try {
      const { data: receitaOriginal, error } = await supabase.from("receitas").select("*").eq("id", receitaId).single();
      if (error) throw error;

      const [ingredientesRes, embalagensRes, despesasRes, imagensRes] = await Promise.all([
        supabase.from("receitas_ingredientes").select("*").eq("receita_id", receitaId),
        supabase.from("receitas_embalagens").select("*").eq("receita_id", receitaId),
        supabase.from("receitas_despesas_venda").select("*").eq("receita_id", receitaId),
        supabase.from("receitas_imagens").select("*").eq("receita_id", receitaId),
      ]);

      const { data: novaReceita, error: errorNova } = await supabase.from("receitas").insert({ ...receitaOriginal, id: undefined, nome: `${receitaOriginal.nome} (Cópia)`, created_at: undefined, updated_at: undefined }).select().single();
      if (errorNova) throw errorNova;

      if (ingredientesRes.data?.length) await supabase.from("receitas_ingredientes").insert(ingredientesRes.data.map((i: any) => ({ ...i, id: undefined, receita_id: novaReceita.id, created_at: undefined })));
      if (embalagensRes.data?.length) await supabase.from("receitas_embalagens").insert(embalagensRes.data.map((e: any) => ({ ...e, id: undefined, receita_id: novaReceita.id, created_at: undefined })));
      if (despesasRes.data?.length) await supabase.from("receitas_despesas_venda").insert(despesasRes.data.map((d: any) => ({ ...d, id: undefined, receita_id: novaReceita.id, created_at: undefined })));
      if (imagensRes.data?.length) await supabase.from("receitas_imagens").insert(imagensRes.data.map((img: any) => ({ ...img, id: undefined, receita_id: novaReceita.id, created_at: undefined })));

      toast.success("Receita duplicada!");
      navigate(`/precificacao/ficha-tecnica/editar/${novaReceita.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao duplicar receita");
    }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Fichas Técnicas" description="Gerencie suas receitas e fichas técnicas" backButton={<BackButton to="/precificacao" />} />
      
      <div className="p-4 md:p-6 space-y-6">
        
        
        <div className="flex flex-wrap gap-2">
          <Button variant={filtroAtivo === "todos" ? "default" : "outline"} size="sm" onClick={() => setFiltroAtivo("todos")}>Todos ({resumos.length})</Button>
          <Button variant={filtroAtivo === "ativos" ? "default" : "outline"} size="sm" onClick={() => setFiltroAtivo("ativos")}>Ativos ({resumos.filter(r => r.cardapio === "ativo").length})</Button>
          <Button variant={filtroAtivo === "fora" ? "default" : "outline"} size="sm" onClick={() => setFiltroAtivo("fora")}>Fora do Cardápio ({resumos.filter(r => r.cardapio === "fora").length})</Button>
        </div>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Minhas Fichas Técnicas</h2>
          <Button onClick={() => navigate("/precificacao/ficha-tecnica/nova")}><Plus className="mr-2 h-4 w-4" />Nova Ficha Técnica</Button>
        </div>
        {resumosOrdenados.length === 0 ? (
          <EmptyState icon={CookingPot} title="Nenhuma ficha técnica cadastrada" description="Crie sua primeira ficha técnica" actionLabel="Nova Ficha Técnica" onAction={() => navigate("/precificacao/ficha-tecnica/nova")} />
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Cardápio</TableHead>
                  <TableHead className="text-right">Valor Venda</TableHead>
                  <TableHead className="text-right">Custos Produção</TableHead>
                  <TableHead className="text-right">% CMV Real</TableHead>
                  <TableHead className="text-right">Margem R$</TableHead>
                  <TableHead className="text-right">Margem %</TableHead>
                  <TableHead className="text-right">Custos c/ Vendas</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                  <TableHead>Alertas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumosOrdenados.map((r) => (
                  <TableRow key={r.receitaId}>
                    <TableCell className="font-medium">{r.nome}</TableCell>
                    <TableCell>{r.categoria || "-"}</TableCell>
                    <TableCell><Badge variant={r.cardapio === "ativo" ? "default" : "secondary"}>{r.cardapio === "ativo" ? "Ativo" : "Fora"}</Badge></TableCell>
                    <TableCell className="text-right">R$ {r.valorVenda.toFixed(2)}</TableCell>
                    <TableCell className="text-right">R$ {r.custosProducao.toFixed(2)}</TableCell>
                    <TableCell className={cn("text-right font-medium", r.cmvRealPercent <= 35 && "text-green-600", r.cmvRealPercent > 35 && r.cmvRealPercent <= 45 && "text-blue-600", r.cmvRealPercent > 45 && r.cmvRealPercent <= 55 && "text-yellow-600", r.cmvRealPercent > 55 && "text-red-600")}>{r.cmvRealPercent.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">R$ {r.margemReais.toFixed(2)}</TableCell>
                    <TableCell className={cn("text-right font-medium", r.margemPercent >= 30 && "text-green-600", r.margemPercent < 30 && "text-red-600")}>{r.margemPercent.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">R$ {r.despesasVenda.toFixed(2)}</TableCell>
                    <TableCell className={cn("text-right font-medium", r.lucro >= 0 ? "text-green-600" : "text-red-600")}>R$ {r.lucro.toFixed(2)}</TableCell>
                    <TableCell>
                      {r.alertas.includes("Prejuízo") ? (
                        <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />{r.alertas}</Badge>
                      ) : r.alertas.includes("CMV Muito Alto") || r.alertas.includes("Margem Baixa") || r.alertas.includes("CMV em Atenção") ? (
                        <Badge className="gap-1 bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/30">{r.alertas}</Badge>
                      ) : r.alertas.includes("CMV Excelente") || r.alertas.includes("CMV Aceitável") ? (
                        <Badge className="gap-1 bg-green-500/10 text-green-700 border-green-500/20 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30">{r.alertas}</Badge>
                      ) : (
                        <Badge variant="outline">{r.alertas}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Editar" onClick={() => navigate(`/precificacao/ficha-tecnica/editar/${r.receitaId}`)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Duplicar" onClick={() => handleDuplicar(r.receitaId)}><Copy className="h-4 w-4" /></Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Exportar PDF"
                          onClick={async () => {
                            try {
                              await exportarReceitaPDF(r.receitaId);
                              toast.success("PDF gerado com sucesso!");
                            } catch (e: any) {
                              toast.error(`Erro ao gerar PDF: ${e?.message || e}`);
                            }
                          }}
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Excluir" onClick={() => { setReceitaParaDeletar(r.receitaId); setDialogAberto(true); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <ConfirmDialog open={dialogAberto} onOpenChange={setDialogAberto} onConfirm={handleDeletar} title="Deletar Receita" description="Tem certeza que deseja deletar esta receita?" />
    </div>
  );
}
