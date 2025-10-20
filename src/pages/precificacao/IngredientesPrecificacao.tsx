import { useState, useEffect } from 'react';
import { useIngredientesPrecificacao } from '@/hooks/useIngredientesPrecificacao';
import { useTiposInsumos } from '@/hooks/useTiposInsumos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { TipoInsumoAutocomplete } from '@/components/TipoInsumoAutocomplete';
import { Plus, Edit, Info, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';

export default function IngredientesPrecificacao() {
  const { ingredientes, loading, createIngrediente, updateIngrediente, refetch } = useIngredientesPrecificacao();
  const { tiposInsumos, isLoading: loadingTipos } = useTiposInsumos();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState('');
  const [marca, setMarca] = useState('');
  const [preco, setPreco] = useState('');
  
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [ingredienteEditando, setIngredienteEditando] = useState<any>(null);
  const [tipoEdicao, setTipoEdicao] = useState('');
  const [marcaEdicao, setMarcaEdicao] = useState('');
  const [precoEdicao, setPrecoEdicao] = useState('');
  
  const [dadosTipoSelecionado, setDadosTipoSelecionado] = useState<any>(null);

  // Tipos já vêm filtrados (apenas ativos) do hook useTiposInsumos
  const tiposAtivos = tiposInsumos;

  // Debug: mostrar tipos carregados
  useEffect(() => {
    console.log('═══════════════════════════════════════');
    console.log('🔍 PÁGINA DE INGREDIENTES - DEBUG');
    console.log('═══════════════════════════════════════');
    console.log(' ');
    
    console.log('📋 TIPOS CARREGADOS:');
    console.log('Total de tipos:', tiposInsumos?.length);
    console.log('Lista completa:', tiposInsumos);
    console.log(' ');
    console.log('✅ TIPOS ATIVOS (que devem aparecer no picklist):');
    const ativos = tiposInsumos?.filter(t => t.ativo === true) || [];
    console.log('Total de ativos:', ativos.length);
    ativos.forEach(tipo => {
      console.log('  ✓', tipo.descricao);
    });
    console.log(' ');
    console.log('❌ TIPOS INATIVOS (que NÃO devem aparecer):');
    const inativos = tiposInsumos?.filter(t => t.ativo === false) || [];
    console.log('Total de inativos:', inativos.length);
    inativos.forEach(tipo => {
      console.log('  ✗', tipo.descricao);
    });
    console.log('═══════════════════════════════════════');
  }, [tiposInsumos]);

  useEffect(() => {
    if (tipoSelecionado) {
      const tipo = tiposAtivos.find(t => t.id === tipoSelecionado);
      setDadosTipoSelecionado(tipo || null);
    } else {
      setDadosTipoSelecionado(null);
    }
  }, [tipoSelecionado, tiposAtivos]);

  const handleAbrirModalCadastro = () => {
    setTipoSelecionado('');
    setMarca('');
    setPreco('');
    setDadosTipoSelecionado(null);
    setModalCadastroAberto(true);
  };

  const handleCadastrar = async () => {
    try {
      if (!tipoSelecionado) {
        toast({
          title: 'Erro',
          description: 'Selecione o tipo de ingrediente.',
          variant: 'destructive',
        });
        return;
      }

      // Validação adicional: verificar se tipo ainda está ativo
      const tipoEscolhido = tiposAtivos.find(t => t.id === tipoSelecionado);
      
      if (!tipoEscolhido) {
        toast({
          title: 'Erro',
          description: 'O tipo selecionado não está mais disponível. Por favor, selecione outro.',
          variant: 'destructive',
        });
        setTipoSelecionado('');
        return;
      }

      const precoNum = parseFloat(preco.replace(',', '.'));
      if (!precoNum || precoNum <= 0) {
        toast({
          title: 'Erro',
          description: 'Informe um preço válido.',
          variant: 'destructive',
        });
        return;
      }

      await createIngrediente({
        tipo_insumo_id: tipoSelecionado,
        marca: marca || undefined,
        preco: precoNum,
      });

      setModalCadastroAberto(false);
      refetch();

    } catch (error: any) {
      console.error('Erro ao cadastrar:', error);
      toast({
        title: 'Erro ao Cadastrar',
        description: error.message || 'Não foi possível cadastrar o ingrediente.',
        variant: 'destructive',
        duration: 6000,
      });
    }
  };

  const handleAbrirEdicao = (ingrediente: any) => {
    setIngredienteEditando(ingrediente);
    setTipoEdicao(ingrediente.tipo_insumo_id || '');
    setMarcaEdicao(ingrediente.marca || '');
    setPrecoEdicao(ingrediente.preco.toString().replace('.', ','));
    setModalEdicaoAberto(true);
  };

  const handleAtualizar = async () => {
    try {
      const precoNum = parseFloat(precoEdicao.replace(',', '.'));
      if (!precoNum || precoNum <= 0) {
        toast({
          title: 'Erro',
          description: 'Informe um preço válido.',
          variant: 'destructive',
        });
        return;
      }

      await updateIngrediente(ingredienteEditando.id, {
        marca: marcaEdicao || undefined,
        preco: precoNum,
      });

      setModalEdicaoAberto(false);
      refetch();

    } catch (error: any) {
      console.error('Erro ao atualizar:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar.',
        variant: 'destructive',
      });
    }
  };

  const handleCriarNovoTipo = () => {
    navigate('/configuracoes/tipos-insumos');
  };

  const formatarData = (dataISO: string) => {
    const data = new Date(dataISO + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');
  };

  const formatarPreco = (preco: number) => {
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  if (loading || loadingTipos) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader title="Ingredientes" description="Gerencie ingredientes com marca e preço para usar em receitas" />

      <div className="flex justify-end">
        <Button onClick={handleAbrirModalCadastro}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Ingrediente
        </Button>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle>ℹ️ Importante</AlertTitle>
        <AlertDescription>
          Após cadastrar um ingrediente, você poderá editar apenas a <strong>marca</strong> e o <strong>preço</strong>. 
          Não é possível excluir ingredientes para manter a integridade das receitas.
        </AlertDescription>
      </Alert>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ingrediente</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Qtde Embalagem</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Data Atualização</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ingredientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum ingrediente cadastrado ainda.
                  <br />
                  Clique em "Novo Ingrediente" para começar.
                </TableCell>
              </TableRow>
            ) : (
              ingredientes.map(ingrediente => (
                <TableRow key={ingrediente.id}>
                  <TableCell className="font-medium">
                    {ingrediente.tipo_insumo?.descricao || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {ingrediente.marca || <span className="text-muted-foreground italic">Sem marca</span>}
                  </TableCell>
                  <TableCell>
                    {ingrediente.tipo_insumo?.quantidade_embalagem.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {ingrediente.tipo_insumo?.unidade_medida?.sigla || 'N/A'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatarPreco(ingrediente.preco)}
                  </TableCell>
                  <TableCell>
                    {formatarData(ingrediente.data_atualizacao)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAbrirEdicao(ingrediente)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Cadastro */}
      <Dialog open={modalCadastroAberto} onOpenChange={setModalCadastroAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Ingrediente</DialogTitle>
            <DialogDescription>
              Selecione o tipo e informe marca e preço
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <TipoInsumoAutocomplete
              onSelect={(tipo) => setTipoSelecionado(tipo.id)}
              value={tipoSelecionado}
              onAfterCreate={() => {
                refetch();
                handleAbrirModalCadastro();
              }}
            />

            {dadosTipoSelecionado && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Ingrediente</Label>
                  <p className="font-medium">{dadosTipoSelecionado.descricao}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Quantidade na Embalagem</Label>
                  <p className="font-medium">
                    {dadosTipoSelecionado.quantidade_embalagem.toLocaleString('pt-BR')}{' '}
                    {dadosTipoSelecionado.unidade_medida?.sigla}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="marca">Marca (opcional)</Label>
              <Input
                id="marca"
                placeholder="Ex: Rosa Branca, Dona Benta..."
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco">Preço *</Label>
              <Input
                id="preco"
                type="text"
                placeholder="Ex: 5,50"
                value={preco}
                onChange={(e) => {
                  const valor = e.target.value.replace(/[^\d,]/g, '');
                  setPreco(valor);
                }}
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                A data de atualização será definida automaticamente como <strong>hoje</strong>.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalCadastroAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCadastrar}>
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={modalEdicaoAberto} onOpenChange={setModalEdicaoAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Ingrediente</DialogTitle>
            <DialogDescription>
              Você pode alterar apenas marca e preço
            </DialogDescription>
          </DialogHeader>

          {ingredienteEditando && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de Ingrediente</Label>
                <TipoInsumoAutocomplete
                  onSelect={(tipo) => setTipoEdicao(tipo.id)}
                  value={tipoEdicao}
                  onAfterCreate={() => {
                    refetch();
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Este campo não pode ser alterado para manter a integridade das receitas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marca-edicao">Marca</Label>
                <Input
                  id="marca-edicao"
                  placeholder="Ex: Rosa Branca..."
                  value={marcaEdicao}
                  onChange={(e) => setMarcaEdicao(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preco-edicao">Preço *</Label>
                <Input
                  id="preco-edicao"
                  type="text"
                  placeholder="Ex: 5,50"
                  value={precoEdicao}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/[^\d,]/g, '');
                    setPrecoEdicao(valor);
                  }}
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  A data de atualização será atualizada automaticamente para <strong>hoje</strong> ao salvar.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEdicaoAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAtualizar}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
