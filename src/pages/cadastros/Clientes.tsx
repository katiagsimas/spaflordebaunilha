import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { AniversariantesPremiumCard } from "@/components/AniversariantesPremiumCard";
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
import { Plus, Pencil, Trash2, Users, Search, ChevronDown, Download, Cake, MoreVertical, UserPlus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AdicionarFamiliarDialog } from "@/components/AdicionarFamiliarDialog";
import { FamiliaresLista } from "@/components/FamiliaresLista";
import { useFamiliares } from "@/hooks/useFamiliares";
import { toast } from "sonner";
import { formatPhone, formatCpfCnpj } from "@/lib/utils";
import { parseISOToDate } from "@/lib/dateUtils";
import { Badge } from "@/components/ui/badge";
import * as XLSX from '@/lib/xlsxShim';

export default function Clientes() {
  const navigate = useNavigate();
  const { clientes, loading: loadingClientes, createCliente, updateCliente, deleteCliente } = useClientes();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [observacoesOpen, setObservacoesOpen] = useState(false);
  const { buscarCEP, loading: loadingCEP } = useViaCEP();
  const [busca, setBusca] = useState("");
  const [porPagina, setPorPagina] = useState(10);
  const [familiarDialogOpen, setFamiliarDialogOpen] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [selectedClienteNome, setSelectedClienteNome] = useState<string>("");
  const [editingFamiliar, setEditingFamiliar] = useState<any>(null);
  const { familiares: allFamiliares, refetch: refetchFamiliares } = useFamiliares();
  const { deleteFamiliar } = useFamiliares(editingCliente?.id);

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

    if (!formData.nome) {
      toast.error("Nome é obrigatório!");
      return;
    }

    try {
      // Converter campos de data vazios para null
      const dadosLimpos = {
        ...formData,
        data_aniversario: formData.data_aniversario || null,
      };
      
      if (editingCliente) {
        await updateCliente(editingCliente.id, dadosLimpos);
      } else {
        await createCliente(dadosLimpos);
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
      const cliente = clientes.find(c => c.id === id);
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Verificar se o cliente possui encomendas.
      // A tabela `encomendas` não tem FK para `clientes` (apenas o campo string `cliente` com o nome).
      // Só bloqueia se houver encomendas com esse nome E não existirem outros clientes homônimos —
      // caso contrário, é impossível desambiguar e a exclusão é permitida.
      const homonimos = clientes.filter(c => c.nome === cliente?.nome).length;
      const { data: encomendas } = await supabase
        .from('encomendas')
        .select('id')
        .eq('cliente', cliente?.nome ?? '')
        .limit(1);

      if (encomendas && encomendas.length > 0) {
        if (homonimos > 1) {
          toast.warning(
            'Existem encomendas vinculadas ao nome deste cliente, mas há mais de um cliente com o mesmo nome — não é possível garantir que pertençam a este. Verifique manualmente antes de excluir.'
          );
        } else {
          toast.error('Não é possível excluir este cliente pois ele possui encomendas cadastradas.');
        }
        setDeleteId(null);
        return;
      }


      // Verificar se o cliente possui contas a receber
      const { data: contasReceber } = await supabase
        .from('contas_receber')
        .select('id')
        .eq('cliente_id', id)
        .limit(1);
      
      if (contasReceber && contasReceber.length > 0) {
        toast.error('Não é possível excluir este cliente pois existem informações financeiras vinculadas a ele.');
        setDeleteId(null);
        return;
      }
      
      await deleteCliente(id);
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir cliente");
    }
  };

  const handleEdit = (cliente: any) => {
    setEditingCliente(cliente);
  };

  const handleEditFamiliar = (familiar: any) => {
    setEditingFamiliar(familiar);
    setFamiliarDialogOpen(true);
  };

  const handleDeleteFamiliar = async (id: string) => {
    try {
      await deleteFamiliar(id);
      refetchFamiliares();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir familiar");
    }
  };

  // Filtrar aniversariantes do mês (clientes e familiares)
  const aniversariantesDoMes = useMemo(() => {
    const mesAtual = new Date().getMonth();
    
    const clientesAniversariantes = clientes.filter(cliente => {
      if (!cliente.data_aniversario) return false;
      const dataAniversario = parseISOToDate(cliente.data_aniversario);
      return dataAniversario.getMonth() === mesAtual;
    }).map(cliente => ({
      ...cliente,
      tipo_aniversariante: 'cliente' as const,
    }));

    const familiaresAniversariantes = allFamiliares.filter(familiar => {
      if (!familiar.data_nascimento) return false;
      const dataAniversario = parseISOToDate(familiar.data_nascimento);
      return dataAniversario.getMonth() === mesAtual;
    }).map(familiar => {
      const cliente = clientes.find(c => c.id === familiar.cliente_id);
      return {
        id: familiar.id,
        nome: familiar.nome,
        data_aniversario: familiar.data_nascimento,
        telefone: cliente?.telefone,
        tipo_aniversariante: 'familiar' as const,
        parentesco: familiar.parentesco,
        cliente_nome: cliente?.nome,
        cliente_id: familiar.cliente_id,
      };
    });

    const todos = [...clientesAniversariantes, ...familiaresAniversariantes];
    
    return todos.sort((a, b) => {
      const dataA = parseISOToDate(a.data_aniversario)?.getDate() ?? 0;
      const dataB = parseISOToDate(b.data_aniversario)?.getDate() ?? 0;
      return dataA - dataB;
    });
  }, [clientes, allFamiliares]);

  // Filtrar clientes por busca
  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(busca.toLowerCase())
  );

  // Paginação
  const clientesPaginados = clientesFiltrados.slice(0, porPagina);

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
        ? parseISOToDate(cliente.data_aniversario)?.toLocaleDateString('pt-BR')
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
      <PageHeader
        title="Clientes"
        description={`${clientes.length} ${clientes.length === 1 ? "cliente cadastrado" : "clientes cadastrados"}`}
        backButton={<BackButton to="/clientes-fornecedores" />}
      />

      {aniversariantesDoMes.length > 0 && (
        <AniversariantesPremiumCard
          itens={aniversariantesDoMes.map((item: any) => ({
            id: item.id,
            nome: item.nome,
            data_aniversario: item.data_aniversario,
            telefone: item.telefone,
            legenda:
              "tipo_aniversariante" in item && item.tipo_aniversariante === "familiar"
                ? `${item.parentesco ?? "Familiar"} de ${item.cliente_nome ?? ""}`.trim()
                : undefined,
            onClick: () => {
              if ("tipo_aniversariante" in item && item.tipo_aniversariante === "cliente") {
                const cliente = clientes.find((c: any) => c.id === item.id);
                if (cliente) setEditingCliente(cliente);
              } else if ("cliente_id" in item) {
                const cliente = clientes.find((c: any) => c.id === item.cliente_id);
                if (cliente) setEditingCliente(cliente);
              }
            },
          }))}
        />
      )}


      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Clientes</CardTitle>
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

                {/* Seção de Familiares - apenas ao editar */}
                {editingCliente && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Familiares
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedClienteId(editingCliente.id);
                          setSelectedClienteNome(editingCliente.nome);
                          setEditingFamiliar(null);
                          setFamiliarDialogOpen(true);
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Adicionar Familiar
                      </Button>
                    </div>
                    <FamiliaresLista
                      clienteId={editingCliente.id}
                      onEdit={handleEditFamiliar}
                      onDelete={handleDeleteFamiliar}
                    />
                  </div>
                )}

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
          </div>
        </CardHeader>
        
        {/* Card de Controles */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg">
            {/* Resultados por Página - Esquerda */}
            <div className="flex items-center gap-2">
              <Select value={porPagina.toString()} onValueChange={(value) => setPorPagina(Number(value))}>
                <SelectTrigger className="w-20 bg-popover">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground whitespace-nowrap">Resultados por Página</span>
            </div>

            {/* Botão Exportar - Centro */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportarExcel}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar para Excel
            </Button>

            {/* Campo de Busca - Direita */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 bg-popover"
              />
            </div>
          </div>
        </div>

        <CardContent>
          {clientesPaginados.length === 0 ? (
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
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientesPaginados.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>{cliente.tipo || "PF"}</TableCell>
                      <TableCell>{cliente.telefone}</TableCell>
                      <TableCell>{cliente.email || "-"}</TableCell>
                      <TableCell>
                        {cliente.data_aniversario 
                          ? parseISOToDate(cliente.data_aniversario)?.toLocaleDateString('pt-BR')
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background">
                            <DropdownMenuItem onClick={() => handleEdit(cliente)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedClienteId(cliente.id);
                                setSelectedClienteNome(cliente.nome);
                                setEditingFamiliar(null);
                                setFamiliarDialogOpen(true);
                              }}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Adicionar Familiares
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeleteId(cliente.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      {selectedClienteId && (
        <AdicionarFamiliarDialog
          open={familiarDialogOpen}
          onOpenChange={(open) => {
            setFamiliarDialogOpen(open);
            if (!open) {
              setEditingFamiliar(null);
              setSelectedClienteId(null);
            }
          }}
          clienteId={selectedClienteId}
          clienteNome={selectedClienteNome}
          editingFamiliar={editingFamiliar}
          onFamiliarAdded={() => {
            refetchFamiliares();
            // Forçar atualização dos aniversariantes
            setTimeout(() => refetchFamiliares(), 500);
          }}
        />
      )}
    </div>
  );
}
