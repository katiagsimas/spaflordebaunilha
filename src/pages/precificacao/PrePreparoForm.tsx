import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useCategorias } from '@/hooks/useCategorias';
import { Plus, Trash2, Upload, X, Info, ArrowLeft, FileDown } from 'lucide-react';
import { exportarPrePreparoPDF } from '@/utils/exportarPrePreparoPDF';
import { MaoObraSection, MaoObraLinha } from '@/components/MaoObraSection';
import { usePrePreparosMaoObra } from '@/hooks/usePrePreparosMaoObra';
import { useMaoObraPerfis } from '@/hooks/useMaoObraPerfis';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function PrePreparoForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { categorias } = useCategorias();
  const { perfis } = useMaoObraPerfis();
  const { profile } = useUserProfile();
  const { showLoading, hideLoading } = useGlobalLoading();
  const isEditMode = !!id;

  const onboardingPendente = profile && !(profile as any).onboarding_concluido;


  // Campos básicos
  const [nome, setNome] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [tempoPreparo, setTempoPreparo] = useState('');
  const [tempoUnidade, setTempoUnidade] = useState('minutos');
  const [rendimentoQtd, setRendimentoQtd] = useState('');
  const [rendimentoUnidadeId, setRendimentoUnidadeId] = useState('');
  const [modoPreparo, setModoPreparo] = useState('');

  // Ingredientes
  const [ingredientesSelecionados, setIngredientesSelecionados] = useState<any[]>([]);
  const [ingredientesDisponiveis, setIngredientesDisponiveis] = useState<any[]>([]);
  const [popoverAberto, setPopoverAberto] = useState(false);
  const [termoBuscaIngrediente, setTermoBuscaIngrediente] = useState('');
  
  // Modais de cadastro em cadeia
  const [modalCriarTipoAberto, setModalCriarTipoAberto] = useState(false);
  const [modalCriarIngredienteAberto, setModalCriarIngredienteAberto] = useState(false);
  const [novoTipoDescricao, setNovoTipoDescricao] = useState('');
  const [novoTipoQuantidade, setNovoTipoQuantidade] = useState('');
  const [novoTipoUnidadeId, setNovoTipoUnidadeId] = useState('');
  const [novoIngredienteMarca, setNovoIngredienteMarca] = useState('');
  const [novoIngredientePreco, setNovoIngredientePreco] = useState('');
  const [tipoRecemCriado, setTipoRecemCriado] = useState<any>(null);

  // Unidades
  const [unidades, setUnidades] = useState<any[]>([]);

  // Imagens
  const [imagem1, setImagem1] = useState<File | null>(null);
  const [imagem2, setImagem2] = useState<File | null>(null);
  const [imagem1Preview, setImagem1Preview] = useState('');
  const [imagem2Preview, setImagem2Preview] = useState('');

  // Mão de obra
  const [maosObra, setMaosObra] = useState<MaoObraLinha[]>([]);

  const [custoIngredientes, setCustoIngredientes] = useState(0);
  const [custoMaoObra, setCustoMaoObra] = useState(0);
  const [custoTotal, setCustoTotal] = useState(0);
  const [custoPorUnidade, setCustoPorUnidade] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      await fetchUnidades();
      await fetchIngredientes();
    };
    
    loadData();
    
    if (isEditMode) {
      fetchPrePreparo();
    }
  }, [id]);

  useEffect(() => {
    calcularCustos();
  }, [ingredientesSelecionados, rendimentoQtd, maosObra, perfis, profile]);

  const fetchIngredientes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar ingredientes normais
      const { data: ingredientesData, error: ingredientesError } = await supabase
        .from('ingredientes')
        .select(`
          *,
          tipo_insumo:tipos_insumos (
            descricao,
            quantidade_embalagem,
            unidade_medida:unidades_medida (
              nome,
              sigla
            )
          )
        `)
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (ingredientesError) throw ingredientesError;
      
      // Buscar receitas do Supabase
      const { data: receitasData, error: receitasError } = await supabase
        .from('receitas')
        .select('id, nome, tipo_receita')
        .eq('usuario_id', user.id);
      let receitasCombo: any[] = [];
      
      if (!receitasError && receitasData) {
        receitasCombo = receitasData
          .filter((r: any) => r.tipo_receita === 'produto_combo')
          .map((r: any) => {
            // Buscar a sigla correta da unidade de medida
            const unidade = unidades.find((u: any) => u.id === r.unidade_rendimento_id);
            const siglaNome = unidade?.sigla || 'un';
            
            return {
              id: `receita_${r.id}`,
              preco: r.custo_total || 0,
              marca: 'Receita',
              tipo_insumo: {
                descricao: r.nome,
                quantidade_embalagem: r.rendimento || 1,
                unidade_medida: {
                  sigla: siglaNome
                }
              },
              e_receita_combo: true
            };
          });
      }
      
      // Combinar ingredientes e receitas combo
      const todosItens = [...(ingredientesData || []), ...receitasCombo];
      
      // Ordenar alfabeticamente
      const sorted = todosItens.sort((a, b) => 
        (a.tipo_insumo?.descricao || '').localeCompare(b.tipo_insumo?.descricao || '')
      );
      setIngredientesDisponiveis(sorted);
    } catch (error) {
      console.error('Erro ao buscar ingredientes:', error);
    }
  };

  const fetchUnidades = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('unidades_medida')
        .select('*')
        .eq('usuario_id', user.id)
        .order('nome');

      if (error) throw error;
      setUnidades(data || []);
    } catch (error) {
      console.error('Erro ao buscar unidades:', error);
    }
  };

  const fetchPrePreparo = async () => {
    try {
      const { data, error } = await supabase
        .from('pre_preparos')
        .select(`
          *,
          ingredientes:pre_preparos_ingredientes (
            *,
            ingrediente:ingredientes (
              *,
              tipo_insumo:tipos_insumos (
                descricao,
                quantidade_embalagem,
                unidade_medida:unidades_medida (
                  nome,
                  sigla
                )
              )
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setNome(data.nome);
      setCategoriaId(data.categoria_id || '');
      setTempoPreparo(data.tempo_preparo.toString());
      setTempoUnidade(data.tempo_preparo_unidade);
      setRendimentoQtd(data.rendimento_quantidade.toString());
      setRendimentoUnidadeId(data.rendimento_unidade_id);
      setModoPreparo(data.modo_preparo || '');
      setImagem1Preview(data.imagem_1_url || '');
      setImagem2Preview(data.imagem_2_url || '');

      const ingredientesFormatados = data.ingredientes.map((item: any) => ({
        id: item.ingrediente.id,
        nome: item.ingrediente.tipo_insumo?.descricao,
        marca: item.ingrediente.marca,
        qtdEmbalagem: item.ingrediente.tipo_insumo?.quantidade_embalagem,
        unidade: item.ingrediente.tipo_insumo?.unidade_medida?.sigla,
        preco: item.ingrediente.preco,
        qtdUtilizada: item.quantidade_utilizada,
        qtdUtilizadaDisplay: item.quantidade_utilizada.toString().replace('.', ','),
        custo: item.custo_ingrediente,
      }));

      setIngredientesSelecionados(ingredientesFormatados);

      // Buscar mão de obra
      const { data: maosObraData } = await supabase
        .from('pre_preparos_mao_obra')
        .select('*')
        .eq('pre_preparo_id', id);

      if (maosObraData) {
        const maosObraFormatadas = maosObraData.map((mo: any) => ({
          id: mo.id,
          perfil_id: mo.perfil_id,
          usar_valor_padrao: mo.usar_valor_padrao,
          horas: mo.horas,
        }));
        setMaosObra(maosObraFormatadas);
      }
    } catch (error) {
      console.error('Erro ao buscar pré-preparo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o pré-preparo.',
        variant: 'destructive',
      });
    }
  };

  const handleAdicionarIngrediente = (ingrediente: any) => {
    const jaAdicionado = ingredientesSelecionados.find(i => i.id === ingrediente.id);
    if (jaAdicionado) {
      toast({
        title: 'Aviso',
        description: 'Este ingrediente já foi adicionado!',
        variant: 'destructive',
      });
      return;
    }

    const novoIngrediente = {
      id: ingrediente.id,
      nome: ingrediente.tipo_insumo?.descricao,
      marca: ingrediente.marca,
      qtdEmbalagem: ingrediente.tipo_insumo?.quantidade_embalagem,
      unidade: ingrediente.tipo_insumo?.unidade_medida?.sigla,
      preco: ingrediente.preco,
      qtdUtilizada: 0,
      qtdUtilizadaDisplay: '',
      custo: 0,
    };

    setIngredientesSelecionados([...ingredientesSelecionados, novoIngrediente]);
    setPopoverAberto(false);
  };

  const handleRemoverIngrediente = (index: number) => {
    const novosIngredientes = ingredientesSelecionados.filter((_, i) => i !== index);
    setIngredientesSelecionados(novosIngredientes);
  };

  const handleQtdUtilizadaChange = (index: number, valor: string) => {
    const novosIngredientes = [...ingredientesSelecionados];
    
    // Permitir string vazia para limpar o campo
    if (valor === '') {
      novosIngredientes[index].qtdUtilizada = 0;
      novosIngredientes[index].qtdUtilizadaDisplay = '';
      novosIngredientes[index].custo = 0;
      setIngredientesSelecionados(novosIngredientes);
      return;
    }
    
    // Armazenar o valor digitado com vírgula para exibição
    novosIngredientes[index].qtdUtilizadaDisplay = valor;
    
    // Converter vírgula para ponto para cálculo
    const qtd = parseFloat(valor.replace(',', '.')) || 0;
    novosIngredientes[index].qtdUtilizada = qtd;

    // Calcular custo deste ingrediente
    const custoIngrediente = (novosIngredientes[index].preco / novosIngredientes[index].qtdEmbalagem) * qtd;
    novosIngredientes[index].custo = custoIngrediente;

    setIngredientesSelecionados(novosIngredientes);
  };

  const calcularCustoMaoObra = () => {
    let custoTotal = 0;
    
    maosObra.forEach((maoObra) => {
      let valorHora = 0;
      
      if (maoObra.usar_valor_padrao) {
        // Usar valor do perfil marcado como padrão
        const perfilPadrao = perfis.find(p => p.padrao && p.ativo);
        valorHora = perfilPadrao?.valor_hora || 0;
      } else if (maoObra.perfil_id) {
        // Usar valor do perfil específico
        const perfil = perfis.find(p => p.id === maoObra.perfil_id);
        valorHora = perfil?.valor_hora || 0;
      }
      
      custoTotal += valorHora * maoObra.horas;
    });
    
    return custoTotal;
  };

  const calcularCustos = () => {
    const totalIngredientes = ingredientesSelecionados.reduce((acc, ing) => acc + (ing.custo || 0), 0);
    const totalMaoObra = calcularCustoMaoObra();
    const total = totalIngredientes + totalMaoObra;

    setCustoIngredientes(totalIngredientes);
    setCustoMaoObra(totalMaoObra);
    setCustoTotal(total);

    const rendimento = parseFloat(rendimentoQtd.replace(',', '.')) || 1;
    setCustoPorUnidade(total / rendimento);
  };

  const handleImagemChange = (e: React.ChangeEvent<HTMLInputElement>, numeroImagem: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'Imagem muito grande! Máximo 5MB.',
        variant: 'destructive',
      });
      return;
    }

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      if (numeroImagem === 1) {
        setImagem1(file);
        setImagem1Preview(reader.result as string);
      } else {
        setImagem2(file);
        setImagem2Preview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoverImagem = (numeroImagem: number) => {
    if (numeroImagem === 1) {
      setImagem1(null);
      setImagem1Preview('');
    } else {
      setImagem2(null);
      setImagem2Preview('');
    }
  };

  const uploadImagem = async (file: File, numeroImagem: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}_${numeroImagem}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('pre-preparos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('pre-preparos')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      return null;
    }
  };

  const criarComoIngrediente = async (prePreparoId: string, nomePrePreparo: string, custoTotal: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;


      // ✅ USAR NOME LIMPO (sem prefixo)
      const nomeTipo = nomePrePreparo; // Nome limpo!
      
      // Buscar ou criar tipo
      let tipoId;
      const { data: tipoExistente } = await supabase
        .from('tipos_insumos')
        .select('id')
        .eq('pre_preparo_id', prePreparoId)
        .maybeSingle();

      if (tipoExistente) {
        tipoId = tipoExistente.id;
        
        // Atualizar tipo existente (caso nome tenha mudado)
        await supabase
          .from('tipos_insumos')
          .update({
            descricao: nomeTipo,
            quantidade_embalagem: parseFloat(rendimentoQtd.replace(',', '.')),
            unidade_medida_id: rendimentoUnidadeId,
          })
          .eq('id', tipoId);
          
        
      } else {
        // Criar novo tipo vinculado ao pré-preparo
        const { data: novoTipo, error: errorTipo } = await supabase
          .from('tipos_insumos')
          .insert({
            usuario_id: user.id,
            tipo: 'ingrediente',
            descricao: nomeTipo,
            quantidade_embalagem: parseFloat(rendimentoQtd.replace(',', '.')),
            unidade_medida_id: rendimentoUnidadeId,
            pre_preparo_id: prePreparoId, // Vínculo com pré-preparo
          })
          .select()
          .single();

        if (errorTipo) throw errorTipo;
        tipoId = novoTipo.id;
        
        
      }

      // Buscar ou criar ingrediente
      const { data: ingredienteExistente } = await supabase
        .from('ingredientes')
        .select('id')
        .eq('usuario_id', user.id)
        .eq('tipo_insumo_id', tipoId)
        .maybeSingle();

      if (ingredienteExistente) {
        // Atualizar preço e marcar como pré-preparo (usar custo total)
        await supabase
          .from('ingredientes')
          .update({
            marca: 'Pré-Preparo',
            preco: custoTotal,
            e_pre_preparo: true,
            data_atualizacao: new Date().toISOString().split('T')[0],
          })
          .eq('id', ingredienteExistente.id);
          
        
      } else {
        // Criar novo (usar custo total)
        await supabase
          .from('ingredientes')
          .insert({
            usuario_id: user.id,
            tipo_insumo_id: tipoId,
            marca: 'Pré-Preparo',
            preco: custoTotal,
            e_pre_preparo: true,
            data_atualizacao: new Date().toISOString().split('T')[0],
          });
          
        
      }

      
    } catch (error) {
      console.error('❌ Erro ao criar como ingrediente:', error);
    }
  };

  const handleSalvar = async () => {
    if (onboardingPendente) {
      toast({
        title: "Ação bloqueada",
        description: "Conclua o onboarding para realizar esta ação!",
        variant: "destructive",
      });
      return;
    }

    try {

      // Validações
      if (!nome.trim()) {
        toast({
          title: 'Erro',
          description: 'Informe o nome do pré-preparo!',
          variant: 'destructive',
        });
        return;
      }

      const rendimento = parseFloat(rendimentoQtd.replace(',', '.'));
      if (!rendimento || rendimento <= 0) {
        toast({
          title: 'Erro',
          description: 'Informe um rendimento válido!',
          variant: 'destructive',
        });
        return;
      }

      if (!rendimentoUnidadeId) {
        toast({
          title: 'Erro',
          description: 'Selecione a unidade de medida do rendimento!',
          variant: 'destructive',
        });
        return;
      }

      if (ingredientesSelecionados.length === 0) {
        toast({
          title: 'Erro',
          description: 'Adicione pelo menos um ingrediente!',
          variant: 'destructive',
        });
        return;
      }

      // Verificar se todos os ingredientes têm quantidade
      const semQuantidade = ingredientesSelecionados.find(i => !i.qtdUtilizada || i.qtdUtilizada <= 0);
      if (semQuantidade) {
        toast({
          title: 'Erro',
          description: 'Informe a quantidade utilizada de todos os ingredientes!',
          variant: 'destructive',
        });
        return;
      }

      showLoading(isEditMode ? 'Atualizando pré-preparo...' : 'Salvando pré-preparo...');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Upload de imagens
      let url1 = imagem1Preview;
      let url2 = imagem2Preview;

      if (imagem1 && typeof imagem1 !== 'string') {
        url1 = await uploadImagem(imagem1, 1) || url1;
      }

      if (imagem2 && typeof imagem2 !== 'string') {
        url2 = await uploadImagem(imagem2, 2) || url2;
      }

      const totalHorasMaoObra = maosObra.reduce((sum, mo) => sum + Number(mo.horas || 0), 0);

      // Salvar pré-preparo
      const dadosPrePreparo = {
        usuario_id: user.id,
        nome: nome.trim(),
        categoria_id: categoriaId || null,
        tempo_preparo: Math.round(totalHorasMaoObra * 60),
        tempo_preparo_unidade: 'minutos',
        rendimento_quantidade: rendimento,
        rendimento_unidade_id: rendimentoUnidadeId,
        modo_preparo: modoPreparo.trim() || null,
        imagem_1_url: url1 || null,
        imagem_2_url: url2 || null,
        custo_total: custoTotal,
        custo_por_unidade: custoPorUnidade,
      };

      let prePreparoId;

      if (isEditMode) {
        // Atualizar
        const { error } = await supabase
          .from('pre_preparos')
          .update(dadosPrePreparo)
          .eq('id', id);

        if (error) throw error;

        // Deletar ingredientes antigos
        await supabase
          .from('pre_preparos_ingredientes')
          .delete()
          .eq('pre_preparo_id', id);

        prePreparoId = id;
      } else {
        // Criar
        const { data, error } = await supabase
          .from('pre_preparos')
          .insert(dadosPrePreparo)
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            throw new Error('Já existe um pré-preparo com este nome!');
          }
          throw error;
        }

        prePreparoId = data.id;
      }

      // Inserir ingredientes (filtrar apenas ingredientes reais do Supabase, não receitas combo)
      const ingredientesReais = ingredientesSelecionados.filter(ing => !ing.id.startsWith('receita_'));
      const receitasCombo = ingredientesSelecionados.filter(ing => ing.id.startsWith('receita_'));
      
      // Se houver receitas combo, avisar que elas não serão salvas no banco
      if (receitasCombo.length > 0 && ingredientesReais.length === 0) {
        toast({
          title: 'Aviso',
          description: 'Pré-preparos precisam ter pelo menos um ingrediente cadastrado. Fichas técnicas são usadas apenas para cálculo de custo.',
          variant: 'destructive',
        });
        hideLoading();
        return;
      }
      
      const ingredientesParaInserir = ingredientesReais.map((ing, index) => ({
        pre_preparo_id: prePreparoId,
        ingrediente_id: ing.id,
        quantidade_utilizada: ing.qtdUtilizada,
        custo_ingrediente: ing.custo,
        ordem: index,
      }));

      const { error: errorIngredientes } = await supabase
        .from('pre_preparos_ingredientes')
        .insert(ingredientesParaInserir);

      if (errorIngredientes) throw errorIngredientes;

      // Salvar mão de obra
      if (maosObra.length > 0) {
        const maosObraParaSalvar = maosObra.map(mo => ({
          perfil_id: mo.perfil_id,
          usar_valor_padrao: mo.usar_valor_padrao,
          horas: mo.horas,
        }));

        await supabase
          .from('pre_preparos_mao_obra')
          .delete()
          .eq('pre_preparo_id', prePreparoId);

        const { error: errorMaoObra } = await supabase
          .from('pre_preparos_mao_obra')
          .insert(
            maosObraParaSalvar.map(mo => ({
              pre_preparo_id: prePreparoId,
              ...mo,
            }))
          );

        if (errorMaoObra) throw errorMaoObra;
      }

      // Criar/atualizar na tabela ingredientes (usando custo total)
      await criarComoIngrediente(prePreparoId, nome, custoTotal);

      toast({
        title: 'Sucesso',
        description: isEditMode ? 'Pré-preparo atualizado!' : 'Pré-preparo cadastrado!',
      });

      navigate('/precificacao/pre-preparos');
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      hideLoading();
    }
  };

  const formatarPreco = (preco: number) => {
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <div className="container mx-auto px-6 pt-1 pb-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/precificacao/pre-preparos')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditMode ? 'Editar Pré-Preparo' : 'Novo Pré-Preparo'}
          </h1>
          <p className="text-muted-foreground">
            Cadastre preparos intermediários para usar em receitas
          </p>
        </div>
      </div>

      {/* Formulário */}
      <div className="space-y-6">
        {/* Card Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Pré-Preparo *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Massa de Bolo Base"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria de Receita</Label>
                <Select value={categoriaId} onValueChange={setCategoriaId}>
                  <SelectTrigger id="categoria">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.filter(c => c.ativo).map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rendimento">Rendimento *</Label>
                <Input
                  id="rendimento"
                  type="text"
                  placeholder="Ex: 10"
                  value={rendimentoQtd}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/[^\d,]/g, '');
                    setRendimentoQtd(valor);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Unidade de Medida</Label>
                <Select value={rendimentoUnidadeId} onValueChange={setRendimentoUnidadeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map(unidade => (
                      <SelectItem key={unidade.id} value={unidade.id}>
                        {unidade.nome} ({unidade.sigla})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Mão de Obra */}
        <Card>
          <CardHeader>
            <CardTitle>Mão de Obra</CardTitle>
            <CardDescription>
              Adicione os custos de mão de obra para este pré-preparo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MaoObraSection
              maosObra={maosObra}
              onChange={setMaosObra}
            />
          </CardContent>
        </Card>

        {/* Card Ingredientes */}
        <Card>
          <CardHeader>
            <CardTitle>Ingredientes</CardTitle>
            <CardDescription>
              Adicione os ingredientes necessários e suas quantidades
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ingredientesSelecionados.length > 0 && (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingrediente</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Qtde Emb.</TableHead>
                      <TableHead>Un.</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Qtde Utilizada *</TableHead>
                      <TableHead>Custo</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingredientesSelecionados.map((ing, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{ing.nome}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {ing.marca || 'Sem marca'}
                        </TableCell>
                        <TableCell>{ing.qtdEmbalagem?.toLocaleString('pt-BR')}</TableCell>
                        <TableCell>{ing.unidade}</TableCell>
                        <TableCell>{formatarPreco(ing.preco)}</TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            placeholder="0"
                            className="w-24"
                            value={ing.qtdUtilizadaDisplay !== undefined ? ing.qtdUtilizadaDisplay : (ing.qtdUtilizada || '')}
                            onChange={(e) => {
                              const valor = e.target.value.replace(/[^\d,]/g, '');
                              handleQtdUtilizadaChange(index, valor);
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-primary">
                          {formatarPreco(ing.custo || 0)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoverIngrediente(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <Popover open={popoverAberto} onOpenChange={setPopoverAberto}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Ingrediente
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput 
                    placeholder="Buscar ingrediente..." 
                    value={termoBuscaIngrediente}
                    onValueChange={setTermoBuscaIngrediente}
                  />
                  <CommandEmpty>
                    <div className="flex flex-col items-center gap-2 py-4">
                      <p className="text-sm text-muted-foreground">
                        Nenhum ingrediente encontrado
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNovoTipoDescricao(termoBuscaIngrediente);
                          setNovoTipoQuantidade('');
                          setNovoTipoUnidadeId('');
                          setModalCriarTipoAberto(true);
                          setPopoverAberto(false);
                        }}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Cadastrar novo ingrediente
                      </Button>
                    </div>
                  </CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-auto">
                    {ingredientesDisponiveis.map(ingrediente => (
                      <CommandItem
                        key={ingrediente.id}
                        value={`${ingrediente.tipo_insumo?.descricao} ${ingrediente.marca || ''}`}
                        onSelect={() => handleAdicionarIngrediente(ingrediente)}
                      >
                        <div className="flex flex-col w-full">
                          <span className="font-medium">
                            {ingrediente.tipo_insumo?.descricao}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {ingrediente.marca} - {formatarPreco(ingrediente.preco)}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Totais */}
            {(ingredientesSelecionados.length > 0 || maosObra.length > 0) && (
              <div className="border-t pt-4 space-y-2">
                {ingredientesSelecionados.length > 0 && (
                  <div className="flex justify-between text-base">
                    <span>Total de Ingredientes:</span>
                    <span>{formatarPreco(custoIngredientes)}</span>
                  </div>
                )}
                {maosObra.length > 0 && (
                  <div className="flex justify-between text-base">
                    <span>Total de Mão de Obra:</span>
                    <span>{formatarPreco(custoMaoObra)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Custo Total:</span>
                  <span className="text-primary">{formatarPreco(custoTotal)}</span>
                </div>
                {rendimentoQtd && (
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Custo por Unidade:</span>
                    <span className="text-primary">{formatarPreco(custoPorUnidade)}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card Modo de Preparo */}
        <Card>
          <CardHeader>
            <CardTitle>Modo de Preparo</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Descreva o passo a passo do preparo..."
              rows={6}
              value={modoPreparo}
              onChange={(e) => setModoPreparo(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Card Imagens */}
        <Card>
          <CardHeader>
            <CardTitle>Imagens</CardTitle>
            <CardDescription>Adicione até 2 imagens do pré-preparo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* Imagem 1 */}
              <div className="space-y-2">
                <Label>Imagem 1</Label>
                {imagem1Preview ? (
                  <div className="relative">
                    <img
                      src={imagem1Preview}
                      alt="Preview 1"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => handleRemoverImagem(1)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImagemChange(e, 1)}
                      className="hidden"
                      id="imagem1"
                    />
                    <Label htmlFor="imagem1" className="cursor-pointer">
                      <span className="text-sm text-muted-foreground">
                        Clique para adicionar
                      </span>
                    </Label>
                  </div>
                )}
              </div>

              {/* Imagem 2 */}
              <div className="space-y-2">
                <Label>Imagem 2</Label>
                {imagem2Preview ? (
                  <div className="relative">
                    <img
                      src={imagem2Preview}
                      alt="Preview 2"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => handleRemoverImagem(2)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImagemChange(e, 2)}
                      className="hidden"
                      id="imagem2"
                    />
                    <Label htmlFor="imagem2" className="cursor-pointer">
                      <span className="text-sm text-muted-foreground">
                        Clique para adicionar
                      </span>
                    </Label>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerta */}
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            Após salvar, este pré-preparo aparecerá automaticamente na lista de Ingredientes 
            e poderá ser usado em receitas!
          </AlertDescription>
        </Alert>

        {/* Botões */}
        <div className="flex flex-wrap gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/precificacao/pre-preparos')}
          >
            Cancelar
          </Button>
          {isEditMode && id && (
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                try {
                  await exportarPrePreparoPDF(id);
                } catch (e: any) {
                  toast({
                    title: 'Erro ao exportar',
                    description: e?.message || 'Falha ao gerar PDF.',
                    variant: 'destructive',
                  });
                }
              }}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
          )}
          <Button onClick={handleSalvar} className="flex-1">
            {isEditMode ? 'Atualizar Pré-Preparo' : 'Salvar Pré-Preparo'}
          </Button>
        </div>
      </div>

      {/* Dialog - Criar Tipo de Ingrediente */}
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
              <Label htmlFor="descricao">Nome do Ingrediente *</Label>
              <Input
                id="descricao"
                placeholder="Ex: Farinha de Trigo"
                value={novoTipoDescricao}
                onChange={(e) => setNovoTipoDescricao(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantidade">Qtde na Embalagem *</Label>
                <Input
                  id="quantidade"
                  type="text"
                  placeholder="Ex: 1000"
                  value={novoTipoQuantidade}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/[^\d,]/g, '');
                    setNovoTipoQuantidade(valor);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unidade">Unidade de Medida *</Label>
                <Select value={novoTipoUnidadeId} onValueChange={setNovoTipoUnidadeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map((unidade) => (
                      <SelectItem key={unidade.id} value={unidade.id}>
                        {unidade.nome} ({unidade.sigla})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalCriarTipoAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={async () => {
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
                    tipo: 'ingrediente',
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
                  description: 'Agora vamos cadastrar o ingrediente!',
                });

                // Armazenar tipo recém-criado e abrir modal de ingrediente
                setTipoRecemCriado(data);
                setModalCriarTipoAberto(false);
                setNovoIngredienteMarca('');
                setNovoIngredientePreco('');
                setModalCriarIngredienteAberto(true);

              } catch (error: any) {
                console.error('Erro ao criar tipo:', error);
                toast({
                  title: 'Erro ao criar tipo',
                  description: error.message,
                  variant: 'destructive',
                });
              }
            }}>
              Próximo: Cadastrar Ingrediente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog - Criar Ingrediente */}
      <Dialog open={modalCriarIngredienteAberto} onOpenChange={setModalCriarIngredienteAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Ingrediente</DialogTitle>
            {tipoRecemCriado && (
              <p className="text-sm text-muted-foreground">
                Tipo: {tipoRecemCriado.descricao} - {tipoRecemCriado.quantidade_embalagem} {tipoRecemCriado.unidade_medida?.sigla}
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Marca</Label>
              <Input
                value={novoIngredienteMarca}
                onChange={(e) => setNovoIngredienteMarca(e.target.value)}
                placeholder="Ex: Dona Benta"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Preço *</Label>
              <Input
                type="text"
                value={novoIngredientePreco}
                onChange={(e) => {
                  const valor = e.target.value.replace(/[^\d,]/g, '');
                  setNovoIngredientePreco(valor);
                }}
                placeholder="Ex: 15,90"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setModalCriarIngredienteAberto(false);
              setTipoRecemCriado(null);
            }}>
              Cancelar
            </Button>
            <Button onClick={async () => {
              try {
                if (!tipoRecemCriado) {
                  throw new Error('Tipo não encontrado');
                }

                const precoNum = parseFloat(novoIngredientePreco.replace(',', '.'));
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

                const { data, error } = await supabase
                  .from('ingredientes')
                  .insert({
                    usuario_id: user.id,
                    tipo_insumo_id: tipoRecemCriado.id,
                    marca: novoIngredienteMarca.trim() || null,
                    preco: precoNum,
                    data_atualizacao: new Date().toISOString().split('T')[0],
                  })
                  .select(`
                    *,
                    tipo_insumo:tipos_insumos (
                      descricao,
                      quantidade_embalagem,
                      unidade_medida:unidades_medida (
                        nome,
                        sigla
                      )
                    )
                  `)
                  .single();

                if (error) {
                  if (error.code === '23505') {
                    throw new Error('Este ingrediente já foi cadastrado!');
                  }
                  throw error;
                }

                toast({
                  title: '✅ Ingrediente cadastrado',
                  description: 'Ingrediente adicionado com sucesso!',
                });

                // Recarregar ingredientes e adicionar automaticamente
                await fetchIngredientes();
                if (data) {
                  handleAdicionarIngrediente(data);
                }

                // Fechar modal e limpar
                setModalCriarIngredienteAberto(false);
                setTipoRecemCriado(null);
                setTermoBuscaIngrediente('');

              } catch (error: any) {
                console.error('Erro ao criar ingrediente:', error);
                toast({
                  title: 'Erro ao criar ingrediente',
                  description: error.message,
                  variant: 'destructive',
                });
              }
            }}>
              Cadastrar e Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
