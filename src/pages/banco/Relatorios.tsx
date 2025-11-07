import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserId } from "@/hooks/useUserId";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertCircle, TrendingUp, Download } from "lucide-react";
import { format } from "date-fns";

export default function BankReportsPage() {
  const userId = useUserId();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: differences } = useQuery({
    queryKey: ["bank-differences", userId, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from("bank_entries" as any)
        .select("id, date, amount, kind, description, status, import_id")
        .in("status", ["imported", "suggested_match"]);

      if (startDate) query = query.gte("date", startDate);
      if (endDate) query = query.lte("date", endDate);

      const { data, error } = await query.order("date", { ascending: false });
      if (error) throw error;
      
      // Filter by user's imports
      if (!data) return [];
      const imports = await supabase
        .from("bank_imports" as any)
        .select("id")
        .eq("usuario_id", userId);
      
      const userImportIds = imports.data?.map((i: any) => i.id) || [];
      return data.filter((entry: any) => userImportIds.includes(entry.import_id));
    }
  });

  const { data: stats } = useQuery({
    queryKey: ["bank-stats", userId],
    queryFn: async () => {
      // Get user's imports first
      const { data: imports } = await supabase
        .from("bank_imports" as any)
        .select("id")
        .eq("usuario_id", userId);
      
      const userImportIds = imports?.map((i: any) => i.id) || [];
      
      if (userImportIds.length === 0) {
        return { total: 0, reconciled: 0, matched: 0, pending: 0, accuracy: "0" };
      }
      
      const { data, error } = await supabase
        .from("bank_entries" as any)
        .select("status")
        .in("import_id", userImportIds);

      if (error) throw error;

      const total = data?.length || 0;
      const reconciled = data?.filter((e: any) => e.status === "reconciled").length || 0;
      const matched = data?.filter((e: any) => e.status === "matched").length || 0;
      const pending = total - reconciled - matched;

      return {
        total,
        reconciled,
        matched,
        pending,
        accuracy: total > 0 ? ((reconciled / total) * 100).toFixed(1) : "0"
      };
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const exportCSV = () => {
    if (!differences) return;

    const headers = ["Data", "Descrição", "Valor", "Tipo"];
    const rows = differences.map((d: any) => [
      format(new Date(d.date), "dd/MM/yyyy"),
      d.description,
      d.amount,
      d.kind
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diferencas-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Relatórios de Conciliação"
        description="Acompanhe pendências e qualidade dos matches"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conciliados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats?.reconciled || 0}</div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats?.pending || 0}</div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Diferenças
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{differences?.length || 0}</div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Acerto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats?.accuracy}%</div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filtros</CardTitle>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Data Inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Data Final</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diferenças Não Conciliadas</CardTitle>
        </CardHeader>
        <CardContent>
          {!differences || differences.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma diferença encontrada
            </div>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {differences.map((diff: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{format(new Date(diff.date), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="max-w-md truncate">{diff.description}</TableCell>
                      <TableCell>{formatCurrency(diff.amount)}</TableCell>
                      <TableCell>
                        <span className={diff.kind === "credit" ? "text-green-600" : "text-red-600"}>
                          {diff.kind === "credit" ? "Crédito" : "Débito"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
