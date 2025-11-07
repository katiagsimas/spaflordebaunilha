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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { useFornecedores } from "@/hooks/useFornecedores";
import { Plus, Pencil, Trash2, Truck, Cake, Search, Download, MoreVertical, UserPlus } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatPhone, formatCpfCnpj } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import * as XLSX from 'xlsx';
import { ContatosFornecedorManager } from '@/components/fornecedores/ContatosFornecedorManager';

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [porPagina, setPorPagina] = useState(10);
  const [contatoFornecedorId, setContatoFornecedorId] = useState<string | null>(null);
  const [isContatoDialogOpen, setIsContatoDialogOpen] = useState(false);

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

  const handleAdicionarContato = (fornecedorId: string) => {
    setContatoFornecedorId(fornecedorId);
    setIsContatoDialogOpen(true);
  };

  // Buscar aniversariantes do mês (agora dos contatos)
  const { data: aniversariantesDoMes = [] } = useQuery({
    queryKey: ['aniversariantes-fornecedores-mes'],
    queryFn: async () => {
      const mesAtual = new Date().getMonth() + 1;
      const { data, error } = await supabase
        .rpc('get_aniversariantes_fornecedores_mes', { mes_param: mesAtual });
      if (error) throw error;
      return data || [];
    }
  });

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
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Fornecedores</h1>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {fornecedores.length} {fornecedores.length === 1 ? 'fornecedor cadastrado' : 'fornecedores cadastrados'}
        </Badge>
      </div>

      {aniversariantesDoMes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Cake className="h-5 w-5 animate-bounce" />
            🎉 Aniversariantes do Mês
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {aniversariantesDoMes.map((aniversariante: any) => (
              <Card 
                key={aniversariante.fornecedor_id + '-' + aniversariante.nome}
                className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 dark:from-purple-500/20 dark:via-pink-500/20 dark:to-orange-500/20 border-2 border-purple-300/50 dark:border-purple-500/50 hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Cake className="h-6 w-6 text-white animate-bounce" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {aniversariante.nome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(aniversariante.data_aniversario + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {aniversariante.tipo} {aniversariante.cargo && `• ${aniversariante.cargo}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

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

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Digite aqui observações sobre o fornecedor..."
                    rows={4}
                  />
                </div>

                {/* SEÇÃO DE CONTATOS ADICIONAIS */}
                {editingId && (
                  <div className="pt-2 border-t">
                    <ContatosFornecedorManager 
                      fornecedorId={editingId} 
                      isNewFornecedor={false}
                    />
                  </div>
                )}
                
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {editingId ? "Atualizar" : "Salvar"}
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
                    <TableHead>E-mail</TableHead>
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
                      <TableCell>{fornecedor.email || "-"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(fornecedor.id)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAdicionarContato(fornecedor.id)}>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Adicionar Contato
                            </DropdownMenuItem>
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
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Excluir Fornecedor"
        description="Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita."
      />

      {/* Dialog para adicionar contato */}
      <Dialog open={isContatoDialogOpen} onOpenChange={setIsContatoDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Contatos do Fornecedor</DialogTitle>
          </DialogHeader>
          {contatoFornecedorId && (
            <ContatosFornecedorManager 
              fornecedorId={contatoFornecedorId}
              isNewFornecedor={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
