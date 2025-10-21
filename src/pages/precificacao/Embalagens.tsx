import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Check, ChevronsUpDown, Info, Download, Search, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { BackButton } from '@/components/BackButton';
import { PageHeader } from '@/components/PageHeader';

export default function Embalagens() {
  const { toast } = useToast();
  const [embalagens, setEmbalagens] = useState<any[]>([]);
  const [tiposDisponiveis, setTiposDisponiveis] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Busca e filtro
  const [termoBusca, setTermoBusca] = useState('');
  
  // Modal cadastro embalagem
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [tipoSelecionado, setTipoSelecionado] = useState('');
  const [marca, setMarca] = useState('');
  const [preco, setPreco] = useState('');
  const [popoverAberto, setPopoverAberto] = useState(false);
  const [termoBuscaTipo, setTermoBuscaTipo] = useState('');
  
  // Modal criar tipo na hora
  const [modalCriarTipoAberto, setModalCriarTipoAberto] = useState(false);
  const [novoTipoDescricao, setNovoTipoDescricao] = useState('');
  const [novoTipoQuantidade, setNovoTipoQuantidade] = useState('');
  const [novoTipoUnidadeId, setNovoTipoUnidadeId] = useState('');

  useEffect(() => {
    fetchEmbalagens();
    fetchTiposDisponiveis();
    fetchUnidades();
  }, []);

  const fetchEmbalagens = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('embalagens')
        .select(`
          *,
          tipo_insumo:tipos_insumos (
            id,
            descricao,
            quantidade_embalagem,
            pre_preparo_id,
            unidade_medida:unidades_medida (
              nome,
              sigla
            )
          )
        `)
        .eq('usuario_id', user.id);

      if (error) throw error;
      
      // Ordenar alfabeticamente pela descrição do tipo de insumo
      const sortedData = (data || []).sort((a, b) => {
        const nomeA = a.tipo_insumo?.descricao?.toLowerCase() || '';
        const nomeB = b.tipo_insumo?.descricao?.toLowerCase() || '';
        return nomeA.localeCompare(nomeB, 'pt-BR');
      });
      
      setEmbalagens(sortedData);
    } catch (error) {
      console.error('Erro ao buscar embalagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTiposDisponiveis = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tipos_insumos')
        .select(`
          id,
          descricao,
          quantidade_embalagem,
          unidade_medida:unidades_medida (
            id,
            nome,
            sigla
          )
        `)
        .eq('usuario_id', user.id)
        .eq('tipo', 'embalagem')
        .order('descricao');

      if (error) throw error;
      setTiposDisponiveis(data || []);
    } catch (error) {
      console.error('Erro ao buscar tipos:', error);
    }
  };

  const fetchUnidades = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('unidades_medida')
        .select('id, nome, sigla')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setUnidades(data || []);
    } catch (error) {
      console.error('Erro ao buscar unidades:', error);
    }
  };

  // Filtrar embalagens pela busca
  const embalagensFiltradas = useMemo(() => {
    if (!termoBusca.trim()) return embalagens;

    const termo = termoBusca.toLowerCase();
    return embalagens.filter((embalagem: any) => {
      const nomeEmbalagem = embalagem.tipo_insumo?.descricao?.toLowerCase() || '';
      const marcaEmbalagem = embalagem.marca?.toLowerCase() || '';
      return nomeEmbalagem.includes(termo) || marcaEmbalagem.includes(termo);
    });
  }, [embalagens, termoBusca]);

  // Verificar se preço está desatualizado (>30 dias)
  const verificarDesatualizado = (dataAtualizacao: string) => {
    const hoje = new Date();
    const dataAtualizacaoObj = new Date(dataAtualizacao + 'T00:00:00');
    const diferencaDias = Math.floor((hoje.getTime() - dataAtualizacaoObj.getTime()) / (1000 * 60 * 60 * 24));
    return diferencaDias > 30;
  };

  // Exportar para Excel
  const handleExportarExcel = () => {
    try {
      const dadosExport = embalagensFiltradas.map((embalagem: any) => ({
        'Embalagem': embalagem.tipo_insumo?.descricao || 'N/A',
        'Marca': embalagem.marca || 'Sem marca',
        'Quantidade': embalagem.tipo_insumo?.quantidade_embalagem || 0,
        'Unidade': embalagem.tipo_insumo?.unidade_medida?.sigla || 'N/A',
        'Preço (R$)': embalagem.preco.toFixed(2).replace('.', ','),
        'Data Atualização': formatarData(embalagem.data_atualizacao),
        'Status': verificarDesatualizado(embalagem.data_atualizacao) ? 'Desatualizado' : 'Atualizado'
      }));

      const ws = XLSX.utils.json_to_sheet(dadosExport);
      
      // Ajustar largura das colunas
      const colWidths = [
        { wch: 25 }, // Embalagem
        { wch: 20 }, // Marca
        { wch: 12 }, // Quantidade
        { wch: 10 }, // Unidade
        { wch: 12 }, // Preço
        { wch: 15 }, // Data
        { wch: 15 }, // Status
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Embalagens');
      
      const hoje = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Embalagens_${hoje}.xlsx`);

      toast({
        title: '✅ Exportado',
        description: 'Planilha de embalagens exportada com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar a planilha.',
        variant: 'destructive',
      });
    }
  };

  const handleAbrirModal = (embalagem: any = null) => {
    if (embalagem) {
      // Verificar se é pré-preparo (embalagens não deveriam ter, mas por garantia)
      const ePrePreparo = embalagem.tipo_insumo?.pre_preparo_id;
      
      if (ePrePreparo) {
        toast({
          title: 'Não editável',
          description: 'Este item é vinculado a um pré-preparo.',
          variant: 'destructive',
        });
        return;
      }
      
      setEditando(embalagem);
      setTipoSelecionado(embalagem.tipo_insumo_id);
      setMarca(embalagem.marca || '');
      setPreco(embalagem.preco.toString().replace('.', ','));
    } else {
      setEditando(null);
      setTipoSelecionado('');
      setMarca('');
      setPreco('');
    }
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    try {
      if (!tipoSelecionado) {
        toast({
          title: 'Erro',
          description: 'Selecione o tipo de embalagem!',
          variant: 'destructive',
        });
        return;
      }

      const precoNum = parseFloat(preco.replace(',', '.'));
      if (!precoNum || precoNum <= 0) {
        toast({
          title: 'Erro',
          description: 'Informe um preço válido!',
          variant: 'destructive',
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      if (editando) {
        const { error } = await supabase
          .from('embalagens')
          .update({
            marca: marca.trim() || null,
            preco: precoNum,
            data_atualizacao: new Date().toISOString().split('T')[0],
          })
          .eq('id', editando.id);

        if (error) throw error;

        toast({
          title: '✅ Atualizado',
          description: 'Embalagem atualizada com sucesso!',
        });
      } else {
        const { error } = await supabase
          .from('embalagens')
          .insert({
            usuario_id: user.id,
            tipo_insumo_id: tipoSelecionado,
            marca: marca.trim() || null,
            preco: precoNum,
            data_atualizacao: new Date().toISOString().split('T')[0],
          });

        if (error) {
          if (error.code === '23505') {
            throw new Error('Este tipo já foi cadastrado em embalagens!');
          }
          throw error;
        }

        toast({
          title: '✅ Cadastrado',
          description: 'Embalagem cadastrada com sucesso!',
        });
      }

      setModalAberto(false);
      fetchEmbalagens();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Criar tipo na hora
  const handleAbrirCriarTipo = () => {
    setNovoTipoDescricao(termoBuscaTipo);
    setNovoTipoQuantidade('');
    setNovoTipoUnidadeId('');
    setModalCriarTipoAberto(true);
    setPopoverAberto(false);
  };

  const handleSalvarNovoTipo = async () => {
    try {
      if (!novoTipoDescricao.trim() || !novoTipoQuantidade || !novoTipoUnidadeId) {
        toast({
          title: 'Erro',
          description: 'Preencha todos os campos!',
          variant: 'destructive',
        });
        return;
      }

      const qtd = parseFloat(novoTipoQuantidade.replace(',', '.'));
      if (qtd <= 0) {
        toast({
          title: 'Erro',
          description: 'Quantidade deve ser maior que zero!',
          variant: 'destructive',
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('tipos_insumos')
        .insert({
          usuario_id: user.id,
          tipo: 'embalagem',
          descricao: novoTipoDescricao.trim(),
          quantidade_embalagem: qtd,
          unidade_medida_id: novoTipoUnidadeId,
        })
        .select(`
          id,
          descricao,
          quantidade_embalagem,
          unidade_medida:unidades_medida (
            id,
            nome,
            sigla
          )
        `)
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Este tipo já foi cadastrado!');
        }
        throw error;
      }

      toast({
        title: '✅ Tipo cadastrado',
        description: 'Novo tipo criado com sucesso! Agora você pode usá-lo.',
      });

      // Atualizar lista de tipos
      await fetchTiposDisponiveis();

      // Selecionar o tipo recém-criado automaticamente
      setTipoSelecionado(data.id);

      // Fechar modal de criar tipo
      setModalCriarTipoAberto(false);

      // Limpar busca
      setTermoBuscaTipo('');

    } catch (error: any) {
      console.error('Erro ao criar tipo:', error);
      toast({
        title: 'Erro ao criar tipo',
        description: error.message,
        variant: 'destructive',
      });
    }
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

  const tipoSelecionadoObj = tiposDisponiveis.find((t: any) => t.id === tipoSelecionado);
  
  // Filtrar tipos pelo termo de busca (excluindo pré-preparos)
  const tiposFiltrados = tiposDisponiveis.filter((tipo: any) => {
    // Não mostrar tipos que são pré-preparos
    if (tipo.pre_preparo_id) return false;
    
    // Filtrar pela busca
    return tipo.descricao.toLowerCase().includes(termoBuscaTipo.toLowerCase());
  });

  // Contar embalagens desatualizadas
  const qtdDesatualizados = embalagens.filter((e: any) => 
    verificarDesatualizado(e.data_atualizacao)
  ).length;

  if (loading) return <div className="flex justify-center p-8">Carregando...</div>;

  return (
    <div className="space-y-6">
      <BackButton to="/precificacao" />
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <PageHeader
          title="Embalagens"
          description="Cadastre embalagens com marca e preço para usar em receitas"
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportarExcel}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
          <Button onClick={() => handleAbrirModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Embalagem
          </Button>
        </div>
      </div>

      {/* Alertas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription>
            Após cadastrar, você pode editar apenas a marca e o preço.
          </AlertDescription>
        </Alert>

        {qtdDesatualizados > 0 && (
          <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription>
              <strong>{qtdDesatualizados}</strong> embalagem(ns) com preço desatualizado (mais de 30 dias)
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Busca */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por embalagem ou marca..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabela */}
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
            {embalagensFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {termoBusca ? 'Nenhuma embalagem encontrada com esse termo.' : 'Nenhuma embalagem cadastrada. Clique em "Nova Embalagem".'}
                </TableCell>
              </TableRow>
            ) : (
              embalagensFiltradas.map((embalagem: any) => {
                const desatualizado = verificarDesatualizado(embalagem.data_atualizacao);
                const ePrePreparo = embalagem.e_pre_preparo || embalagem.tipo_insumo?.pre_preparo_id;
                
                return (
                  <TableRow key={embalagem.id} className={desatualizado ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {embalagem.tipo_insumo?.descricao || 'N/A'}
                        {desatualizado && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Desatualizado
                          </Badge>
                        )}
                      </div>
                    </TableCell>
      <TableCell>
        {ePrePreparo ? (
          <span className="font-semibold text-purple-700">Pré-Preparo</span>
        ) : (
          embalagem.marca || <span className="text-muted-foreground italic">Sem marca</span>
        )}
      </TableCell>
                    <TableCell>
                      {embalagem.tipo_insumo?.quantidade_embalagem?.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {embalagem.tipo_insumo?.unidade_medida?.nome || 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatarPreco(embalagem.preco)}
                    </TableCell>
                    <TableCell className={desatualizado ? 'text-amber-700 font-medium dark:text-amber-400' : ''}>
                      {formatarData(embalagem.data_atualizacao)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAbrirModal(embalagem)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Cadastro/Edição Embalagem */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Embalagem' : 'Nova Embalagem'}</DialogTitle>
            <DialogDescription>
              {editando ? 'Você pode alterar marca e preço' : 'Selecione o tipo e informe marca e preço'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Picklist Tipo */}
            {!editando && (
              <div className="space-y-2">
                <Label>Tipo de Embalagem *</Label>
                <Popover open={popoverAberto} onOpenChange={setPopoverAberto}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={popoverAberto}
                      className="w-full justify-between"
                    >
                      {tipoSelecionadoObj ? (
                        <span>
                          {tipoSelecionadoObj.descricao} ({tipoSelecionadoObj.quantidade_embalagem.toLocaleString('pt-BR')}{' '}
                          {tipoSelecionadoObj.unidade_medida.sigla})
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Buscar tipo de embalagem...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Buscar tipo..." 
                        value={termoBuscaTipo}
                        onValueChange={setTermoBuscaTipo}
                      />
                      <CommandEmpty>
                        <div className="p-4 text-center space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Tipo não encontrado.
                          </p>
                          <Button
                            size="sm"
                            onClick={handleAbrirCriarTipo}
                            className="w-full"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Criar Novo Tipo "{termoBuscaTipo}"
                          </Button>
                        </div>
                      </CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {tiposFiltrados.map((tipo: any) => (
                          <CommandItem
                            key={tipo.id}
                            value={tipo.id}
                            onSelect={() => {
                              setTipoSelecionado(tipo.id);
                              setPopoverAberto(false);
                              setTermoBuscaTipo('');
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                tipoSelecionado === tipo.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{tipo.descricao}</span>
                              <span className="text-sm text-muted-foreground">
                                {tipo.quantidade_embalagem.toLocaleString('pt-BR')}{' '}
                                {tipo.unidade_medida.sigla}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Dados auto-preenchidos (edição) */}
            {editando && tipoSelecionadoObj && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground">Embalagem</Label>
                <p className="font-medium">
                  {tipoSelecionadoObj.descricao} ({tipoSelecionadoObj.quantidade_embalagem.toLocaleString('pt-BR')}{' '}
                  {tipoSelecionadoObj.unidade_medida.sigla})
                </p>
              </div>
            )}

            {/* Marca */}
            <div className="space-y-2">
              <Label htmlFor="marca">Marca (opcional)</Label>
              <Input
                id="marca"
                placeholder="Ex: Fábrica de Embalagens..."
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
              />
            </div>

            {/* Preço */}
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar}>
              {editando ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Criar Tipo Na Hora */}
      <Dialog open={modalCriarTipoAberto} onOpenChange={setModalCriarTipoAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Tipo de Embalagem</DialogTitle>
            <DialogDescription>
              Cadastre o tipo base que será usado em Configurações e aqui
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="novo-tipo-descricao">Descrição *</Label>
              <Input
                id="novo-tipo-descricao"
                placeholder="Ex: Caixa de Papelão"
                value={novoTipoDescricao}
                onChange={(e) => setNovoTipoDescricao(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="novo-tipo-quantidade">Quantidade na Embalagem *</Label>
              <Input
                id="novo-tipo-quantidade"
                type="text"
                placeholder="Ex: 1"
                value={novoTipoQuantidade}
                onChange={(e) => {
                  const valor = e.target.value.replace(/[^\d,]/g, '');
                  setNovoTipoQuantidade(valor);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="novo-tipo-unidade">Unidade de Medida *</Label>
              <Select value={novoTipoUnidadeId} onValueChange={setNovoTipoUnidadeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((unidade: any) => (
                    <SelectItem key={unidade.id} value={unidade.id}>
                      {unidade.nome} ({unidade.sigla})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-sm">
                Este tipo será salvo em Configurações e ficará disponível para usar aqui.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalCriarTipoAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarNovoTipo}>
              Criar Tipo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
