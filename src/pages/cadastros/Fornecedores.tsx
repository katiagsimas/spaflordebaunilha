import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { useFornecedores } from "@/hooks/useFornecedores";
import { Plus, Pencil, Trash2, Truck, ChevronDown, Cake } from "lucide-react";
import { formatPhone, formatCpfCnpj } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface FormDataFornecedor {
  nome: string;
  tipo: "PF" | "PJ";
  tipo_fornecedor: "Insumos" | "Embalagens" | "Diversos" | "Papelaria Personalizada" | "Outros";
  cpf_cnpj: string;
  telefone: string;
  email: string;
  contato: string;
  data_aniversario_contato: string;
  observacoes: string;
}

export default function Fornecedores() {
  const navigate = useNavigate();
  const { fornecedores, loading, createFornecedor, updateFornecedor, deleteFornecedor } = useFornecedores();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [observacoesOpen, setObservacoesOpen] = useState(false);

  const [formData, setFormData] = useState<FormDataFornecedor>({
    nome: "",
    tipo: "PF",
    tipo_fornecedor: "Insumos",
    cpf_cnpj: "",
    telefone: "",
    email: "",
    contato: "",
    data_aniversario_contato: "",
    observacoes: "",
  });

  useEffect(() => {
    if (editingId) {
      const fornecedor = fornecedores.find(f => f.id === editingId);
      if (fornecedor) {
        setFormData({
          nome: fornecedor.nome,
          tipo: (fornecedor.tipo as "PF" | "PJ") || "PF",
          tipo_fornecedor: (fornecedor.tipo_fornecedor as "Insumos" | "Embalagens" | "Diversos" | "Papelaria Personalizada" | "Outros") || "Insumos",
          cpf_cnpj: fornecedor.cpf_cnpj || "",
          telefone: fornecedor.telefone || "",
          email: fornecedor.email || "",
          contato: fornecedor.contato || "",
          data_aniversario_contato: fornecedor.data_aniversario_contato || "",
          observacoes: fornecedor.observacoes || "",
        });
        setIsDialogOpen(true);
      }
    }
  }, [editingId, fornecedores]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await updateFornecedor(editingId, formData);
      } else {
        await createFornecedor(formData);
      }
      resetForm();
    } catch (error: any) {
      console.error('Erro ao salvar fornecedor:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      tipo: "PF",
      tipo_fornecedor: "Insumos",
      cpf_cnpj: "",
      telefone: "",
      email: "",
      contato: "",
      data_aniversario_contato: "",
      observacoes: "",
    });
    setEditingId(null);
    setIsDialogOpen(false);
    setObservacoesOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFornecedor(id);
      setDeleteId(null);
    } catch (error: any) {
      console.error('Erro ao deletar fornecedor:', error);
    }
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  // Filtrar aniversariantes do mês
  const aniversariantesDoMes = useMemo(() => {
    const mesAtual = new Date().getMonth();
    return fornecedores.filter(fornecedor => {
      if (!fornecedor.data_aniversario_contato || !fornecedor.contato) return false;
      const dataAniversario = new Date(fornecedor.data_aniversario_contato + 'T00:00:00');
      return dataAniversario.getMonth() === mesAtual;
    }).sort((a, b) => {
      const dataA = new Date(a.data_aniversario_contato! + 'T00:00:00').getDate();
      const dataB = new Date(b.data_aniversario_contato! + 'T00:00:00').getDate();
      return dataA - dataB;
    });
  }, [fornecedores]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <PageHeader
            title="Fornecedores"
            description="Gerencie seus fornecedores"
          />
        </div>
      </div>

      {aniversariantesDoMes.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Cake className="h-5 w-5 animate-bounce" />
              🎉 Aniversariantes do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aniversariantesDoMes.map((fornecedor) => (
                <div 
                  key={fornecedor.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {fornecedor.contato}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(fornecedor.data_aniversario_contato! + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {fornecedor.nome}
                    </p>
                  </div>
                  <Cake className="h-8 w-8 text-purple-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lista de Fornecedores</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingId(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo">PF ou PJ</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value: "PF" | "PJ") => setFormData({ ...formData, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PF">Pessoa Física</SelectItem>
                        <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf_cnpj">CNPJ/CPF</Label>
                    <Input
                      id="cpf_cnpj"
                      value={formData.cpf_cnpj}
                      onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, cpf_cnpj: formatCpfCnpj(e.target.value) })}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>O que Fornece *</Label>
                  <ToggleGroup 
                    type="single" 
                    value={formData.tipo_fornecedor}
                    onValueChange={(value) => value && setFormData({ ...formData, tipo_fornecedor: value as "Insumos" | "Embalagens" | "Diversos" | "Papelaria Personalizada" | "Outros" })}
                    className="justify-start flex-wrap"
                  >
                    <ToggleGroupItem value="Insumos" aria-label="Insumos">
                      Insumos
                    </ToggleGroupItem>
                    <ToggleGroupItem value="Embalagens" aria-label="Embalagens">
                      Embalagens
                    </ToggleGroupItem>
                    <ToggleGroupItem value="Diversos" aria-label="Diversos">
                      Diversos
                    </ToggleGroupItem>
                    <ToggleGroupItem value="Papelaria Personalizada" aria-label="Papelaria Personalizada">
                      Papelaria Personalizada
                    </ToggleGroupItem>
                    <ToggleGroupItem value="Outros" aria-label="Outros">
                      Outros
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone/WhatsApp</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contato">Contato</Label>
                    <Input
                      id="contato"
                      value={formData.contato}
                      onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                      placeholder="Nome do contato"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_aniversario_contato">Aniversário do Contato</Label>
                    <Input
                      id="data_aniversario_contato"
                      type="date"
                      value={formData.data_aniversario_contato}
                      onChange={(e) => setFormData({ ...formData, data_aniversario_contato: e.target.value })}
                    />
                  </div>
                </div>

                <Collapsible open={observacoesOpen} onOpenChange={setObservacoesOpen}>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="outline" className="w-full">
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Observações
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      placeholder="Digite aqui observações sobre o fornecedor..."
                      rows={4}
                    />
                  </CollapsibleContent>
                </Collapsible>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {editingId ? "Atualizar" : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {fornecedores.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="Nenhum fornecedor cadastrado"
              description="Comece adicionando seu primeiro fornecedor"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>O que Fornece</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>CNPJ/CPF</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Aniversário</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fornecedores.map((fornecedor) => (
                    <TableRow key={fornecedor.id}>
                      <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                      <TableCell>{fornecedor.tipo_fornecedor || "-"}</TableCell>
                      <TableCell>{fornecedor.tipo || "-"}</TableCell>
                      <TableCell>{fornecedor.cpf_cnpj || "-"}</TableCell>
                      <TableCell>{fornecedor.telefone || "-"}</TableCell>
                      <TableCell>{fornecedor.contato || "-"}</TableCell>
                      <TableCell>
                        {fornecedor.data_aniversario_contato 
                          ? new Date(fornecedor.data_aniversario_contato + 'T00:00:00').toLocaleDateString('pt-BR')
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(fornecedor.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(fornecedor.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Excluir Fornecedor"
        description="Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
