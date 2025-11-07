import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserId } from "@/hooks/useUserId";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Check, X, Split, Link as LinkIcon, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BankEntry {
  id: string;
  date: string;
  amount: number;
  kind: string;
  description: string;
  status: string;
  suggested_match?: {
    transaction_id: string;
    transaction_type: string;
    score: number;
    party: string;
    amount: number;
    date: string;
  };
}

export default function ReconcilePage() {
  const { importId } = useParams();
  const userId = useUserId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: entries, isLoading } = useQuery({
    queryKey: ["bank-entries", importId, statusFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("bank_entries")
        .select(`
          *,
          bank_matches (
            id,
            transaction_id,
            transaction_type,
            score,
            status
          )
        `)
        .eq("import_id", importId);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (searchTerm) {
        query = query.ilike("description", `%${searchTerm}%`);
      }

      const { data, error } = await query.order("date", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!importId
  });

  const confirmMutation = useMutation({
    mutationFn: async ({ entryId, txType, txId }: { entryId: string; txType: string; txId: string }) => {
      const { error } = await supabase.rpc("fn_confirm_match", {
        p_bank_entry_id: entryId,
        p_transaction_type: txType,
        p_transaction_id: txId,
        p_confirmed_by: userId
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-entries"] });
      toast({ title: "Match confirmado com sucesso" });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase.rpc("fn_reject_match", {
        p_bank_entry_id: entryId
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-entries"] });
      toast({ title: "Sugestão rejeitada" });
    }
  });

  const reconcileMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("fn_reconcile_import", {
        p_import_id: importId,
        p_reconciled_by: userId
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Conciliação finalizada com sucesso" });
      navigate("/banco/relatorios");
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      imported: { variant: "secondary", label: "Importado" },
      suggested_match: { variant: "default", label: "Sugestão" },
      matched: { variant: "default", label: "Vinculado" },
      reconciled: { variant: "default", label: "Conciliado" }
    };
    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const stats = {
    total: entries?.length || 0,
    imported: entries?.filter(e => e.status === "imported").length || 0,
    suggested: entries?.filter(e => e.status === "suggested_match").length || 0,
    matched: entries?.filter(e => e.status === "matched").length || 0,
    reconciled: entries?.filter(e => e.status === "reconciled").length || 0
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Reconciliação Bancária"
        description={`Importação: ${importId?.slice(0, 8)}...`}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{stats.imported}</div>
            <div className="text-sm text-muted-foreground">Importados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{stats.suggested}</div>
            <div className="text-sm text-muted-foreground">Sugestões</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{stats.matched}</div>
            <div className="text-sm text-muted-foreground">Vinculados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{stats.reconciled}</div>
            <div className="text-sm text-muted-foreground">Conciliados</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Buscar por descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="imported">Importado</SelectItem>
                <SelectItem value="suggested_match">Com sugestão</SelectItem>
                <SelectItem value="matched">Vinculado</SelectItem>
                <SelectItem value="reconciled">Conciliado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sugestão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries?.map((entry) => {
                    const match = entry.bank_matches?.[0];
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {format(new Date(entry.date), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                        <TableCell className={entry.kind === "credit" ? "text-green-600" : "text-red-600"}>
                          {formatCurrency(entry.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(entry.status)}</TableCell>
                        <TableCell>
                          {match && (
                            <div className="text-sm">
                              <div className="font-medium">Score: {match.score?.toFixed(2)}</div>
                              <div className="text-muted-foreground">ID: {match.transaction_id.slice(0, 8)}...</div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {entry.status === "suggested_match" && match && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => confirmMutation.mutate({
                                  entryId: entry.id,
                                  txType: match.transaction_type,
                                  txId: match.transaction_id
                                })}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => rejectMutation.mutate(entry.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() => reconcileMutation.mutate()}
          disabled={reconcileMutation.isPending || stats.matched === 0}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Concluir Conciliação
        </Button>
      </div>
    </div>
  );
}
