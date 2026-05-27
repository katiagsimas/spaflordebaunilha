import { useState, useEffect, useMemo } from "react";
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
import { useFornecedores } from "@/hooks/useFornecedores";
import { Plus, Pencil, Trash2, Truck, ChevronDown, Cake, Search, Download, MoreVertical, UserPlus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useFornecedorContatos } from "@/hooks/useFornecedorContatos";
import { AdicionarContatoDialog } from "@/components/AdicionarContatoDialog";
import { ContatosLista } from "@/components/ContatosLista";
import { AlertaAniversariantesContatos } from "@/components/AlertaAniversariantesContatos";
import { supabase } from "@/integrations/supabase/client";
import { formatPhone, formatCpfCnpj } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useGroup } from "@/contexts/GroupContext";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import * as XLSX from '@/lib/xlsxShim';

interface FormDataFornecedor {
  nome: string;
  tipo: "PF" | "PJ";
  cpf_cnpj: string;
  telefone: string;
  email: string;
  observacoes: string;
}

export default function Fornecedores() {
  const navigate = useNavigate();
  const { fornecedores, loading, createFornecedor, updateFornecedor, deleteFornecedor } = useFornecedores();
  const { activeGroupId } = useGroup();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteContatoId, setDeleteContatoId] = useState<string | null>(null);
  const [observacoesOpen, setObservacoesOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const [porPagina, setPorPagina] = useState(10);
  const [contatoDialogOpen, setContatoDialogOpen] = useState(false);
  const [selectedFornecedorId, setSelectedFornecedorId] = useState<string | null>(null);
  const [editingContato, setEditingContato] = useState<any>(null);

  // Hook de contatos carregado apenas quando há um fornecedor selecionado/expandido
  const fornecedorContatosId = editingId || selectedFornecedorId || "";
  const { contatos, createContato, updateContato, deleteContato, refetch: refetchContatos } = useFornecedorContatos(fornecedorContatosId);

  // Query separada para listar aniversariantes do grupo (usada apenas no alerta)
  const { data: contatosGrupo = [] } = useQuery({
    queryKey: ["fornecedor_contatos_grupo", activeGroupId],
    queryFn: async () => {
      if (!activeGroupId) return [] as any[];
      const { data, error } = await (supabase
        .from("fornecedor_contatos") as any)
        .select("*")
        .eq("owner_group_id", activeGroupId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeGroupId,
  });

  const [formData, setFormData] = useState<FormDataFornecedor>({
    nome: "",
    tipo: "PF",
    cpf_cnpj: "",
    telefone: "",
    email: "",
    observacoes: "",
  });

  useEffect(() => {
    if (editingId) {
      const fornecedor = fornecedores.find(f => f.id === editingId);
      if (fornecedor) {
        setFormData({
          nome: fornecedor.nome,
          tipo: (fornecedor.tipo as "PF" | "PJ") || "PF",
          cpf_cnpj: fornecedor.cpf_cnpj || "",
          telefone: fornecedor.telefone || "",
          email: fornecedor.email || "",
          observacoes: fornecedor.observacoes || "",
        });
        setIsDialogOpen(true);
      }
    }
  }, [editingId, fornecedores]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome) {
      toast.error("Nome é obrigatório!");
      return;
    }

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
      cpf_cnpj: "",
      telefone: "",
      email: "",
      observacoes: "",
    });
    setEditingId(null);
    setIsDialogOpen(false);
    setObservacoesOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      // Verificar se o fornecedor está sendo usado no módulo Financeiro
      const { data: contasPagar, error: errorPagar } = await supabase
        .from('contas_pagar')
        .select('id')
        .eq('fornecedor_id', deleteId)
        .limit(1);

      if (errorPagar) throw errorPagar;

      if (contasPagar && contasPagar.length > 0) {
        toast.error('Não é possível excluir este fornecedor. Existem informações financeiras (Contas a Pagar) vinculadas a ele.');
        setDeleteId(null);
        return;
      }

      await deleteFornecedor(deleteId);
      setDeleteId(null);
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir fornecedor: ' + error.message);
    }
  };

  const handleAdicionarContato = (fornecedorId: string) => {
    setSelectedFornecedorId(fornecedorId);
    setEditingContato(null);
    setContatoDialogOpen(true);
  };

  const handleEditContato = (contato: any) => {
    setEditingContato(contato);
    setSelectedFornecedorId(contato.fornecedor_id);
    setContatoDialogOpen(true);
  };

  const handleDeleteContato = (id: string) => {
    setDeleteContatoId(id);
  };

  const handleConfirmDeleteContato = async () => {
    if (!deleteContatoId) return;
    try {
      await deleteContato(deleteContatoId);
    } catch (error: any) {
      console.error('Erro ao excluir contato:', error);
    } finally {
      setDeleteContatoId(null);
    }
  };

  const handleSubmitContato = async (data: any, cadastrarOutro: boolean) => {
    try {
      if (editingContato) {
        await updateContato(editingContato.id, data);
        setContatoDialogOpen(false);
      } else {
        await createContato({
          ...data,
          fornecedor_id: selectedFornecedorId!,
        });
        
        if (!cadastrarOutro) {
          setContatoDialogOpen(false);
        }
      }
      refetchContatos();
    } catch (error: any) {
      console.error('Erro ao salvar contato:', error);
      throw error;
    }
  };


  // Contatos aniversariantes do mês com informação do fornecedor
  const contatosAniversariantes = useMemo(() => {
    return contatosGrupo.map((contato: any) => {
      const fornecedor = fornecedores.find(f => f.id === contato.fornecedor_id);
      return {
        ...contato,
        fornecedor_nome: fornecedor?.nome,
        fornecedor_id: contato.fornecedor_id,
      };
    });
  }, [contatosGrupo, fornecedores]);

  // Filtrar fornecedores por busca
  const fornecedoresFiltrados = useMemo(() => {
    return fornecedores.filter(fornecedor =>
      fornecedor.nome.toLowerCase().includes(busca.toLowerCase())
    );
  }, [fornecedores, busca]);

  // Paginação
  const fornecedoresPaginados = useMemo(() => {
    return fornecedoresFiltrados.slice(0, porPagina);
  }, [fornecedoresFiltrados, porPagina]);

  const handleExportarExcel = () => {
    if (fornecedoresFiltrados.length === 0) {
      return;
    }

    const dadosExport = fornecedoresFiltrados.map((fornecedor) => ({
      'Nome': fornecedor.nome,
      'Tipo': fornecedor.tipo || '-',
      'CPF/CNPJ': fornecedor.cpf_cnpj || '-',
      'Telefone': fornecedor.telefone || '-',
      'E-mail': fornecedor.email || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fornecedores');
    XLSX.writeFile(wb, `fornecedores_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fornecedores"
        description={`${fornecedores.length} ${fornecedores.length === 1 ? "fornecedor cadastrado" : "fornecedores cadastrados"}`}
        backButton={<BackButton to="/clientes-fornecedores" />}
      />

      {/* Aniversariantes do Mês */}
      <AlertaAniversariantesContatos
        contatos={contatosAniversariantes}
        onContatoClick={(fornecedorId) => setEditingId(fornecedorId)}
      />


      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
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
                
                {/* Lista de Contatos - apenas ao editar */}
                {editingId && (
                  <div className="mt-4">
                    <ContatosLista
                      contatos={contatos.filter(c => c.fornecedor_id === editingId)}
                      onEdit={handleEditContato}
                      onDelete={handleDeleteContato}
                      loading={loading}
                    />
                  </div>
                )}

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
          {fornecedoresPaginados.length === 0 ? (
            busca ? (
              <EmptyState
                icon={Search}
                title="Nenhum fornecedor encontrado"
                description="Não encontramos fornecedores com esse nome"
              />
            ) : (
            <EmptyState
              icon={Truck}
                title="Nenhum fornecedor cadastrado"
                description="Comece adicionando seu primeiro fornecedor"
              />
            )
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>CNPJ/CPF</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fornecedoresPaginados.map((fornecedor) => (
                    <TableRow key={fornecedor.id}>
                      <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                      <TableCell>{fornecedor.tipo || "-"}</TableCell>
                      <TableCell>{fornecedor.cpf_cnpj || "-"}</TableCell>
                      <TableCell>{fornecedor.telefone || "-"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingId(fornecedor.id)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAdicionarContato(fornecedor.id)}>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Adicionar Contato
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeleteId(fornecedor.id)}
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
        onConfirm={handleDelete}
        title="Excluir Fornecedor"
        description="Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita."
      />

      <ConfirmDialog
        open={!!deleteContatoId}
        onOpenChange={(open) => !open && setDeleteContatoId(null)}
        onConfirm={handleConfirmDeleteContato}
        title="Excluir Contato"
        description="Tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita."
      />

      <AdicionarContatoDialog
        open={contatoDialogOpen}
        onOpenChange={setContatoDialogOpen}
        onSubmit={handleSubmitContato}
        initialData={editingContato}
        fornecedorId={selectedFornecedorId || ''}
        fornecedorNome={fornecedores.find(f => f.id === selectedFornecedorId)?.nome}
      />
    </div>
  );
}
