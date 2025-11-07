import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserId } from "@/hooks/useUserId";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Copy } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { FileQuestion } from "lucide-react";

interface BankRule {
  id: string;
  bank_name: string;
  csv_delimiter: string;
  decimal_comma: boolean;
  date_format: string;
  column_map: Record<string, string>;
  created_at: string;
}

export default function BankRulesPage() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BankRule | null>(null);
  const [previewCsv, setPreviewCsv] = useState("");

  const [formData, setFormData] = useState({
    bank_name: "",
    csv_delimiter: ",",
    decimal_comma: false,
    date_format: "DD/MM/YYYY",
    column_map: JSON.stringify({
      date: "Data",
      amount: "Valor",
      description: "Histórico",
      credit_debit: "Sinal"
    }, null, 2)
  });

  const { data: rules, isLoading } = useQuery({
    queryKey: ["bank-rules", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_rules")
        .select("*")
        .eq("usuario_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BankRule[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("bank_rules")
        .insert({
          ...data,
          usuario_id: userId,
          column_map: JSON.parse(data.column_map)
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-rules"] });
      toast({ title: "Regra criada com sucesso" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Erro ao criar regra", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("bank_rules")
        .update({
          ...data,
          column_map: JSON.parse(data.column_map)
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-rules"] });
      toast({ title: "Regra atualizada com sucesso" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar regra", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bank_rules")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-rules"] });
      toast({ title: "Regra excluída com sucesso" });
    }
  });

  const handleSubmit = () => {
    try {
      JSON.parse(formData.column_map); // Validate JSON
      if (editingRule) {
        updateMutation.mutate({ id: editingRule.id, data: formData });
      } else {
        createMutation.mutate(formData);
      }
    } catch {
      toast({ title: "JSON de mapeamento inválido", variant: "destructive" });
    }
  };

  const handleEdit = (rule: BankRule) => {
    setEditingRule(rule);
    setFormData({
      bank_name: rule.bank_name,
      csv_delimiter: rule.csv_delimiter,
      decimal_comma: rule.decimal_comma,
      date_format: rule.date_format,
      column_map: JSON.stringify(rule.column_map, null, 2)
    });
    setIsDialogOpen(true);
  };

  const handleDuplicate = (rule: BankRule) => {
    setEditingRule(null);
    setFormData({
      bank_name: `${rule.bank_name} (cópia)`,
      csv_delimiter: rule.csv_delimiter,
      decimal_comma: rule.decimal_comma,
      date_format: rule.date_format,
      column_map: JSON.stringify(rule.column_map, null, 2)
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRule(null);
    setPreviewCsv("");
    setFormData({
      bank_name: "",
      csv_delimiter: ",",
      decimal_comma: false,
      date_format: "DD/MM/YYYY",
      column_map: JSON.stringify({
        date: "Data",
        amount: "Valor",
        description: "Histórico",
        credit_debit: "Sinal"
      }, null, 2)
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Regras de Importação"
        description="Configure como ler arquivos CSV do seu banco"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Regras Cadastradas</CardTitle>
              <CardDescription>Gerencie as configurações de importação por banco</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingRule(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Regra
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingRule ? "Editar Regra" : "Nova Regra"}</DialogTitle>
                  <DialogDescription>Configure os parâmetros de leitura do CSV</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Nome do Banco</Label>
                    <Input
                      id="bank_name"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      placeholder="Ex: Banco do Brasil"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="delimiter">Delimitador CSV</Label>
                      <Select
                        value={formData.csv_delimiter}
                        onValueChange={(value) => setFormData({ ...formData, csv_delimiter: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value=",">Vírgula (,)</SelectItem>
                          <SelectItem value=";">Ponto e vírgula (;)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date_format">Formato de Data</Label>
                      <Input
                        id="date_format"
                        value={formData.date_format}
                        onChange={(e) => setFormData({ ...formData, date_format: e.target.value })}
                        placeholder="DD/MM/YYYY"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="decimal_comma"
                      checked={formData.decimal_comma}
                      onCheckedChange={(checked) => setFormData({ ...formData, decimal_comma: checked as boolean })}
                    />
                    <Label htmlFor="decimal_comma">Usar vírgula como separador decimal</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="column_map">Mapeamento de Colunas (JSON)</Label>
                    <Textarea
                      id="column_map"
                      value={formData.column_map}
                      onChange={(e) => setFormData({ ...formData, column_map: e.target.value })}
                      rows={8}
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preview">Preview (cole 3-5 linhas do CSV)</Label>
                    <Textarea
                      id="preview"
                      value={previewCsv}
                      onChange={(e) => setPreviewCsv(e.target.value)}
                      placeholder="01/11/2025;-150,00;D;Pagamento conta luz"
                      rows={4}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
                  <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingRule ? "Atualizar" : "Criar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : !rules || rules.length === 0 ? (
            <EmptyState
              icon={FileQuestion}
              title="Nenhuma regra cadastrada"
              description="Crie uma regra para começar a importar extratos bancários"
              actionLabel="Nova Regra"
              onAction={() => setIsDialogOpen(true)}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Banco</TableHead>
                  <TableHead>Delimitador</TableHead>
                  <TableHead>Decimal</TableHead>
                  <TableHead>Formato Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.bank_name}</TableCell>
                    <TableCell>{rule.csv_delimiter === "," ? "Vírgula" : "Ponto e vírgula"}</TableCell>
                    <TableCell>{rule.decimal_comma ? "Vírgula" : "Ponto"}</TableCell>
                    <TableCell>{rule.date_format}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(rule)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDuplicate(rule)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
