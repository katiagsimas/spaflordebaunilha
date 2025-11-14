import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useReceitas } from '@/hooks/useReceitas';
import { useCategoriasEstoque } from '@/hooks/useCategoriasEstoque';
import { LoadingState } from '@/components/LoadingState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Check, ChevronsUpDown, Info, Download, Search, AlertTriangle, Package } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { BackButton } from '@/components/BackButton';
import { PageHeader } from '@/components/PageHeader';
export default function Ingredientes() {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    todasReceitas
  } = useReceitas();
  const {
    categorias
  } = useCategoriasEstoque();
  const [ingredientes, setIngredientes] = useState<any[]>([]);
  const [tiposDisponiveis, setTiposDisponiveis] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca e filtro
  const [termoBusca, setTermoBusca] = useState('');

  // Modal cadastro ingrediente
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [tipoSelecionado, setTipoSelecionado] = useState('');
  const [marca, setMarca] = useState('');
  const [preco, setPreco] = useState('');
  const [controlarEstoque, setControlarEstoque] = useState(false);
  const [popoverAberto, setPopoverAberto] = useState(false);
  const [termoBuscaTipo, setTermoBuscaTipo] = useState('');

  // Modal criar tipo na hora
  const [modalCriarTipoAberto, setModalCriarTipoAberto] = useState(false);
  const [novoTipoDescricao, setNovoTipoDescricao] = useState('');
  const [novoTipoQuantidade, setNovoTipoQuantidade] = useState('');
  const [novoTipoUnidadeId, setNovoTipoUnidadeId] = useState('');
  const [novoTipoCategoriaEstoqueId, setNovoTipoCategoriaEstoqueId] = useState('');
  const [novoTipoControlarEstoque, setNovoTipoControlarEstoque] = useState(false);
  useEffect(() => {
    fetchIngredientes();
    fetchTiposDisponiveis();
    fetchUnidades();
  }, []);
  const fetchIngredientes = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data,
        error
      } = await supabase.from('ingredientes').select(`
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
        `).eq('usuario_id', user.id);
      if (error) throw error;

      // Ordenar alfabeticamente pela descrição do tipo de insumo
      const sortedData = (data || []).sort((a, b) => {
        const nomeA = a.tipo_insumo?.descricao?.toLowerCase() || '';
        const nomeB = b.tipo_insumo?.descricao?.toLowerCase() || '';
        return nomeA.localeCompare(nomeB, 'pt-BR');
      });
      setIngredientes(sortedData);
    } catch (error) {
      console.error('Erro ao buscar ingredientes:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchTiposDisponiveis = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data,
        error
      } = await supabase.from('tipos_insumos').select(`
          id,
          descricao,
          quantidade_embalagem,
          unidade_medida:unidades_medida (
            id,
            nome,
            sigla
          )
        `).eq('usuario_id', user.id).eq('tipo', 'ingrediente').order('descricao');
      if (error) throw error;
      setTiposDisponiveis(data || []);
    } catch (error) {
      console.error('Erro ao buscar tipos:', error);
    }
  };
  const fetchUnidades = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data,
        error
      } = await supabase.from('unidades_medida').select('id, nome, sigla').eq('usuario_id', user.id).eq('ativo', true).order('nome');
      if (error) throw error;
      setUnidades(data || []);
    } catch (error) {
      console.error('Erro ao buscar unidades:', error);
    }
  };

  // Criar "ingredientes" a partir de receitas do tipo produto_combo
  const receitasComoIngredientes = useMemo(() => {
    const receitasCombo = todasReceitas.filter(r => r.tipo === "produto_combo");
    return receitasCombo.map(receita => {
      // Buscar a unidade de medida correspondente
      const unidadeMedida = unidades.find(u => u.id === receita.unidadeRendimento || u.nome === receita.unidadeRendimento || u.sigla === receita.unidadeRendimento);

      // Para "Produto para Combo", usar o custoTotal que já foi calculado corretamente:
      // custoTotal = Ingredientes + Custos Fixos + Mão de Obra (sem embalagens)
      const custoCompleto = receita.custoTotal || 0;
      return {
        id: receita.id,
        marca: "Ficha Técnica",
        preco: custoCompleto,
        data_atualizacao: new Date().toISOString().split('T')[0],
        tipo_insumo: {
          descricao: receita.nome,
          quantidade_embalagem: receita.rendimento || 1,
          unidade_medida: unidadeMedida ? {
            nome: unidadeMedida.nome,
            sigla: unidadeMedida.sigla
          } : {
            nome: receita.unidadeRendimento || "unidade",
            sigla: receita.unidadeRendimento || "un"
          }
        },
        e_receita: true // Flag para identificar que é uma receita
      };
    });
  }, [todasReceitas, unidades]);

  // Combinar ingredientes do banco com receitas tipo combo
  const todosIngredientes = useMemo(() => {
    return [...ingredientes, ...receitasComoIngredientes].sort((a, b) => {
      const nomeA = a.tipo_insumo?.descricao?.toLowerCase() || '';
      const nomeB = b.tipo_insumo?.descricao?.toLowerCase() || '';
      return nomeA.localeCompare(nomeB, 'pt-BR');
    });
  }, [ingredientes, receitasComoIngredientes]);

  // Filtrar ingredientes pela busca
  const ingredientesFiltrados = useMemo(() => {
    if (!termoBusca.trim()) return todosIngredientes;
    const termo = termoBusca.toLowerCase();
    return todosIngredientes.filter((ingrediente: any) => {
      const nomeIngrediente = ingrediente.tipo_insumo?.descricao?.toLowerCase() || '';
      const marcaIngrediente = ingrediente.marca?.toLowerCase() || '';
      return nomeIngrediente.includes(termo) || marcaIngrediente.includes(termo);
    });
  }, [todosIngredientes, termoBusca]);

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
      const dadosExport = ingredientesFiltrados.map((ingrediente: any) => ({
        'Ingrediente': ingrediente.tipo_insumo?.descricao || 'N/A',
        'Marca': ingrediente.marca || 'Sem marca',
        'Quantidade': ingrediente.tipo_insumo?.quantidade_embalagem || 0,
        'Unidade': ingrediente.tipo_insumo?.unidade_medida?.sigla || 'N/A',
        'Preço (R$)': ingrediente.preco.toFixed(2).replace('.', ','),
        'Data Atualização': formatarData(ingrediente.data_atualizacao),
        'Status': verificarDesatualizado(ingrediente.data_atualizacao) ? 'Desatualizado' : 'Atualizado'
      }));
      const ws = XLSX.utils.json_to_sheet(dadosExport);

      // Ajustar largura das colunas
      const colWidths = [{
        wch: 25
      },
      // Ingrediente
      {
        wch: 20
      },
      // Marca
      {
        wch: 12
      },
      // Quantidade
      {
        wch: 10
      },
      // Unidade
      {
        wch: 12
      },
      // Preço
      {
        wch: 15
      },
      // Data
      {
        wch: 15
      } // Status
      ];
      ws['!cols'] = colWidths;
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ingredientes');
      const hoje = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Ingredientes_${hoje}.xlsx`);
      toast({
        title: '✅ Exportado',
        description: 'Planilha de ingredientes exportada com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar a planilha.',
        variant: 'destructive'
      });
    }
  };
  const handleAbrirModal = (ingrediente: any = null) => {
    if (ingrediente) {
      // Verificar se é receita (produto combo)
      if (ingrediente.e_receita) {
        toast({
          title: 'Não editável',
          description: 'Receitas do tipo "Produto para combo" só podem ser editadas na página de Ficha Técnica.',
          variant: 'destructive'
        });
        return;
      }

      // Verificar se é pré-preparo
      const ePrePreparo = ingrediente.e_pre_preparo || ingrediente.tipo_insumo?.pre_preparo_id;
      if (ePrePreparo) {
        toast({
          title: 'Não editável',
          description: 'Pré-preparos só podem ser editados na página de Pré-Preparos.',
          variant: 'destructive'
        });
        return;
      }
      setEditando(ingrediente);
      setTipoSelecionado(ingrediente.tipo_insumo_id);
      setMarca(ingrediente.marca || '');
      setPreco(ingrediente.preco.toString().replace('.', ','));
      setControlarEstoque(ingrediente.controlar_estoque || false);
    } else {
      setEditando(null);
      setTipoSelecionado('');
      setMarca('');
      setPreco('');
      setControlarEstoque(false);
    }
    setModalAberto(true);
  };
  const handleSalvar = async () => {
    try {
      if (!tipoSelecionado) {
        toast({
          title: 'Erro',
          description: 'Selecione o tipo de ingrediente!',
          variant: 'destructive'
        });
        return;
      }
      const precoNum = parseFloat(preco.replace(',', '.'));
      if (!precoNum || precoNum <= 0) {
        toast({
          title: 'Erro',
          description: 'Informe um preço válido!',
          variant: 'destructive'
        });
        return;
      }
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      if (editando) {
        const {
          error
        } = await supabase.from('ingredientes').update({
          marca: marca.trim() || null,
          preco: precoNum,
          data_atualizacao: new Date().toISOString().split('T')[0],
          controlar_estoque: controlarEstoque
        }).eq('id', editando.id);
        if (error) throw error;
        toast({
          title: '✅ Atualizado',
          description: 'Ingrediente atualizado com sucesso!'
        });
      } else {
        const {
          error
        } = await supabase.from('ingredientes').insert({
          usuario_id: user.id,
          tipo_insumo_id: tipoSelecionado,
          marca: marca.trim() || null,
          preco: precoNum,
          data_atualizacao: new Date().toISOString().split('T')[0],
          controlar_estoque: controlarEstoque
        });
        if (error) {
          if (error.code === '23505') {
            throw new Error('Este tipo já foi cadastrado em ingredientes!');
          }
          throw error;
        }
        toast({
          title: '✅ Cadastrado',
          description: 'Ingrediente cadastrado com sucesso!'
        });
      }
      setModalAberto(false);
      fetchIngredientes();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // Criar tipo na hora
  const handleAbrirCriarTipo = () => {
    setNovoTipoDescricao(termoBuscaTipo);
    setNovoTipoQuantidade('');
    setNovoTipoUnidadeId('');
    setNovoTipoCategoriaEstoqueId('');
    setNovoTipoControlarEstoque(false);
    setModalCriarTipoAberto(true);
    setPopoverAberto(false);
  };
  const handleSalvarNovoTipo = async () => {
    try {
      if (!novoTipoDescricao.trim() || !novoTipoQuantidade || !novoTipoUnidadeId) {
        toast({
          title: 'Erro',
          description: 'Preencha todos os campos!',
          variant: 'destructive'
        });
        return;
      }
      const qtd = parseFloat(novoTipoQuantidade.replace(',', '.'));
      if (qtd <= 0) {
        toast({
          title: 'Erro',
          description: 'Quantidade deve ser maior que zero!',
          variant: 'destructive'
        });
        return;
      }
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const {
        data,
        error
      } = await supabase.from('tipos_insumos').insert({
        usuario_id: user.id,
        tipo: 'ingrediente',
        descricao: novoTipoDescricao.trim(),
        quantidade_embalagem: qtd,
        unidade_medida_id: novoTipoUnidadeId,
        categoria_estoque_id: novoTipoCategoriaEstoqueId || null,
        controlar_estoque: novoTipoControlarEstoque
      }).select(`
          id,
          descricao,
          quantidade_embalagem,
          unidade_medida:unidades_medida (
            id,
            nome,
            sigla
          )
        `).single();
      if (error) {
        if (error.code === '23505') {
          throw new Error('Este tipo já foi cadastrado!');
        }
        throw error;
      }
      toast({
        title: '✅ Tipo cadastrado',
        description: 'Novo tipo criado com sucesso! Agora você pode usá-lo.'
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
        variant: 'destructive'
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
      currency: 'BRL'
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

  // Contar ingredientes desatualizados
  const qtdDesatualizados = ingredientes.filter((i: any) => verificarDesatualizado(i.data_atualizacao)).length;
  if (loading) return <LoadingState message="Carregando Ingredientes" submessage="Buscando ingredientes cadastrados..." />;
  return <div className="space-y-6">
      <PageHeader title="Ingredientes" description="Cadastre ingredientes com marca e preço para usar em receitas" backButton={<BackButton to="/precificacao" />} actions={<div className="flex gap-2">
            <Button variant="outline" onClick={handleExportarExcel}>
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
            <Button onClick={() => handleAbrirModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Ingrediente
            </Button>
          </div>} />

      {/* Alertas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription>
            Após cadastrar, você pode editar apenas a marca e o preço.
          </AlertDescription>
        </Alert>

        {qtdDesatualizados > 0 && <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription>
              <strong>{qtdDesatualizados}</strong> ingrediente(s) com preço desatualizado (mais de 30 dias)
            </AlertDescription>
          </Alert>}
      </div>

      {/* Busca */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por ingrediente ou marca..." value={termoBusca} onChange={e => setTermoBusca(e.target.value)} className="pl-10" />
        </div>
      </div>

      {/* Tabela */}
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
              <TableHead className="text-center">Estoque</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ingredientesFiltrados.length === 0 ? <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {termoBusca ? 'Nenhum ingrediente encontrado com esse termo.' : 'Nenhum ingrediente cadastrado. Clique em "Novo Ingrediente".'}
                </TableCell>
              </TableRow> : ingredientesFiltrados.map((ingrediente: any) => {
            const desatualizado = verificarDesatualizado(ingrediente.data_atualizacao);
            const ePrePreparo = ingrediente.e_pre_preparo || ingrediente.tipo_insumo?.pre_preparo_id;
            const eReceita = ingrediente.e_receita;
            return <TableRow key={ingrediente.id} className={eReceita ? 'bg-pink-50/70 dark:bg-pink-950/30' : ePrePreparo ? 'bg-purple-50/50 dark:bg-purple-950/20' : desatualizado ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}>
                    <TableCell className={cn("font-medium", eReceita && "text-pink-700 dark:text-pink-400", ePrePreparo && "text-purple-700 dark:text-purple-400")}>
                      <div className="flex items-center gap-2">
                        {ingrediente.tipo_insumo?.descricao || 'N/A'}
                        {desatualizado && !ePrePreparo && !eReceita && <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Desatualizado
                          </Badge>}
                      </div>
                    </TableCell>
      <TableCell className={cn(eReceita && "text-pink-700 dark:text-pink-400 font-semibold", ePrePreparo && "text-purple-700 dark:text-purple-400")}>
        {eReceita ? <span className="font-semibold">Ficha Técnica</span> : ePrePreparo ? <span className="font-semibold">Pré-Preparo</span> : ingrediente.marca || <span className="text-muted-foreground italic">Sem marca</span>}
      </TableCell>
                    <TableCell className={cn(eReceita && "text-pink-700 dark:text-pink-400", ePrePreparo && "text-purple-700 dark:text-purple-400")}>
                      {ingrediente.tipo_insumo?.quantidade_embalagem?.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className={cn(eReceita && "text-pink-700 dark:text-pink-400", ePrePreparo && "text-purple-700 dark:text-purple-400")}>
                      {ingrediente.tipo_insumo?.unidade_medida?.nome || 'N/A'}
                    </TableCell>
                    <TableCell className={cn("font-medium", eReceita && "text-pink-700 dark:text-pink-400", ePrePreparo && "text-purple-700 dark:text-purple-400")}>
                      {formatarPreco(ingrediente.preco)}
                    </TableCell>
                    <TableCell className={cn(eReceita && "text-pink-700 dark:text-pink-400", ePrePreparo && "text-purple-700 dark:text-purple-400", !eReceita && !ePrePreparo && desatualizado && 'text-amber-700 font-medium dark:text-amber-400')}>
                      {formatarData(ingrediente.data_atualizacao)}
                    </TableCell>
                    <TableCell className="text-center">
                      {ingrediente.controlar_estoque ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400">
                          <Package className="h-3 w-3 mr-1" />
                          Sim
                        </Badge> : <span className="text-muted-foreground text-xs">-</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      {eReceita ? <Button variant="ghost" size="sm" onClick={() => navigate(`/precificacao/ficha-tecnica/editar/${ingrediente.id}`)}>
                          <Edit className="h-4 w-4" />
                        </Button> : ePrePreparo ? <Button variant="ghost" size="sm" onClick={() => navigate(`/precificacao/pre-preparos/${ingrediente.tipo_insumo?.pre_preparo_id}`)}>
                          <Edit className="h-4 w-4" />
                        </Button> : <Button variant="ghost" size="sm" onClick={() => handleAbrirModal(ingrediente)}>
                          <Edit className="h-4 w-4" />
                        </Button>}
                    </TableCell>
                  </TableRow>;
          })}
          </TableBody>
        </Table>
      </div>

      {/* Modal Cadastro/Edição Ingrediente */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Ingrediente' : 'Novo Ingrediente'}</DialogTitle>
            <DialogDescription>
              {editando ? 'Você pode alterar marca e preço' : 'Selecione o tipo e informe marca e preço'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Picklist Tipo */}
            {!editando && <div className="space-y-2">
                <Label>Nome do Ingrediente *</Label>
                <Popover open={popoverAberto} onOpenChange={setPopoverAberto}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={popoverAberto} className="w-full justify-between">
                      {tipoSelecionadoObj ? <span>
                          {tipoSelecionadoObj.descricao} ({tipoSelecionadoObj.quantidade_embalagem.toLocaleString('pt-BR')}{' '}
                          {tipoSelecionadoObj.unidade_medida.sigla})
                        </span> : <span className="text-muted-foreground">Buscar   </span>}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command shouldFilter={false}>
                      <CommandInput placeholder="Buscar tipo..." value={termoBuscaTipo} onValueChange={setTermoBuscaTipo} />
                      <CommandEmpty>
                        <div className="p-4 text-center space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Tipo não encontrado.
                          </p>
                          <Button size="sm" onClick={handleAbrirCriarTipo} className="w-full">
                            <Plus className="mr-2 h-4 w-4" />
                            Criar Novo Tipo "{termoBuscaTipo}"
                          </Button>
                        </div>
                      </CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {tiposFiltrados.map((tipo: any) => <CommandItem key={tipo.id} value={tipo.id} onSelect={() => {
                      setTipoSelecionado(tipo.id);
                      setPopoverAberto(false);
                      setTermoBuscaTipo('');
                    }}>
                            <Check className={cn('mr-2 h-4 w-4', tipoSelecionado === tipo.id ? 'opacity-100' : 'opacity-0')} />
                            <div className="flex flex-col">
                              <span className="font-medium">{tipo.descricao}</span>
                              <span className="text-sm text-muted-foreground">
                                {tipo.quantidade_embalagem.toLocaleString('pt-BR')}{' '}
                                {tipo.unidade_medida.sigla}
                              </span>
                            </div>
                          </CommandItem>)}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>}

            {/* Dados auto-preenchidos (edição) */}
            {editando && tipoSelecionadoObj && <div className="p-4 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground">Ingrediente</Label>
                <p className="font-medium">
                  {tipoSelecionadoObj.descricao} ({tipoSelecionadoObj.quantidade_embalagem.toLocaleString('pt-BR')}{' '}
                  {tipoSelecionadoObj.unidade_medida.sigla})
                </p>
              </div>}

            {/* Marca */}
            <div className="space-y-2">
              <Label htmlFor="marca">Marca (opcional)</Label>
              <Input id="marca" placeholder="Ex: Rosa Branca, Dona Benta..." value={marca} onChange={e => setMarca(e.target.value)} />
            </div>

            {/* Preço */}
            <div className="space-y-2">
              <Label htmlFor="preco">Preço *</Label>
              <Input id="preco" type="text" placeholder="Ex: 5,50" value={preco} onChange={e => {
              const valor = e.target.value.replace(/[^\d,]/g, '');
              setPreco(valor);
            }} />
            </div>

            {/* Checkbox Controlar Estoque */}
            <div className="flex items-center space-x-2 p-4 border-2 border-primary rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Checkbox id="controlar-estoque" checked={controlarEstoque} onCheckedChange={checked => setControlarEstoque(checked as boolean)} />
              <div className="flex flex-col">
                <Label htmlFor="controlar-estoque" className="cursor-pointer font-semibold text-primary-foreground">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Controlar no Estoque
                  </div>
                </Label>
                <p className="text-xs opacity-90 mt-1">
                  Acompanhar entradas e saídas
                </p>
              </div>
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
            <DialogTitle>Novo Ingrediente</DialogTitle>
            <DialogDescription>
              Cadastre o tipo base do ingrediente com sua quantidade padrão
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="novo-tipo-descricao">Nome do Ingrediente *</Label>
              <Input id="novo-tipo-descricao" placeholder="Ex: Farinha de Trigo" value={novoTipoDescricao} onChange={e => setNovoTipoDescricao(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="novo-tipo-quantidade">Qtde na Embalagem *</Label>
                <Input id="novo-tipo-quantidade" type="text" placeholder="Ex: 1000" value={novoTipoQuantidade} onChange={e => {
                const valor = e.target.value.replace(/[^\d,]/g, '');
                setNovoTipoQuantidade(valor);
              }} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="novo-tipo-unidade">Unidade de Medida *</Label>
                <Select value={novoTipoUnidadeId} onValueChange={setNovoTipoUnidadeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map((unidade: any) => <SelectItem key={unidade.id} value={unidade.id}>
                        {unidade.nome} ({unidade.sigla})
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="novo-tipo-categoria">Categoria de Estoque</Label>
              <Select value={novoTipoCategoriaEstoqueId} onValueChange={setNovoTipoCategoriaEstoqueId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria..." />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((categoria: any) => <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-3 p-4 rounded-lg bg-primary">
              <Checkbox id="novo-tipo-controlar-estoque" checked={novoTipoControlarEstoque} onCheckedChange={checked => setNovoTipoControlarEstoque(checked as boolean)} className="border-primary-foreground data-[state=checked]:bg-primary-foreground data-[state=checked]:text-primary" />
              <Label htmlFor="novo-tipo-controlar-estoque" className="text-sm font-semibold cursor-pointer text-primary-foreground">
                Controle de Estoque
              </Label>
            </div>

            <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-sm">
                Este ingrediente será salvo e ficará disponível para usar.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalCriarTipoAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarNovoTipo}>
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
}