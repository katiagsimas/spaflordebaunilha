import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChefHat, Upload, X } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useUnidadesMedida } from "@/hooks/useUnidadesMedida";
import { useCategorias } from "@/hooks/useCategorias";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { EmbalagemAutocomplete } from "@/components/EmbalagemAutocomplete";

interface CustoFixo {
  id: string;
  nome: string;
  valor: number;
}

interface Embalagem {
  id: string;
  nome: string;
  marca: string;
  quantidade: number;
  unidadeMedida: string;
  preco: number;
  dataAtualizacao: string;
}

interface Ingrediente {
  id: string;
  nome: string;
  marca: string;
  quantidade: number;
  unidadeMedida: string;
  preco: number;
  dataAtualizacao: string;
}

interface IngredienteReceita {
  id: string;
  ingredienteId: string;
  ingrediente: string;
  marca: string;
  qtdeEmbalagem: number;
  unidadeMedida: string;
  precoEmbalagem: number;
  quantidadeUtilizada: number;
  custoUnitario: number;
  custoReceita: number;
}

interface EmbalagemReceita {
  id: string;
  embalagemId: string;
  embalagem: string;
  marca: string;
  qtdeEmbalagem: number;
  unidadeMedida: string;
  precoEmbalagem: number;
  quantidadeUtilizada: number;
  custoUnitario: number;
  custoReceita: number;
}

interface Categoria {
  id: string;
  nome: string;
}

interface Receita {
  id: string;
  nome: string;
  categoria?: string;
  tipo?: "produto_avulso" | "produto_combo";
  cardapio?: "ativo" | "fora";
  tempoPreparo: number;
  unidadeTempo: "minutos" | "horas";
  rendimento: number;
  unidadeRendimento: string;
  ingredientes: IngredienteReceita[];
  embalagens: EmbalagemReceita[];
  modoPreparo?: string;
  custoTotal: number;
  valorVenda?: number;
  outrosGastosPersonalizados?: Array<{ id: string; nome: string; valor: number }>;
  despesasVenda?: Array<{ id: string; nome: string; percentual: number; valor: number }>;
  imagens?: string[];
}

