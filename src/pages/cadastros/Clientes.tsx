import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
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
import { useClientes } from "@/hooks/useClientes";
import { useViaCEP } from "@/hooks/useViaCEP";
import { Plus, Pencil, Trash2, Users, Search, ChevronDown, Download } from "lucide-react";
import { toast } from "sonner";
import { formatPhone, formatCpfCnpj } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import * as XLSX from 'xlsx';

export default function Clientes() {
  const navigate = useNavigate();
  const { clientes, loading: loadingClientes, createCliente, updateCliente, deleteCliente } = useClientes();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [observacoesOpen, setObservacoesOpen] = useState(false);
  const { buscarCEP, loading: loadingCEP } = useViaCEP();
  const [busca, setBusca] = useState("");

  const [formData, setFormData] = useState({
    nome: "",
    tipo: "PF",
    telefone: "",
    email: "",
    cpf_cnpj: "",
    data_aniversario: "",
    cep: "",
    endereco: "",
    numero: "",
    cidade: "",
    estado: "",
    observacoes: "",
  });

  useEffect(() => {
    if (editingCliente) {
      setFormData(editingCliente);
      setIsDialogOpen(true);
    }
  }, [editingCliente]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.telefone) {
      toast.error("Nome e telefone são obrigatórios!");
      return;
    }

    try {
      if (editingCliente) {
        await updateCliente(editingCliente.id, formData);
      } else {
        await createCliente(formData);
      }
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar cliente");
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      tipo: "PF",
      telefone: "",
      email: "",
      cpf_cnpj: "",
      data_aniversario: "",
      cep: "",
      endereco: "",
      numero: "",
      cidade: "",
      estado: "",
      observacoes: "",
    });
    setEditingCliente(null);
    setIsDialogOpen(false);
    setObservacoesOpen(false);
  };

  const handleBuscarCEP = async () => {
    const endereco = await buscarCEP(formData.cep);
    if (endereco) {
      setFormData({
        ...formData,
        endereco: endereco.endereco,
        cidade: endereco.cidade,
        estado: endereco.estado,
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCliente(id);
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir cliente");
    }
  };

  const handleEdit = (cliente: any) => {
    setEditingCliente(cliente);
  };

  // Filtrar clientes por busca
  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const handleExportarExcel = () => {
    if (clientesFiltrados.length === 0) {
      return;
    }

    const dadosExport = clientesFiltrados.map((cliente) => ({
      'Nome': cliente.nome,
      'Tipo': cliente.tipo || 'PF',
      'Telefone': cliente.telefone,
      'E-mail': cliente.email || '-',
      'CPF/CNPJ': cliente.cpf_cnpj || '-',
      'Aniversário': cliente.data_aniversario 
        ? new Date(cliente.data_aniversario + 'T00:00:00').toLocaleDateString('pt-BR')
        : '-',
      'CEP': cliente.cep || '-',
      'Endereço': cliente.endereco || '-',
      'Número': cliente.numero || '-',
      'Cidade': cliente.cidade || '-',
      'Estado': cliente.estado || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, `clientes_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {clientes.length} {clientes.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingCliente(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCliente ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
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
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value="PF">Pessoa Física</SelectItem>
                        <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                      placeholder="(00) 00000-0000"
                      required
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
                    <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                    <Input
                      id="cpf_cnpj"
                      value={formData.cpf_cnpj}
                      onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, cpf_cnpj: formatCpfCnpj(e.target.value) })}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_aniversario">Data de Aniversário</Label>
                    <Input
                      id="data_aniversario"
                      type="date"
                      value={formData.data_aniversario}
                      onChange={(e) => setFormData({ ...formData, data_aniversario: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cep"
                        value={formData.cep}
                        onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                        placeholder="00000-000"
                        maxLength={9}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBuscarCEP}
                        disabled={loadingCEP || !formData.cep}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        {loadingCEP ? "Buscando..." : "Buscar"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      placeholder="Rua, Avenida"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      placeholder="Nº"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      placeholder="Cidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      placeholder="UF"
                      maxLength={2}
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
                      placeholder="Digite aqui observações sobre o cliente..."
                      rows={4}
                    />
                  </CollapsibleContent>
                </Collapsible>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingCliente ? "Atualizar" : "Cadastrar"}
                  </Button>
                </div>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleExportarExcel}>
              <Download className="h-4 w-4 mr-2" />
              Exportar para Excel
            </Button>
          </div>

          {clientesFiltrados.length === 0 ? (
            busca ? (
              <EmptyState
                icon={Search}
                title="Nenhum cliente encontrado"
                description="Não encontramos clientes com esse nome"
              />
            ) : (
            <EmptyState
              icon={Users}
                title="Nenhum cliente cadastrado"
                description="Comece adicionando seu primeiro cliente"
              />
            )
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Aniversário</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientesFiltrados.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>{cliente.tipo || "PF"}</TableCell>
                      <TableCell>{cliente.telefone}</TableCell>
                      <TableCell>{cliente.email || "-"}</TableCell>
                      <TableCell>
                        {cliente.data_aniversario 
                          ? new Date(cliente.data_aniversario + 'T00:00:00').toLocaleDateString('pt-BR')
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(cliente)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(cliente.id)}
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
        title="Excluir Cliente"
        description="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
