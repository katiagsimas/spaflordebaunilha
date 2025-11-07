import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Users, Calendar, Cake } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Familiar {
  id?: string;
  nome: string;
  parentesco: string;
  data_nascimento: string;
  observacoes?: string;
}

interface FamiliaresManagerProps {
  clienteId: string | null;
  isNewCliente?: boolean;
}

export function FamiliaresManager({ clienteId, isNewCliente = false }: FamiliaresManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddAnotherDialog, setShowAddAnotherDialog] = useState(false);
  const [familiarAtual, setFamiliarAtual] = useState<Familiar>({
    nome: '',
    parentesco: '',
    data_nascimento: '',
    observacoes: ''
  });
  const queryClient = useQueryClient();

  // Buscar familiares
  const { data: familiares, isLoading } = useQuery({
    queryKey: ['familiares', clienteId],
    queryFn: async () => {
      if (!clienteId) return [];
      
      const { data, error } = await supabase
        .from('cliente_familiares')
        .select('*')
        .eq('cliente_id', clienteId)
        .eq('ativo', true)
        .order('data_nascimento');

      if (error) throw error;
      return data || [];
    },
    enabled: !!clienteId
  });

  // Mutation para salvar familiar
  const salvarFamiliar = useMutation({
    mutationFn: async (familiar: Familiar) => {
      if (!clienteId) throw new Error('Cliente não selecionado');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const dados = {
        usuario_id: user.id,
        cliente_id: clienteId,
        nome: familiar.nome,
        parentesco: familiar.parentesco,
        data_nascimento: familiar.data_nascimento,
        observacoes: familiar.observacoes || null
      };

      if (familiar.id) {
        // Atualizar
        const { error } = await supabase
          .from('cliente_familiares')
          .update(dados)
          .eq('id', familiar.id);
        if (error) throw error;
      } else {
        // Inserir
        const { error } = await supabase
          .from('cliente_familiares')
          .insert([dados]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familiares', clienteId] });
      toast.success(isEditing ? "Familiar atualizado!" : "Familiar salvo!");
      limparFormulario();
      
      if (!isEditing) {
        setShowAddAnotherDialog(true);
      } else {
        setIsOpen(false);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao salvar familiar');
    }
  });

  // Mutation para deletar familiar
  const deletarFamiliar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cliente_familiares')
        .update({ ativo: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familiares', clienteId] });
      toast.success('Familiar removido com sucesso!');
    }
  });

  const limparFormulario = () => {
    setFamiliarAtual({
      nome: '',
      parentesco: '',
      data_nascimento: '',
      observacoes: ''
    });
    setIsEditing(false);
  };

  const handleAddAnother = () => {
    setShowAddAnotherDialog(false);
    limparFormulario();
  };

  const handleFinish = () => {
    setShowAddAnotherDialog(false);
    setIsOpen(false);
  };

  const editarFamiliar = (familiar: any) => {
    setFamiliarAtual(familiar);
    setIsEditing(true);
  };

  const calcularIdade = (dataNascimento: string) => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const proximoAniversario = (dataNascimento: string) => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    const anoAtual = hoje.getFullYear();
    const aniversarioEsteAno = new Date(anoAtual, nascimento.getMonth(), nascimento.getDate());
    
    if (aniversarioEsteAno < hoje) {
      aniversarioEsteAno.setFullYear(anoAtual + 1);
    }
    
    const diff = aniversarioEsteAno.getTime() - hoje.getTime();
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    return dias;
  };

  // Se é cliente novo, não exibir nada
  if (isNewCliente || !clienteId) {
    return null;
  }

  // Se já tem cliente salvo, mostrar botão
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              limparFormulario();
              setIsOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            + Adicionar Familiar
          </Button>
        </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciar Familiares
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* FORMULÁRIO */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isEditing ? 'Editar Familiar' : 'Adicionar Novo Familiar'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={familiarAtual.nome}
                    onChange={(e) => setFamiliarAtual({ ...familiarAtual, nome: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentesco">Parentesco *</Label>
                  <Input
                    id="parentesco"
                    value={familiarAtual.parentesco}
                    onChange={(e) => setFamiliarAtual({ ...familiarAtual, parentesco: e.target.value })}
                    placeholder="Ex: Filho(a), Esposo(a), Mãe, Pai"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_nascimento">Data de Aniversário *</Label>
                  <Input
                    id="data_nascimento"
                    type="date"
                    value={familiarAtual.data_nascimento}
                    onChange={(e) => setFamiliarAtual({ ...familiarAtual, data_nascimento: e.target.value })}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={familiarAtual.observacoes}
                    onChange={(e) => setFamiliarAtual({ ...familiarAtual, observacoes: e.target.value })}
                    placeholder="Ex: Gosta de chocolate, alérgico a amendoim..."
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => salvarFamiliar.mutate(familiarAtual)}
                  disabled={!familiarAtual.nome || !familiarAtual.parentesco || !familiarAtual.data_nascimento}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isEditing ? 'Atualizar' : 'Salvar Familiar'}
                </Button>
                {isEditing && (
                  <Button variant="outline" onClick={() => {
                    limparFormulario();
                    setIsEditing(false);
                  }}>
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* LISTA DE FAMILIARES */}
          {familiares && familiares.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Familiares Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Parentesco</TableHead>
                      <TableHead>Idade</TableHead>
                      <TableHead>Aniversário</TableHead>
                      <TableHead>Próximo em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {familiares.map((familiar) => {
                      const dias = proximoAniversario(familiar.data_nascimento);
                      return (
                        <TableRow key={familiar.id}>
                          <TableCell className="font-medium">{familiar.nome}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {familiar.parentesco === 'filho' && '👶'}
                              {familiar.parentesco === 'conjuge' && '💑'}
                              {familiar.parentesco === 'pai' && '👨'}
                              {familiar.parentesco === 'mae' && '👩'}
                              {familiar.parentesco === 'irmao' && '👫'}
                              {' '}{familiar.parentesco}
                            </Badge>
                          </TableCell>
                          <TableCell>{calcularIdade(familiar.data_nascimento)} anos</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(familiar.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit'
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={dias <= 7 ? 'default' : dias <= 30 ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {dias === 0 ? '🎉 HOJE!' : 
                               dias === 1 ? '⭐ Amanhã' :
                               `${dias} dias`}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => editarFamiliar(familiar)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Remover este familiar?')) {
                                    deletarFamiliar.mutate(familiar.id);
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

          {familiares && familiares.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum familiar cadastrado ainda.</p>
              <p className="text-sm">Use o formulário acima para adicionar.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* AlertDialog para adicionar outro familiar */}
    <AlertDialog open={showAddAnotherDialog} onOpenChange={setShowAddAnotherDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Adicionar Outro Familiar?</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja adicionar mais um familiar para este cliente?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleFinish}>Não</AlertDialogCancel>
          <AlertDialogAction onClick={handleAddAnother}>Sim</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
