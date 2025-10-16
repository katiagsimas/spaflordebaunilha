import { useState, useEffect } from 'react';
import { useEmbalagensPrecificacao } from '@/hooks/useEmbalagensPrecificacao';
import { useTiposEmbalagens } from '@/hooks/useTiposEmbalagens';
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
import { TipoEmbalagemAutocomplete } from '@/components/TipoEmbalagemAutocomplete';
import { Plus, Edit, Info, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';

export default function EmbalagensPrecificacao() {
  const { embalagens, loading, createEmbalagem, updateEmbalagem, refetch } = useEmbalagensPrecificacao();
  const { tiposEmbalagens, isLoading: loadingTipos } = useTiposEmbalagens();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState('');
  const [marca, setMarca] = useState('');
  const [preco, setPreco] = useState('');
  
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [embalagemEditando, setEmbalagemEditando] = useState<any>(null);
  const [marcaEdicao, setMarcaEdicao] = useState('');
  const [precoEdicao, setPrecoEdicao] = useState('');
  
  const [dadosTipoSelecionado, setDadosTipoSelecionado] = useState<any>(null);

  const tiposAtivos = tiposEmbalagens.filter(t => t.ativo);

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
          description: 'Selecione o tipo de embalagem.',
          variant: 'destructive',
        });
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

      await createEmbalagem({
        tipo_embalagem_id: tipoSelecionado,
        marca: marca || undefined,
        preco: precoNum,
      });

      setModalCadastroAberto(false);
      refetch();

    } catch (error: any) {
      console.error('Erro ao cadastrar:', error);
      toast({
        title: 'Erro ao Cadastrar',
        description: error.message || 'Não foi possível cadastrar a embalagem.',
        variant: 'destructive',
        duration: 6000,
      });
    }
  };

  const handleAbrirEdicao = (embalagem: any) => {
    setEmbalagemEditando(embalagem);
    setMarcaEdicao(embalagem.marca || '');
    setPrecoEdicao(embalagem.preco.toString().replace('.', ','));
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

      await updateEmbalagem(embalagemEditando.id, {
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
    navigate('/configuracoes/tipos-embalagens');
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
      <PageHeader title="Embalagens" description="Gerencie embalagens com marca e preço para usar em receitas" />

      <div className="flex justify-end">
        <Button onClick={handleAbrirModalCadastro}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Embalagem
        </Button>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle>ℹ️ Importante</AlertTitle>
        <AlertDescription>
          Após cadastrar uma embalagem, você poderá editar apenas a <strong>marca</strong> e o <strong>preço</strong>. 
          Não é possível excluir embalagens para manter a integridade das receitas.
        </AlertDescription>
      </Alert>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Embalagem</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Qtde Embalagem</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Data Atualização</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {embalagens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhuma embalagem cadastrada ainda.
                  <br />
                  Clique em "Nova Embalagem" para começar.
                </TableCell>
              </TableRow>
            ) : (
              embalagens.map(embalagem => (
                <TableRow key={embalagem.id}>
                  <TableCell className="font-medium">
                    {embalagem.tipo_embalagem?.descricao || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {embalagem.marca || <span className="text-muted-foreground italic">Sem marca</span>}
                  </TableCell>
                  <TableCell>
                    {embalagem.tipo_embalagem?.quantidade_embalagem.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {embalagem.tipo_embalagem?.unidade_medida?.sigla || 'N/A'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatarPreco(embalagem.preco)}
                  </TableCell>
                  <TableCell>
                    {formatarData(embalagem.data_atualizacao)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAbrirEdicao(embalagem)}
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
            <DialogTitle>Nova Embalagem</DialogTitle>
            <DialogDescription>
              Selecione o tipo e informe marca e preço
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <TipoEmbalagemAutocomplete
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
                  <Label className="text-xs text-muted-foreground">Embalagem</Label>
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
                placeholder="Ex: TampaFlex, PlastPack..."
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
            <DialogTitle>Editar Embalagem</DialogTitle>
            <DialogDescription>
              Você pode alterar apenas marca e preço
            </DialogDescription>
          </DialogHeader>

          {embalagemEditando && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground">Embalagem</Label>
                <p className="font-medium">
                  {embalagemEditando.tipo_embalagem?.descricao} ({' '}
                  {embalagemEditando.tipo_embalagem?.quantidade_embalagem.toLocaleString('pt-BR')}{' '}
                  {embalagemEditando.tipo_embalagem?.unidade_medida?.sigla})
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marca-edicao">Marca</Label>
                <Input
                  id="marca-edicao"
                  placeholder="Ex: TampaFlex..."
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