export default function ReceitaForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [receitas, setReceitas] = useLocalStorage<Receita[]>("receitas", []);
  const [ingredientesCadastrados, setIngredientesCadastrados] = useState<any[]>([]);
  const [embalagensCadastradas] = useLocalStorage<Embalagem[]>("embalagens", []);
  const [custosFixos] = useLocalStorage<CustoFixo[]>("custosFixos", []);
  const { categorias } = useCategorias();
  const { unidades } = useUnidadesMedida();

  // Buscar ingredientes do Supabase
  useEffect(() => {
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
          .eq('usuario_id', user.id)
          .order('created_at', { ascending: false });

        if (ingredientesError) throw ingredientesError;
        
        // Buscar receitas do tipo "Produto para Combo" do localStorage
        let receitasCombo: any[] = [];
        const receitasStorage = localStorage.getItem('receitas');
        
        if (receitasStorage) {
          const receitas = JSON.parse(receitasStorage);
          receitasCombo = receitas
            .filter((r: any) => r.tipo === 'produto_combo')
            .map((r: any) => {
              // Buscar a sigla correta da unidade de medida
              const unidade = unidades.find(u => u.id === r.unidadeRendimento);
              const siglaNome = unidade?.sigla || unidade?.nome || 'un';
              
              return {
                id: `receita_${r.id}`,
                preco: r.custoTotal || 0,
                marca: 'Receita',
                tipo_insumo: {
                  id: `tipo_receita_${r.id}`,
                  descricao: r.nome,
                  quantidade_embalagem: r.rendimento || 1,
                  pre_preparo_id: null,
                  unidade_medida: {
                    nome: siglaNome,
                    sigla: siglaNome
                  }
                },
                e_receita_combo: true
              };
            });
        }
        
        // Combinar ingredientes e receitas combo
        const todosItens = [...(ingredientesData || []), ...receitasCombo];
        setIngredientesCadastrados(todosItens);
      } catch (error) {
        console.error('Erro ao buscar ingredientes:', error);
      }
    };

    fetchIngredientes();
  }, []);

  const [formData, setFormData] = useState({
    nome: "",
    categoria: "",
    tipo: "produto_avulso" as "produto_avulso" | "produto_combo",
    cardapio: "ativo" as "ativo" | "fora",
    tempoPreparo: "",
    unidadeTempo: "minutos" as "minutos" | "horas",
    rendimento: "",
    unidadeRendimentoId: "",
  });

  const [ingredientes, setIngredientes] = useState<IngredienteReceita[]>([]);
  const [embalagens, setEmbalagens] = useState<EmbalagemReceita[]>([]);
  const [modoPreparo, setModoPreparo] = useState("");
  const [imagens, setImagens] = useState<string[]>([]);
  
  // Estados para precificação
  const [outrosGastosPersonalizados, setOutrosGastosPersonalizados] = useState([
    { id: '1', nome: '', valor: 0 },
    { id: '2', nome: '', valor: 0 },
    { id: '3', nome: '', valor: 0 },
  ]);
  const [despesasVenda, setDespesasVenda] = useState([
    { id: 'impostos', nome: 'Impostos', percentual: 0, valor: 0 },
    { id: 'taxa_cartao', nome: 'Taxa de Cartão', percentual: 0, valor: 0 },
    { id: 'comissao_delivery', nome: 'Comissão Delivery', percentual: 0, valor: 0 },
    { id: 'entrega', nome: 'Entrega', percentual: 0, valor: 0 },
    { id: 'outros_despesas', nome: 'Outros', percentual: 0, valor: 0 },
  ]);
  const [valorVenda, setValorVenda] = useState(0);

  useEffect(() => {
    if (id) {
      const receita = receitas.find(r => r.id === id);
      if (receita) {
        setFormData({
          nome: receita.nome,
          categoria: receita.categoria || "",
          tipo: receita.tipo || "produto_avulso",
          cardapio: receita.cardapio || "ativo",
          tempoPreparo: receita.tempoPreparo.toString(),
          unidadeTempo: receita.unidadeTempo,
          rendimento: receita.rendimento.toString(),
          unidadeRendimentoId: receita.unidadeRendimento,
        });
        setIngredientes(receita.ingredientes);
        setEmbalagens(receita.embalagens || []);
        setModoPreparo(receita.modoPreparo || "");
        setValorVenda(receita.valorVenda || 0);
        setImagens(receita.imagens || []);
        if (receita.outrosGastosPersonalizados) {
          setOutrosGastosPersonalizados(receita.outrosGastosPersonalizados);
        }
        if (receita.despesasVenda) {
          setDespesasVenda(receita.despesasVenda);
        }
      }
    }
  }, [id, receitas]);

  const calcularCustos = (ingrediente: IngredienteReceita): IngredienteReceita => {
    const custoUnitario = ingrediente.precoEmbalagem / ingrediente.qtdeEmbalagem;
    const custoReceita = custoUnitario * ingrediente.quantidadeUtilizada;
    return {
      ...ingrediente,
      custoUnitario,
      custoReceita,
    };
  };

  const handleAddIngrediente = () => {
    const novoIngrediente: IngredienteReceita = {
      id: Date.now().toString(),
      ingredienteId: "",
      ingrediente: "",
      marca: "",
      qtdeEmbalagem: 0,
      unidadeMedida: "",
      precoEmbalagem: 0,
      quantidadeUtilizada: 0,
      custoUnitario: 0,
      custoReceita: 0,
    };
    setIngredientes([...ingredientes, novoIngrediente]);
  };

  const handleSelectIngrediente = (index: number, ingredienteId: string) => {
    const ingredienteSelecionado = ingredientesCadastrados.find(i => i.id === ingredienteId);
    if (ingredienteSelecionado) {
      const novosIngredientes = [...ingredientes];
      novosIngredientes[index] = calcularCustos({
        ...novosIngredientes[index],
        ingredienteId: ingredienteSelecionado.id,
        ingrediente: ingredienteSelecionado.tipo_insumo?.descricao || "",
        marca: ingredienteSelecionado.marca || "",
        qtdeEmbalagem: ingredienteSelecionado.tipo_insumo?.quantidade_embalagem || 0,
        unidadeMedida: ingredienteSelecionado.tipo_insumo?.unidade_medida?.sigla || "",
        precoEmbalagem: ingredienteSelecionado.preco || 0,
      });
      setIngredientes(novosIngredientes);
    }
  };

  const handleQuantidadeChange = (index: number, quantidade: number) => {
    const novosIngredientes = [...ingredientes];
    novosIngredientes[index] = calcularCustos({
      ...novosIngredientes[index],
      quantidadeUtilizada: quantidade,
    });
    setIngredientes(novosIngredientes);
  };

  const handleRemoveIngrediente = (index: number) => {
    setIngredientes(ingredientes.filter((_, i) => i !== index));
  };

  // Funções para Embalagens
  const calcularCustosEmbalagem = (embalagem: EmbalagemReceita): EmbalagemReceita => {
    const custoUnitario = embalagem.precoEmbalagem / embalagem.qtdeEmbalagem;
    const custoReceita = custoUnitario * embalagem.quantidadeUtilizada;
    return {
      ...embalagem,
      custoUnitario,
      custoReceita,
    };
  };

  const handleAddEmbalagem = () => {
    const novaEmbalagem: EmbalagemReceita = {
      id: Date.now().toString(),
      embalagemId: "",
      embalagem: "",
      marca: "",
      qtdeEmbalagem: 0,
      unidadeMedida: "",
      precoEmbalagem: 0,
      quantidadeUtilizada: 0,
      custoUnitario: 0,
      custoReceita: 0,
    };
    setEmbalagens([...embalagens, novaEmbalagem]);
  };

  const handleSelectEmbalagem = (index: number, embalagemId: string) => {
    const embalagemSelecionada = embalagensCadastradas.find(e => e.id === embalagemId);
    if (embalagemSelecionada) {
      const novasEmbalagens = [...embalagens];
      novasEmbalagens[index] = calcularCustosEmbalagem({
        ...novasEmbalagens[index],
        embalagemId: embalagemSelecionada.id,
        embalagem: embalagemSelecionada.nome,
        marca: embalagemSelecionada.marca,
        qtdeEmbalagem: embalagemSelecionada.quantidade,
        unidadeMedida: embalagemSelecionada.unidadeMedida,
        precoEmbalagem: embalagemSelecionada.preco,
      });
      setEmbalagens(novasEmbalagens);
    }
  };

  const handleQuantidadeEmbalagemChange = (index: number, quantidade: number) => {
    const novasEmbalagens = [...embalagens];
    novasEmbalagens[index] = calcularCustosEmbalagem({
      ...novasEmbalagens[index],
      quantidadeUtilizada: quantidade,
    });
    setEmbalagens(novasEmbalagens);
  };

  const handleRemoveEmbalagem = (index: number) => {
    setEmbalagens(embalagens.filter((_, i) => i !== index));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImagens(prev => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleRemoveImage = (index: number) => {
    setImagens(imagens.filter((_, i) => i !== index));
  };

  // Cálculos de custos
  const custoIngredientes = ingredientes.reduce((total, ing) => total + ing.custoReceita, 0);
  const custoEmbalagens = embalagens.reduce((total, emb) => total + emb.custoReceita, 0);
  
  // Calcular custo fixo baseado no tempo de preparo
  const totalCustosFixosMensal = custosFixos.reduce((acc, custo) => acc + custo.valor, 0);
  const horasTrabalhadasMes = 176; // ~22 dias * 8 horas
  const custoFixoPorHora = totalCustosFixosMensal / horasTrabalhadasMes;
  const tempoPreparoHoras = formData.unidadeTempo === "horas" 
    ? Number(formData.tempoPreparo) 
    : Number(formData.tempoPreparo) / 60;
  const custoFixoReceita = custoFixoPorHora * tempoPreparoHoras;
  
  // Calcular outros gastos personalizados
  const handleOutroGastoChange = (index: number, field: 'nome' | 'valor', value: string | number) => {
    const novosGastos = [...outrosGastosPersonalizados];
    if (field === 'nome') {
      novosGastos[index].nome = value as string;
    } else {
      novosGastos[index].valor = value as number;
    }
    setOutrosGastosPersonalizados(novosGastos);
  };

  const handleAddOutroGasto = () => {
    setOutrosGastosPersonalizados([...outrosGastosPersonalizados, { id: Date.now().toString(), nome: '', valor: 0 }]);
  };

  const handleRemoveOutroGasto = (index: number) => {
    if (outrosGastosPersonalizados.length > 3) {
      setOutrosGastosPersonalizados(outrosGastosPersonalizados.filter((_, i) => i !== index));
    }
  };

  const outrosGastosValor = outrosGastosPersonalizados.reduce((acc, gasto) => acc + (gasto.valor || 0), 0);
  
  // Custo total sem taxas
  const custoTotal = custoIngredientes + custoEmbalagens + custoFixoReceita + outrosGastosValor;
  
  // Calcular despesas de venda automaticamente quando o valor de venda mudar
  useEffect(() => {
    if (valorVenda > 0) {
      const novasDespesas = despesasVenda.map(despesa => ({
        ...despesa,
        valor: valorVenda * (despesa.percentual / 100)
      }));
      setDespesasVenda(novasDespesas);
    }
  }, [valorVenda]);

  const handleDespesaChange = (index: number, field: 'percentual' | 'valor', value: number) => {
    const novasDespesas = [...despesasVenda];
    if (field === 'percentual') {
      novasDespesas[index].percentual = value;
      novasDespesas[index].valor = valorVenda * (value / 100);
    } else {
      novasDespesas[index].valor = value;
      novasDespesas[index].percentual = valorVenda > 0 ? (value / valorVenda) * 100 : 0;
    }
    setDespesasVenda(novasDespesas);
  };

  const totalDespesasVenda = despesasVenda.reduce((acc, despesa) => acc + despesa.valor, 0);
  
  // CMV (Custo da Mercadoria Vendida) = Custo Total + Despesas de Venda
  const cmv = custoTotal + totalDespesasVenda;
  const percentualCMV = valorVenda > 0 ? (cmv / valorVenda) * 100 : 0;
  
  // Sugestões de venda com diferentes CMVs
  const sugestoesCMV = [
    { cmv: 30, valorVenda: custoTotal > 0 ? custoTotal / 0.30 : 0 },
    { cmv: 40, valorVenda: custoTotal > 0 ? custoTotal / 0.40 : 0 },
    { cmv: 50, valorVenda: custoTotal > 0 ? custoTotal / 0.50 : 0 },
  ].map(sugestao => ({
    ...sugestao,
    margemContribuicao: sugestao.valorVenda - custoTotal,
    percentualMargem: sugestao.valorVenda > 0 ? ((sugestao.valorVenda - custoTotal) / sugestao.valorVenda) * 100 : 0,
  }));
  
  // Margem de contribuição
  const margemContribuicao = valorVenda - cmv;
  const percentualMargemContribuicao = valorVenda > 0 ? (margemContribuicao / valorVenda) * 100 : 0;

  const handleSave = () => {
    if (!formData.nome.trim()) {
      toast.error("Por favor, informe o nome da receita");
      return;
    }

    if (!formData.tempoPreparo || Number(formData.tempoPreparo) <= 0) {
      toast.error("Por favor, informe um tempo de preparo válido");
      return;
    }

    if (!formData.rendimento || Number(formData.rendimento) <= 0) {
      toast.error("Por favor, informe um rendimento válido");
      return;
    }

    const unidadeSelecionada = unidades.find(u => u.id === formData.unidadeRendimentoId);

    const receita: Receita = {
      id: id || Date.now().toString(),
      nome: formData.nome,
      categoria: formData.categoria,
      tipo: formData.tipo,
      cardapio: formData.cardapio,
      tempoPreparo: Number(formData.tempoPreparo),
      unidadeTempo: formData.unidadeTempo,
      rendimento: Number(formData.rendimento),
      unidadeRendimento: formData.unidadeRendimentoId,
      ingredientes,
      embalagens,
      modoPreparo,
      custoTotal,
      valorVenda,
      outrosGastosPersonalizados,
      despesasVenda,
      imagens,
    };

    if (id) {
      setReceitas(receitas.map(r => r.id === id ? receita : r));
      toast.success("Receita atualizada com sucesso!");
    } else {
      setReceitas([...receitas, receita]);
      toast.success("Receita criada com sucesso!");
    }

    // Se for "Produto para Combo", adicionar automaticamente aos ingredientes
    if (formData.tipo === "produto_combo") {
      const ingredienteExistente = ingredientesCadastrados.find(
        ing => ing.nome === formData.nome && ing.marca === "Receita"
      );

      const novoIngrediente: Ingrediente = {
        id: ingredienteExistente?.id || Date.now().toString(),
        nome: formData.nome,
        marca: "Receita",
        quantidade: Number(formData.rendimento),
        unidadeMedida: unidadeSelecionada?.sigla || "un",
        preco: custoTotal,
        dataAtualizacao: new Date().toISOString().split('T')[0],
      };

      if (ingredienteExistente) {
        // Atualizar ingrediente existente
        setIngredientesCadastrados(
          ingredientesCadastrados.map(ing => 
            ing.id === ingredienteExistente.id ? novoIngrediente : ing
          )
        );
      } else {
        // Adicionar novo ingrediente
        setIngredientesCadastrados([...ingredientesCadastrados, novoIngrediente]);
      }
      
      toast.success("Produto também adicionado aos ingredientes!");
    }

    navigate("/precificacao/ficha-tecnica");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton to="/precificacao/ficha-tecnica" />
        <div className="flex-1">
          <PageHeader
            title={id ? "Editar Ficha Técnica" : "Nova Ficha Técnica"}
            description="Calcule Custos e Preços de Venda"
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome da Receita *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Bolo de Chocolate"
              />
            </div>

            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value })}
              >
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Nenhuma categoria cadastrada.{" "}
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => navigate("/cadastros/categorias")}
                      >
                        Cadastrar agora
                      </Button>
                    </div>
                  )}
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.nome}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cardapio">Cardápio</Label>
              <Select
                value={formData.cardapio}
                onValueChange={(value: "ativo" | "fora") => setFormData({ ...formData, cardapio: value })}
              >
                <SelectTrigger id="cardapio">
                  <SelectValue placeholder="Status do cardápio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="fora">Fora</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: "produto_avulso" | "produto_combo") => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="produto_avulso">Produto Avulso</SelectItem>
                  <SelectItem value="produto_combo">Produto para Combo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tempoPreparo">Tempo de Preparo *</Label>
              <div className="flex gap-2">
                <Input
                  id="tempoPreparo"
                  type="number"
                  min="1"
                  value={formData.tempoPreparo}
                  onChange={(e) => setFormData({ ...formData, tempoPreparo: e.target.value })}
                  placeholder="Ex: 30"
                  className="flex-1"
                />
                <Select
                  value={formData.unidadeTempo}
                  onValueChange={(value: "minutos" | "horas") => setFormData({ ...formData, unidadeTempo: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutos">Minutos</SelectItem>
                    <SelectItem value="horas">Horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="rendimento">Rendimento *</Label>
                <Input
                  id="rendimento"
                  type="number"
                  min="1"
                  value={formData.rendimento}
                  onChange={(e) => setFormData({ ...formData, rendimento: e.target.value })}
                  placeholder="Ex: 500"
                />
              </div>
              <div>
                <Label htmlFor="unidadeRendimento">Unid. de Medida *</Label>
                <Select
                  value={formData.unidadeRendimentoId}
                  onValueChange={(value) => setFormData({ ...formData, unidadeRendimentoId: value })}
                >
                  <SelectTrigger id="unidadeRendimento">
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

          <div className="space-y-4">
            <div className="flex justify-start items-center">
              <Button type="button" variant="default" size="sm" onClick={handleAddIngrediente}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Ingrediente
              </Button>
            </div>

            {ingredientes.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingrediente</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Qtde Embalagem</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Preço Emb.</TableHead>
                      <TableHead>Qtde Utilizada</TableHead>
                      <TableHead>Custo</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingredientes.map((ingrediente, index) => (
                      <TableRow key={ingrediente.id}>
                        <TableCell className="min-w-[300px]">
                          <Select
                            value={ingrediente.ingredienteId}
                            onValueChange={(value) => handleSelectIngrediente(index, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um ingrediente" />
                            </SelectTrigger>
                            <SelectContent>
                              {ingredientesCadastrados.map((ing) => (
                                <SelectItem key={ing.id} value={ing.id}>
                                  {ing.tipo_insumo?.descricao} {ing.marca ? `- ${ing.marca}` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm">{ingrediente.marca}</TableCell>
                        <TableCell className="text-sm">{ingrediente.qtdeEmbalagem || "-"}</TableCell>
                        <TableCell className="text-sm">{ingrediente.unidadeMedida}</TableCell>
                        <TableCell className="text-sm">
                          {ingrediente.precoEmbalagem ? `R$ ${ingrediente.precoEmbalagem.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={ingrediente.quantidadeUtilizada || ""}
                            onChange={(e) => handleQuantidadeChange(index, parseFloat(e.target.value) || 0)}
                            className="w-24"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell className="text-sm">
                          R$ {ingrediente.custoReceita.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveIngrediente(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {ingredientes.length > 0 && (
              <div className="flex justify-end">
                <div className="text-lg font-bold">
                  Custo Total dos Ingredientes: R$ {ingredientes.reduce((total, ing) => total + ing.custoReceita, 0).toFixed(2)}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-start items-center">
              <Button type="button" variant="default" size="sm" onClick={handleAddEmbalagem}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Embalagem
              </Button>
            </div>

            {embalagens.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Embalagem</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Qtde Embalagem</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Preço Emb.</TableHead>
                      <TableHead>Qtde Utilizada</TableHead>
                      <TableHead>Custo Unit.</TableHead>
                      <TableHead>Custo Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {embalagens.map((embalagem, index) => (
                      <TableRow key={embalagem.id}>
                        <TableCell className="min-w-[300px]">
                          <EmbalagemAutocomplete
                            value={embalagem.embalagemId}
                            onSelect={(selectedEmbalagem) => {
                              const novosEmbalagens = [...embalagens];
                              novosEmbalagens[index] = {
                                ...embalagem,
                                embalagemId: selectedEmbalagem.embalagemId,
                                embalagem: selectedEmbalagem.embalagem,
                                marca: selectedEmbalagem.marca,
                                qtdeEmbalagem: selectedEmbalagem.qtdeEmbalagem,
                                unidadeMedida: selectedEmbalagem.unidadeMedida,
                                precoEmbalagem: selectedEmbalagem.precoEmbalagem,
                                custoUnitario: selectedEmbalagem.qtdeEmbalagem > 0 
                                  ? selectedEmbalagem.precoEmbalagem / selectedEmbalagem.qtdeEmbalagem 
                                  : 0,
                                custoReceita: embalagem.quantidadeUtilizada && selectedEmbalagem.qtdeEmbalagem > 0
                                  ? (selectedEmbalagem.precoEmbalagem / selectedEmbalagem.qtdeEmbalagem) * embalagem.quantidadeUtilizada
                                  : 0,
                              };
                              setEmbalagens(novosEmbalagens);
                            }}
                            placeholder="Selecione a embalagem"
                          />
                        </TableCell>
                        <TableCell className="text-sm">{embalagem.marca}</TableCell>
                        <TableCell className="text-sm">{embalagem.qtdeEmbalagem || "-"}</TableCell>
                        <TableCell className="text-sm">{embalagem.unidadeMedida}</TableCell>
                        <TableCell className="text-sm">
                          {embalagem.precoEmbalagem ? `R$ ${embalagem.precoEmbalagem.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={embalagem.quantidadeUtilizada || ""}
                            onChange={(e) => handleQuantidadeEmbalagemChange(index, parseFloat(e.target.value) || 0)}
                            className="w-24"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell className="text-sm">
                          R$ {embalagem.custoUnitario.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-sm font-semibold">
                          R$ {embalagem.custoReceita.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveEmbalagem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {embalagens.length > 0 && (
              <div className="flex justify-end">
                <div className="text-lg font-bold">
                  Custo Total das Embalagens: R$ {embalagens.reduce((total, emb) => total + emb.custoReceita, 0).toFixed(2)}
                </div>
              </div>
            )}
          </div>

          {/* Modo de Preparo */}
          {(ingredientes.length > 0 || embalagens.length > 0) && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="modo-preparo" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Modo de Preparo e Montagem</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-4">
                  <Textarea
                    value={modoPreparo}
                    onChange={(e) => setModoPreparo(e.target.value)}
                    placeholder="Descreva o passo a passo do preparo e montagem do produto...&#10;&#10;Exemplo:&#10;1. Pré-aqueça o forno a 180°C&#10;2. Misture os ingredientes secos em uma tigela&#10;3. Adicione os ingredientes líquidos..."
                    className="min-h-[200px] resize-y"
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* Upload de Imagens */}
          {(ingredientes.length > 0 || embalagens.length > 0) && (
            <div className="space-y-4">
              <Label>Imagens da Receita</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {imagens.map((imagem, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={imagem} 
                      alt={`Imagem ${index + 1}`} 
                      className="w-full h-40 object-cover rounded-lg border-2 border-border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground text-center px-2">
                      Clique para adicionar imagem
                    </p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Quadro de Precificação */}
          {(ingredientes.length > 0 || embalagens.length > 0) && (
            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-xl font-bold text-primary mb-4">💰 Precificação</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Custos Automáticos */}
                  <div className="space-y-3 p-4 rounded-lg bg-card border">
                    <h4 className="font-semibold text-sm text-muted-foreground">Custos Calculados</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Ingredientes:</span>
                        <span className="font-semibold text-primary">R$ {custoIngredientes.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Embalagens:</span>
                        <span className="font-semibold text-primary">R$ {custoEmbalagens.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Custos Fixos:</span>
                        <span className="font-semibold text-primary">R$ {custoFixoReceita.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="pt-3 mt-3 border-t">
                      <Button 
                        type="button" 
                        variant="default" 
                        className="w-full font-bold text-base"
                        disabled
                      >
                        Total: R$ {(custoIngredientes + custoEmbalagens + custoFixoReceita).toFixed(2)}
                      </Button>
                    </div>
                  </div>

                  {/* Outros Gastos */}
                  <div className="space-y-3 p-4 rounded-lg bg-card border">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-sm text-muted-foreground">Outros Gastos</h4>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddOutroGasto}>
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {outrosGastosPersonalizados.map((gasto, index) => (
                        <div key={gasto.id} className="flex gap-2 items-center">
                          <Input
                            type="text"
                            value={gasto.nome}
                            onChange={(e) => handleOutroGastoChange(index, 'nome', e.target.value)}
                            placeholder="Ex: Topo de bolo"
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={gasto.valor || ""}
                            onChange={(e) => handleOutroGastoChange(index, 'valor', parseFloat(e.target.value) || 0)}
                            placeholder="R$ 0.00"
                            className="w-32"
                          />
                          {outrosGastosPersonalizados.length > 3 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveOutroGasto(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end pt-2 border-t text-sm font-bold">
                      Total: R$ {outrosGastosValor.toFixed(2)}
                    </div>
                  </div>

                  {/* Impostos / Despesas de Venda */}
                  <div className="md:col-span-2 space-y-3 p-4 rounded-lg bg-card border">
                    <h4 className="font-semibold text-sm text-muted-foreground">Impostos / Despesas de Venda</h4>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[150px]">Tipo</TableHead>
                            <TableHead className="w-[120px]">Percentual (%)</TableHead>
                            <TableHead className="w-[120px]">Valor (R$)</TableHead>
                            <TableHead className="w-[120px]">Calculado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {despesasVenda.map((despesa, index) => {
                            const valorCalculado = valorVenda > 0 ? despesa.valor : 0;
                            return (
                              <TableRow key={despesa.id}>
                                <TableCell className="font-medium">{despesa.nome}</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={despesa.percentual || ""}
                                    onChange={(e) => handleDespesaChange(index, 'percentual', parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                    className="w-full"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={despesa.valor || ""}
                                    onChange={(e) => handleDespesaChange(index, 'valor', parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                    className="w-full"
                                  />
                                </TableCell>
                                <TableCell className="font-semibold text-primary">
                                  R$ {valorCalculado.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex justify-end pt-2 border-t">
                      <div className="text-sm font-bold">
                        Total Despesas: R$ {totalDespesasVenda.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Custo Total */}
                  <div className="space-y-3 p-4 rounded-lg bg-primary/10 border-primary/30 border-2">
                    <h4 className="font-semibold text-sm">Custo Total (CMV)</h4>
                    <div className="text-3xl font-bold text-primary">
                      R$ {cmv.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Precificação */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  {sugestoesCMV.map((sugestao, index) => (
                    <div key={sugestao.cmv} className={`space-y-3 p-4 rounded-lg border-2 ${index === 0 ? 'bg-accent/50 border-accent' : 'bg-card border-muted'}`}>
                      <h4 className="font-semibold">💡 Sugestão CMV {sugestao.cmv}%</h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Valor de Venda</p>
                          <div className="text-2xl font-bold text-primary">
                            R$ {sugestao.valorVenda.toFixed(2)}
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground">Margem de Contribuição</p>
                          <div className="text-lg font-bold text-chart-2">
                            R$ {sugestao.margemContribuicao.toFixed(2)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {sugestao.percentualMargem.toFixed(1)}% do valor de venda
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-3 p-4 rounded-lg bg-card border-2">
                    <h4 className="font-semibold">🎯 Valor de Venda</h4>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={valorVenda || ""}
                      onChange={(e) => setValorVenda(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="text-xl font-bold"
                    />
                  </div>
                </div>

                {/* Análise da Venda */}
                {valorVenda > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-3">
                      <div className={`space-y-2 p-4 rounded-lg border-2 transition-all duration-300 ${
                        percentualCMV <= 35 
                          ? 'bg-green-50 border-green-500 shadow-lg shadow-green-200' 
                          : percentualCMV <= 45 
                            ? 'bg-yellow-50 border-yellow-500 shadow-lg shadow-yellow-200' 
                            : 'bg-red-50 border-red-500 shadow-lg shadow-red-200 animate-pulse'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {percentualCMV <= 35 ? '✅' : percentualCMV <= 45 ? '⚠️' : '❌'}
                          </span>
                          <h4 className="font-semibold text-sm">📊 CMV Real</h4>
                          <span className="text-2xl ml-auto">
                            {percentualCMV <= 35 ? '😊' : percentualCMV <= 45 ? '😐' : '😰'}
                          </span>
                        </div>
                        <div className={`font-bold transition-all ${
                          percentualCMV <= 35 
                            ? 'text-4xl text-green-600' 
                            : percentualCMV <= 45 
                              ? 'text-3xl text-yellow-600' 
                              : 'text-5xl text-red-600'
                        }`}>
                          {percentualCMV.toFixed(1)}%
                        </div>
                        <p className={`text-sm font-semibold ${
                          percentualCMV <= 35 
                            ? 'text-green-700' 
                            : percentualCMV <= 45 
                              ? 'text-yellow-700' 
                              : 'text-red-700'
                        }`}>
                          {percentualCMV <= 35 
                            ? '✓ Excelente! CMV muito saudável' 
                            : percentualCMV <= 45 
                              ? '⚠ Aceitável, mas pode melhorar' 
                              : '✗ ATENÇÃO! CMV muito alto'}
                        </p>
                      </div>
                      
                      <div className={`text-sm p-3 rounded-lg font-medium ${
                        percentualCMV <= 35 
                          ? 'bg-green-100 text-green-800 border border-green-300' 
                          : percentualCMV <= 45 
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
                            : 'bg-red-100 text-red-800 border border-red-300'
                      }`}>
                        <p className="font-bold text-base mb-1">
                          {percentualCMV <= 35 
                            ? '🎉 PARABÉNS!' 
                            : percentualCMV <= 45 
                              ? '💡 ATENÇÃO!' 
                              : '🚨 ALERTA IMPORTANTE!'}
                        </p>
                        <p className="text-xs leading-relaxed">
                          {percentualCMV <= 35 
                            ? 'Sua margem de lucro está ótima. Com esse CMV, você terá uma boa margem para cobrir despesas operacionais e ainda gerar lucro.' 
                            : percentualCMV <= 45 
                              ? 'Seu CMV está na faixa aceitável, mas há espaço para otimização. Considere revisar custos de ingredientes ou ajustar o preço de venda para aumentar sua margem.' 
                              : 'CMV acima de 45% pode comprometer sua lucratividade! Riscos: pouca margem para despesas operacionais, dificuldade em cobrir custos fixos, vulnerabilidade a variações de preço. Recomenda-se: renegociar preços com fornecedores, otimizar receita ou aumentar preço de venda.'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className={`space-y-2 p-4 rounded-lg border-2 transition-all duration-300 ${
                        percentualMargemContribuicao >= 65 
                          ? 'bg-green-50 border-green-500 shadow-lg shadow-green-200' 
                          : percentualMargemContribuicao >= 55 
                            ? 'bg-yellow-50 border-yellow-500 shadow-lg shadow-yellow-200' 
                            : 'bg-red-50 border-red-500 shadow-lg shadow-red-200 animate-pulse'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {percentualMargemContribuicao >= 65 ? '✅' : percentualMargemContribuicao >= 55 ? '⚠️' : '❌'}
                          </span>
                          <h4 className="font-semibold text-sm">💵 Margem de Contribuição</h4>
                          <span className="text-2xl ml-auto">
                            {percentualMargemContribuicao >= 65 ? '🎊' : percentualMargemContribuicao >= 55 ? '😕' : '😱'}
                          </span>
                        </div>
                        <div className={`font-bold transition-all ${
                          percentualMargemContribuicao >= 65 
                            ? 'text-4xl text-green-600' 
                            : percentualMargemContribuicao >= 55 
                              ? 'text-3xl text-yellow-600' 
                              : 'text-5xl text-red-600'
                        }`}>
                          R$ {margemContribuicao.toFixed(2)}
                        </div>
                        <p className={`text-sm font-semibold ${
                          percentualMargemContribuicao >= 65 
                            ? 'text-green-700' 
                            : percentualMargemContribuicao >= 55 
                              ? 'text-yellow-700' 
                              : 'text-red-700'
                        }`}>
                          {percentualMargemContribuicao.toFixed(1)}% do valor de venda
                        </p>
                      </div>
                      
                      <div className={`text-sm p-3 rounded-lg font-medium ${
                        percentualMargemContribuicao >= 65 
                          ? 'bg-green-100 text-green-800 border border-green-300' 
                          : percentualMargemContribuicao >= 55 
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
                            : 'bg-red-100 text-red-800 border border-red-300'
                      }`}>
                        <p className="font-bold text-base mb-1">
                          {percentualMargemContribuicao >= 65 
                            ? '🎉 EXCELENTE MARGEM!' 
                            : percentualMargemContribuicao >= 55 
                              ? '💡 MARGEM RAZOÁVEL!' 
                              : '🚨 MARGEM MUITO BAIXA!'}
                        </p>
                        <p className="text-xs leading-relaxed">
                          {percentualMargemContribuicao >= 65 
                            ? 'Ótima margem de contribuição! Você tem recursos suficientes para cobrir despesas operacionais, investir no negócio e garantir um bom lucro.' 
                            : percentualMargemContribuicao >= 55 
                              ? 'Margem aceitável, mas pode ser melhorada. Busque reduzir custos ou aumentar o preço de venda para ter mais recursos disponíveis após cobrir o CMV.' 
                              : 'Margem insuficiente! Com essa margem baixa, pode ser difícil cobrir todas as despesas operacionais (aluguel, luz, salários, etc.) e ainda ter lucro. É crucial revisar sua precificação ou reduzir custos.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => navigate("/precificacao/ficha-tecnica")}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {id ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
