import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, Plus, Pencil, Trash2, Users, Calendar } from 'lucide-react';
import { formatPhone, formatCpfCnpj } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface FornecedorFormData {
  nome: string;
  tipo: 'PF' | 'PJ';
  tipo_fornecedor: 'Insumos' | 'Embalagens' | 'Diversos' | 'Papelaria Personalizada' | 'Outros';
  cpf_cnpj: string;
  telefone: string;
  email: string;
  contato: string;
  data_aniversario_contato: string;
  observacoes: string;
}

interface Contato {
  id?: string;
  nome: string;
  cargo: string;
  email: string;
  data_aniversario: string;
  observacoes?: string;
}

interface FornecedorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FornecedorFormData) => Promise<void>;
  initialData?: Partial<FornecedorFormData>;
  loading?: boolean;
  fornecedorId?: string | null;
}

const defaultFormData: FornecedorFormData = {
  nome: '',
  tipo: 'PF',
  tipo_fornecedor: 'Insumos',
  cpf_cnpj: '',
  telefone: '',
  email: '',
  contato: '',
  data_aniversario_contato: '',
  observacoes: '',
};

export function FornecedorFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  loading = false,
  fornecedorId,
}: FornecedorFormDialogProps) {
  const [formData, setFormData] = useState<FornecedorFormData>(defaultFormData);
  const [observacoesOpen, setObservacoesOpen] = useState(false);
  const [contatoAtual, setContatoAtual] = useState<Contato>({
    nome: '',
    cargo: '',
    email: '',
    data_aniversario: '',
    observacoes: ''
  });
  const [isEditingContato, setIsEditingContato] = useState(false);
  const [showContatoForm, setShowContatoForm] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setFormData({
        ...defaultFormData,
        ...initialData,
      });
      setObservacoesOpen(false);
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleCancel = () => {
    setFormData(defaultFormData);
    setObservacoesOpen(false);
    setShowContatoForm(false);
    limparFormularioContato();
    onOpenChange(false);
  };

  // Buscar contatos
  const { data: contatos = [] } = useQuery({
    queryKey: ['fornecedor-contatos', fornecedorId],
    queryFn: async () => {
      if (!fornecedorId) return [];
      
      const { data, error } = await supabase
        .from('fornecedor_contatos')
        .select('*')
        .eq('fornecedor_id', fornecedorId)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data || [];
    },
    enabled: !!fornecedorId
  });

  // Mutation para salvar contato
  const salvarContato = useMutation({
    mutationFn: async (contato: Contato) => {
      if (!fornecedorId) throw new Error('Fornecedor não selecionado');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const dados = {
        usuario_id: user.id,
        fornecedor_id: fornecedorId,
        nome: contato.nome,
        cargo: contato.cargo || null,
        telefone: null,
        email: contato.email || null,
        data_aniversario: contato.data_aniversario || null,
        observacoes: contato.observacoes || null
      };

      if (contato.id) {
        const { error } = await supabase
          .from('fornecedor_contatos')
          .update(dados)
          .eq('id', contato.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fornecedor_contatos')
          .insert(dados);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedor-contatos', fornecedorId] });
      queryClient.invalidateQueries({ queryKey: ['aniversariantes-fornecedores-mes'] });
      toast.success('Contato salvo com sucesso!');
      limparFormularioContato();
      setShowContatoForm(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao salvar contato');
    }
  });

  // Mutation para deletar contato
  const deletarContato = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fornecedor_contatos')
        .update({ ativo: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedor-contatos', fornecedorId] });
      queryClient.invalidateQueries({ queryKey: ['aniversariantes-fornecedores-mes'] });
      toast.success('Contato removido com sucesso!');
    }
  });

  const limparFormularioContato = () => {
    setContatoAtual({
      nome: '',
      cargo: '',
      email: '',
      data_aniversario: '',
      observacoes: ''
    });
    setIsEditingContato(false);
  };

  const editarContato = (contato: any) => {
    setContatoAtual(contato);
    setIsEditingContato(true);
    setShowContatoForm(true);
  };

  const proximoAniversario = (dataNascimento: string) => {
    if (!dataNascimento) return null;
    
    const hoje = new Date();
    const nascimento = new Date(dataNascimento + 'T00:00:00');
    const anoAtual = hoje.getFullYear();
    const aniversarioEsteAno = new Date(anoAtual, nascimento.getMonth(), nascimento.getDate());
    
    if (aniversarioEsteAno < hoje) {
      aniversarioEsteAno.setFullYear(anoAtual + 1);
    }
    
    const diff = aniversarioEsteAno.getTime() - hoje.getTime();
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    return dias;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData?.nome ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </DialogTitle>
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
                onValueChange={(value: 'PF' | 'PJ') => setFormData({ ...formData, tipo: value })}
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
                onChange={(e) =>
                  setFormData({ ...formData, data_aniversario_contato: e.target.value })
                }
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
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {initialData?.nome ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>

        {/* Seção de Contatos - só exibe se fornecedor já existe */}
        {fornecedorId && (
          <div className="mt-6 space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Contatos do Fornecedor
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  limparFormularioContato();
                  setShowContatoForm(!showContatoForm);
                }}
              >
                <Plus className="h-3 w-3 mr-2" />
                {showContatoForm ? 'Cancelar' : 'Adicionar Contato'}
              </Button>
            </div>

            {/* Formulário de Contato */}
            {showContatoForm && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    {isEditingContato ? 'Editar Contato' : 'Novo Contato'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contato_nome">Nome *</Label>
                      <Input
                        id="contato_nome"
                        value={contatoAtual.nome}
                        onChange={(e) => setContatoAtual({ ...contatoAtual, nome: e.target.value })}
                        placeholder="Nome completo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contato_cargo">Cargo</Label>
                      <Input
                        id="contato_cargo"
                        value={contatoAtual.cargo}
                        onChange={(e) => setContatoAtual({ ...contatoAtual, cargo: e.target.value })}
                        placeholder="Ex: Gerente, Vendedor..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contato_email">E-mail</Label>
                      <Input
                        id="contato_email"
                        type="email"
                        value={contatoAtual.email}
                        onChange={(e) => setContatoAtual({ ...contatoAtual, email: e.target.value })}
                        placeholder="email@exemplo.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contato_data_aniversario">Data de Aniversário</Label>
                      <Input
                        id="contato_data_aniversario"
                        type="date"
                        value={contatoAtual.data_aniversario}
                        onChange={(e) => setContatoAtual({ ...contatoAtual, data_aniversario: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="contato_observacoes">Observações</Label>
                      <Textarea
                        id="contato_observacoes"
                        value={contatoAtual.observacoes}
                        onChange={(e) => setContatoAtual({ ...contatoAtual, observacoes: e.target.value })}
                        placeholder="Ex: Melhor horário para contato, preferências..."
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    {isEditingContato && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          limparFormularioContato();
                          setShowContatoForm(false);
                        }}
                      >
                        Cancelar
                      </Button>
                    )}
                    <Button
                      type="button"
                      onClick={() => salvarContato.mutate(contatoAtual)}
                      disabled={!contatoAtual.nome}
                    >
                      Salvar Contato
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista de Contatos */}
            {contatos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Contatos Cadastrados ({contatos.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Aniversário</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contatos.map((contato: any) => {
                        const dias = proximoAniversario(contato.data_aniversario);
                        return (
                          <TableRow key={contato.id}>
                            <TableCell className="font-medium">{contato.nome}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{contato.cargo || '-'}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">{contato.email || "-"}</TableCell>
                            <TableCell className="text-sm">
                              {contato.data_aniversario ? (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(contato.data_aniversario + 'T00:00:00').toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit'
                                  })}
                                  {dias !== null && (
                                    <Badge 
                                      variant={dias <= 7 ? 'default' : dias <= 30 ? 'secondary' : 'outline'}
                                      className="text-xs ml-1"
                                    >
                                      {dias === 0 ? '🎉' : dias === 1 ? '⭐' : `${dias}d`}
                                    </Badge>
                                  )}
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editarContato(contato)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm('Remover este contato?')) {
                                      deletarContato.mutate(contato.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {contatos.length === 0 && !showContatoForm && (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum contato cadastrado ainda.</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
