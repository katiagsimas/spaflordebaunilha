import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/PageHeader";
import {
  useFechamentoMes, useAbrirOuCriarFechamento, useFecharMes, useReabrirMes,
  useToggleChecklistItem, useListaFechamentos, useFechamentoLogs, mesAnteriorIso, listaMesesRecentes,
} from "@/hooks/useFechamentoMes";
import { formatBRL } from "@/hooks/useMeuSalario";
import { Lock, Unlock, CheckCircle2, AlertCircle, History, Clock } from "lucide-react";

export default function FechamentoMes() {
  const meses = listaMesesRecentes(12);
  const [refIso, setRefIso] = useState(mesAnteriorIso());
  const [observacoes, setObservacoes] = useState("");

  const { fechamento, previa, checklist, isLoading } = useFechamentoMes(refIso);
  const { data: historico } = useListaFechamentos();
  const abrir = useAbrirOuCriarFechamento();
  const fechar = useFecharMes();
  const reabrir = useReabrirMes();
  const toggle = useToggleChecklistItem();

  const itensConcluidos = checklist.filter(c => c.concluido).length;
  const totalItens = checklist.length;
  const podeFechar = totalItens > 0 && itensConcluidos === totalItens;
  const isFechado = fechamento?.status === "fechado";

  const valores = isFechado
    ? {
        faturamento: Number(fechamento.faturamento),
        custos: Number(fechamento.custos),
        margem_seguranca: Number(fechamento.margem_seguranca),
        pro_labore_saudavel: Number(fechamento.pro_labore_saudavel),
        retiradas: Number(fechamento.retiradas),
        saldo_restante: Number(fechamento.saldo_restante),
      }
    : previa;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fechamento de Mês"
        description="Consolide o resultado, marque o checklist e bloqueie alterações do período."
      />

      {/* Seletor de mês */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Select value={refIso} onValueChange={setRefIso}>
                <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {meses.map(m => (
                    <SelectItem key={m.iso} value={m.iso} className="capitalize">{m.rotulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isFechado ? (
                <Badge className="bg-cda-dourado text-cda-preto"><Lock className="h-3 w-3 mr-1" /> Fechado</Badge>
              ) : (
                <Badge variant="outline"><Unlock className="h-3 w-3 mr-1" /> Aberto</Badge>
              )}
            </div>

            {!fechamento && (
              <Button onClick={() => abrir.mutate(refIso)} disabled={abrir.isPending}>
                Iniciar fechamento
              </Button>
            )}
            {fechamento && !isFechado && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={!podeFechar || fechar.isPending} className="bg-cda-dourado text-cda-preto hover:bg-cda-dourado/90">
                    <Lock className="h-4 w-4 mr-2" /> Fechar mês
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Fechar mês?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Após fechar, qualquer lançamento (criar, editar, excluir) com data dentro deste mês será bloqueado.
                      Os valores serão congelados no snapshot. Você pode reabrir depois se precisar.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Textarea
                    placeholder="Observações sobre o fechamento (opcional)"
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => fechar.mutate({ id: fechamento.id, observacoes })}>
                      Confirmar fechamento
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {fechamento && isFechado && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline"><Unlock className="h-4 w-4 mr-2" /> Reabrir mês</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reabrir este mês?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Lançamentos voltarão a poder ser criados e editados dentro do período.
                      O snapshot anterior será mantido até você fechar novamente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => reabrir.mutate(fechamento.id)}>Reabrir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Snapshot / Prévia */}
      {valores && (
        <Card>
          <CardHeader>
            <CardTitle>{isFechado ? "Snapshot consolidado" : "Prévia do mês"}</CardTitle>
            <CardDescription>
              {isFechado
                ? "Valores congelados no momento do fechamento."
                : "Valores calculados em tempo real a partir dos lançamentos baixados."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Item label="Faturamento" valor={valores.faturamento} positivo />
            <Item label="Custos" valor={valores.custos} negativo />
            <Item label="Margem de segurança (20%)" valor={valores.margem_seguranca} />
            <Item label="Pró-labore saudável" valor={valores.pro_labore_saudavel} destaque />
            <Item label="Retiradas registradas" valor={valores.retiradas} />
            <Item label="Saldo restante" valor={valores.saldo_restante} destaque />
          </CardContent>
        </Card>
      )}

      {/* Checklist */}
      {fechamento && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Checklist de fechamento</CardTitle>
                <CardDescription>
                  {itensConcluidos} de {totalItens} concluídos
                  {!isFechado && !podeFechar && totalItens > 0 && (
                    <span className="text-cda-coral ml-2">— complete todos para fechar</span>
                  )}
                </CardDescription>
              </div>
              {podeFechar && !isFechado && <CheckCircle2 className="h-6 w-6 text-cda-pistache" />}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {checklist.map(item => (
              <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <Checkbox
                  checked={item.concluido}
                  disabled={isFechado}
                  onCheckedChange={(c) => toggle.mutate({ id: item.id, concluido: !!c })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className={`font-medium ${item.concluido ? "line-through text-muted-foreground" : ""}`}>
                    {item.titulo}
                  </p>
                  {item.descricao && (
                    <p className="text-sm text-muted-foreground mt-0.5">{item.descricao}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Observações no snapshot */}
      {isFechado && fechamento?.observacoes && (
        <Card>
          <CardHeader><CardTitle className="text-base">Observações do fechamento</CardTitle></CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">{fechamento.observacoes}</CardContent>
        </Card>
      )}

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History className="h-4 w-4" /> Histórico de fechamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {!historico || historico.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum fechamento ainda.</p>
          ) : (
            <div className="space-y-2">
              {historico.map(f => (
                <button
                  key={f.id}
                  onClick={() => setRefIso(f.mes_referencia)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-accent/30 text-left"
                >
                  <div className="flex items-center gap-3">
                    {f.status === "fechado"
                      ? <Lock className="h-4 w-4 text-cda-dourado" />
                      : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                    <div>
                      <p className="font-medium">{f.mes_referencia.slice(0, 7)}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.status === "fechado" ? "Fechado" : "Em andamento"}
                        {f.fechado_em && ` em ${new Date(f.fechado_em).toLocaleDateString("pt-BR")}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold">{formatBRL(Number(f.faturamento))}</p>
                    <p className="text-xs text-muted-foreground">faturamento</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Item({ label, valor, positivo, negativo, destaque }: { label: string; valor: number; positivo?: boolean; negativo?: boolean; destaque?: boolean }) {
  const cor = destaque ? "text-cda-dourado" : positivo ? "text-cda-pistache" : negativo ? "text-cda-coral" : "text-foreground";
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-xl font-semibold ${cor}`}>{formatBRL(valor)}</p>
    </div>
  );
}
