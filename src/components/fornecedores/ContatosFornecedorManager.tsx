import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Contato {
  id?: string;
  nome: string;
  cargo: string;
  email: string;
  data_aniversario: string;
  observacoes?: string;
}

interface ContatosFornecedorManagerProps {
  fornecedorId: string | null;
  isNewFornecedor?: boolean;
  setIsContatoDialogOpen?: (open: boolean) => void;
}

export function ContatosFornecedorManager({ fornecedorId, isNewFornecedor = false, setIsContatoDialogOpen }: ContatosFornecedorManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddAnotherDialog, setShowAddAnotherDialog] = useState(false);
  const [contatoAtual, setContatoAtual] = useState<Contato>({
    nome: '',
    cargo: '',
    email: '',
    data_aniversario: '',
    observacoes: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar contatos
  const { data: contatos } = useQuery({
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
      toast({
        title: 'Contato Salvo',
        description: 'Contato salvo com sucesso!',
      });
      
      if (!isEditing) {
        setShowAddAnotherDialog(true);
      } else {
        limparFormulario();
      }
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
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
      toast({
        title: 'Contato removido',
        description: 'Contato removido com sucesso.',
      });
    }
  });

  const limparFormulario = () => {
    setContatoAtual({
      nome: '',
      cargo: '',
      email: '',
      data_aniversario: '',
      observacoes: ''
    });
    setIsEditing(false);
  };

  const handleAddAnother = (addAnother: boolean) => {
    setShowAddAnotherDialog(false);
    
    if (addAnother) {
      limparFormulario();
    } else {
      limparFormulario();
      setIsOpen(false);
      setIsContatoDialogOpen?.(false); // Fecha o dialog pai se existir
    }
  };

  const editarContato = (contato: any) => {
    setContatoAtual(contato);
    setIsEditing(true);
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

  // Se é fornecedor novo, não mostrar nada
  if (isNewFornecedor || !fornecedorId) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Users className="h-4 w-4 mr-2" />
            + Adicionar Contato {contatos && contatos.length > 0 && `(${contatos.length})`}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciar Contatos
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* FORMULÁRIO */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {isEditing ? 'Editar Contato' : 'Novo Contato'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={contatoAtual.nome}
                      onChange={(e) => setContatoAtual({ ...contatoAtual, nome: e.target.value })}
                      placeholder="Nome completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cargo">Cargo</Label>
                    <Input
                      id="cargo"
                      value={contatoAtual.cargo}
                      onChange={(e) => setContatoAtual({ ...contatoAtual, cargo: e.target.value })}
                      placeholder="Ex: Gerente, Vendedor..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contatoAtual.email}
                      onChange={(e) => setContatoAtual({ ...contatoAtual, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data_aniversario">Data de Aniversário</Label>
                    <Input
                      id="data_aniversario"
                      type="date"
                      value={contatoAtual.data_aniversario}
                      onChange={(e) => setContatoAtual({ ...contatoAtual, data_aniversario: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={contatoAtual.observacoes}
                      onChange={(e) => setContatoAtual({ ...contatoAtual, observacoes: e.target.value })}
                      placeholder="Ex: Melhor horário para contato, preferências..."
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  {isEditing && (
                    <Button variant="outline" onClick={() => {
                      limparFormulario();
                    }}>
                      Cancelar
                    </Button>
                  )}
                  <Button
                    onClick={() => salvarContato.mutate(contatoAtual)}
                    disabled={!contatoAtual.nome}
                  >
                    Salvar Contato
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* LISTA DE CONTATOS */}
            {contatos && contatos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contatos Cadastrados</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Aniversário</TableHead>
                        <TableHead>Próximo em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contatos.map((contato) => {
                        const dias = proximoAniversario(contato.data_aniversario);
                        return (
                          <TableRow key={contato.id}>
                            <TableCell className="font-medium">{contato.nome}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{contato.cargo || '-'}</Badge>
                            </TableCell>
                            <TableCell>{contato.email || "-"}</TableCell>
                            <TableCell>
                              {contato.data_aniversario ? (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(contato.data_aniversario + 'T00:00:00').toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit'
                                  })}
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              {dias !== null ? (
                                <Badge 
                                  variant={dias <= 7 ? 'default' : dias <= 30 ? 'secondary' : 'outline'}
                                  className="text-xs"
                                >
                                  {dias === 0 ? '🎉 HOJE!' : 
                                   dias === 1 ? '⭐ Amanhã' :
                                   `${dias} dias`}
                                </Badge>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editarContato(contato)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
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

            {contatos && contatos.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum contato cadastrado ainda.</p>
                <p className="text-sm">Preencha o formulário acima para adicionar o primeiro contato.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE CONFIRMAÇÃO: ADICIONAR OUTRO CONTATO? */}
      <AlertDialog open={showAddAnotherDialog} onOpenChange={setShowAddAnotherDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Contato Salvo com Sucesso!</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja adicionar outro contato?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleAddAnother(false)}>
              Não
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleAddAnother(true)}>
              Sim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
