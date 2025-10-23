import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, ShoppingBag, DollarSign, Clock, CalendarCheck, Package, Upload, X, HandCoins, Tag as TagIcon, FileDown, Calendar, ClipboardList, CheckCircle2, XCircle, AlertCircle, ChevronDown } from "lucide-react";
import { format, isToday, isTomorrow, isWithinInterval, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEncomendas } from "@/hooks/useEncomendas";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ClienteAutocomplete } from "@/components/ClienteAutocomplete";
import { useClientes } from "@/hooks/useClientes";
import { useReceitas } from "@/hooks/useReceitas";
import { useEncomendaItens } from "@/hooks/useEncomendaItens";
import { useUnidadesMedida } from "@/hooks/useUnidadesMedida";
import ContasReceberFormModal from "@/components/financeiro/ContasReceberFormModal";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

const statusColors = {
  pendente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmado: "bg-blue-100 text-blue-800 border-blue-200",
  em_producao: "bg-purple-100 text-purple-800 border-purple-200",
  pronto: "bg-green-100 text-green-800 border-green-200",
  entregue: "bg-gray-100 text-gray-800 border-gray-200",
  cancelado: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  em_producao: "Em Produção",
  pronto: "Pronto",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const Encomendas = () => {
  const navigate = useNavigate();
  const { encomendas, loading, createEncomenda, updateEncomenda, deleteEncomenda } = useEncomendas();
  const { clientes } = useClientes();
  const { receitas } = useReceitas();
  const { unidades } = useUnidadesMedida();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [produtoDialogOpen, setProdutoDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [clienteFilter, setClienteFilter] = useState("Todos");
  const [dataEntregaFilter, setDataEntregaFilter] = useState("");
  const [horaEntregaFilter, setHoraEntregaFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("todos");
  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);
  const [contaReceberId, setContaReceberId] = useState<string | null>(null);
  const [planoContasVendaId, setPlanoContasVendaId] = useState<string>('');
  const [porPagina, setPorPagina] = useState(10);
  const [buscaNome, setBuscaNome] = useState("");
  const [filtrosAbertos, setFiltrosAbertos] = useState(true);
  
  // Estados para Dashboard
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [indicadores, setIndicadores] = useState({
    total: 0,
    entregues: 0,
    canceladas: 0,
    pendentes: 0,
    confirmadas: 0,
    paraHoje: 0,
    paraAmanha: 0,
    paraEstaSemana: 0,
    paraMes: 0,
  });

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  
  // Estados para tags
  const [tagsDisponiveis, setTagsDisponiveis] = useState<any[]>([]);
  const [tagsSelecionadas, setTagsSelecionadas] = useState<any[]>([]);
  const [tempProdutos, setTempProdutos] = useState<Array<{
    id: string;
    receita_id: string;
    produto: string;
    quantidade: number;
    unidade_medida: string;
    valor_unitario: number;
    subtotal: number;
  }>>([]);
  
  const [formData, setFormData] = useState({
    cliente: "",
    data_pedido: new Date().toISOString().split("T")[0],
    data_entrega: "",
    hora_entrega: "",
    status: "pendente",
    valor: 0,
    observacoes: "",
    telefone: "",
    endereco: "",
    numero: "",
    cep: "",
    desconto_percentual: 0,
    desconto_valor: 0,
    taxa_entrega: 0,
    topo_bolo: 0,
    outros: 0,
    topo_tema: "",
    topo_aniversariante: "",
    topo_idade: "",
    topo_obs: "",
    topo_imagens: [] as string[],
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  const [produtoForm, setProdutoForm] = useState({
    receita_id: "",
    produto: "",
    quantidade: "",
    unidade_medida: "",
    valor_unitario: 0,
  });

  const { itens: produtosEncomenda, createItem, deleteItem } = useEncomendaItens(editingOrder?.id || null);

  // Usar produtos temporários quando criando nova encomenda, ou produtos salvos quando editando
  const produtosExibidos = editingOrder ? produtosEncomenda : tempProdutos;

  const valorTotalProdutos = useMemo(() => {
    return produtosExibidos.reduce((total, item) => total + item.subtotal, 0);
  }, [produtosExibidos]);

  const valorDesconto = useMemo(() => {
    const descontoPerc = (valorTotalProdutos * formData.desconto_percentual) / 100;
    return descontoPerc + formData.desconto_valor;
  }, [valorTotalProdutos, formData.desconto_percentual, formData.desconto_valor]);

  const valorFinal = useMemo(() => {
    return valorTotalProdutos - valorDesconto + formData.taxa_entrega + formData.topo_bolo + formData.outros;
  }, [valorTotalProdutos, valorDesconto, formData.taxa_entrega, formData.topo_bolo, formData.outros]);

  // Calcular indicadores do dashboard
  useEffect(() => {
    calcularIndicadores();
  }, [mesSelecionado, anoSelecionado, encomendas]);

  function calcularIndicadores() {
    if (!encomendas) return;

    const hoje = new Date();
    const amanha = addDays(hoje, 1);
    const fimSemana = addDays(hoje, 7);

    // Filtrar encomendas do mês selecionado pela DATA DE ENTREGA
    const encomendasMes = encomendas.filter((enc) => {
      if (!enc.data_entrega) return false;
      const dataEntrega = new Date(enc.data_entrega);
      return (
        dataEntrega.getMonth() === mesSelecionado &&
        dataEntrega.getFullYear() === anoSelecionado
      );
    });

    // CARDS DE VISÃO GERAL
    const total = encomendasMes.length;
    const entregues = encomendasMes.filter((e) => e.status === "entregue").length;
    const canceladas = encomendasMes.filter((e) => e.status === "cancelado").length;
    const pendentes = encomendasMes.filter((e) => e.status === "pendente").length;
    const confirmadas = encomendasMes.filter((e) => e.status === "confirmado").length;

    // CARDS DE URGÊNCIA (apenas status pendente)
    const encomendasPendentes = encomendasMes.filter(
      (e) => e.status === "pendente"
    );

    const paraHoje = encomendasPendentes.filter((e) => {
      if (!e.data_entrega) return false;
      return isToday(new Date(e.data_entrega));
    }).length;

    const paraAmanha = encomendasPendentes.filter((e) => {
      if (!e.data_entrega) return false;
      return isTomorrow(new Date(e.data_entrega));
    }).length;

    const paraEstaSemana = encomendasPendentes.filter((e) => {
      if (!e.data_entrega) return false;
      const dataEntrega = new Date(e.data_entrega);
      return (
        !isToday(dataEntrega) &&
        !isTomorrow(dataEntrega) &&
        isWithinInterval(dataEntrega, { start: addDays(hoje, 2), end: fimSemana })
      );
    }).length;

    const paraMes = pendentes;

    setIndicadores({
      total,
      entregues,
      canceladas,
      pendentes,
      confirmadas,
      paraHoje,
      paraAmanha,
      paraEstaSemana,
      paraMes,
    });
  }

  // Buscar o ID do plano de contas "Venda de Produtos" e tags ao carregar
  useEffect(() => {
    const fetchPlanoContasVenda = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('plano_contas')
          .select('id')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .ilike('descricao', '%venda%produto%')
          .limit(1)
          .single();

        if (data && !error) {
          setPlanoContasVendaId(data.id);
        }
      } catch (error) {
        console.error('Erro ao buscar plano de contas:', error);
      }
    };

    const fetchTags = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('tags_encomendas')
          .select('*')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .order('nome');

        if (error) throw error;
        setTagsDisponiveis(data || []);
      } catch (error) {
        console.error('Erro ao buscar tags:', error);
      }
    };

    fetchPlanoContasVenda();
    fetchTags();
  }, []);

  const resetForm = () => {
    setFormData({
      cliente: "",
      data_pedido: new Date().toISOString().split("T")[0],
      data_entrega: "",
      hora_entrega: "",
      status: "pendente",
      valor: 0,
      observacoes: "",
      telefone: "",
      endereco: "",
      numero: "",
      cep: "",
      desconto_percentual: 0,
      desconto_valor: 0,
      taxa_entrega: 0,
      topo_bolo: 0,
      outros: 0,
      topo_tema: "",
      topo_aniversariante: "",
      topo_idade: "",
      topo_obs: "",
      topo_imagens: [],
    });
    setEditingOrder(null);
    setTempProdutos([]);
    setContaReceberId(null);
    setTagsSelecionadas([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação dos campos obrigatórios
    if (!formData.data_pedido) {
      toast.error("A Data do Pedido é obrigatória!");
      return;
    }

    if (!formData.cliente || formData.cliente.trim() === "") {
      toast.error("O Nome do Cliente é obrigatório!");
      return;
    }

    // Verificar se tem produtos (para nova encomenda verifica tempProdutos, para edição verifica produtosEncomenda)
    const temProdutos = editingOrder ? produtosEncomenda.length > 0 : tempProdutos.length > 0;
    if (!temProdutos) {
      toast.error("Adicione pelo menos um produto à encomenda!");
      return;
    }

    // Verificar se o pagamento foi configurado
    if (!contaReceberId) {
      toast.error("Configure o pagamento antes de salvar a encomenda! Clique no botão 'Pagamento' para criar a conta a receber.");
      return;
    }
    
    try {
      // Preparar os dados com o valor final calculado
      const dadosParaSalvar = {
        ...formData,
        valor: valorFinal,
        data_entrega: formData.data_entrega || null, // Converte string vazia para null
        hora_entrega: formData.hora_entrega || null, // Converte string vazia para null
        conta_receber_id: contaReceberId || null, // Adiciona o ID da conta a receber
      };
      
      if (editingOrder) {
        await updateEncomenda(editingOrder.id, dadosParaSalvar);
        // Salvar tags ao atualizar
        if (tagsSelecionadas.length > 0 || editingOrder) {
          // Deletar tags antigas
          await supabase
            .from('encomendas_tags')
            .delete()
            .eq('encomenda_id', editingOrder.id);

          // Inserir novas tags
          if (tagsSelecionadas.length > 0) {
            const tagsData = tagsSelecionadas.map(tag => ({
              encomenda_id: editingOrder.id,
              tag_id: tag.id,
            }));
            await supabase.from('encomendas_tags').insert(tagsData);
          }
        }
      } else {
        const novaEncomenda = await createEncomenda(dadosParaSalvar);
        
        // Salvar produtos temporários na encomenda criada
        if (tempProdutos.length > 0 && novaEncomenda) {
          for (const produto of tempProdutos) {
            await createItem({
              encomenda_id: novaEncomenda.id,
              receita_id: produto.receita_id,
              produto: produto.produto,
              quantidade: produto.quantidade,
              unidade_medida: produto.unidade_medida,
              valor_unitario: produto.valor_unitario,
              subtotal: produto.subtotal,
            });
          }
        }

        // Salvar tags da nova encomenda
        if (tagsSelecionadas.length > 0 && novaEncomenda) {
          const tagsData = tagsSelecionadas.map(tag => ({
            encomenda_id: novaEncomenda.id,
            tag_id: tag.id,
          }));
          const { error: errorTags } = await supabase
            .from('encomendas_tags')
            .insert(tagsData);

          if (errorTags) {
            console.error('Erro ao salvar tags:', errorTags);
          }
        }
      }
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar encomenda");
    }
  };

  const handleEdit = async (encomenda: any) => {
    setEditingOrder(encomenda);
    setFormData({
      cliente: encomenda.cliente,
      data_pedido: encomenda.data_pedido,
      data_entrega: encomenda.data_entrega,
      hora_entrega: encomenda.hora_entrega || "",
      status: encomenda.status,
      valor: encomenda.valor,
      observacoes: encomenda.observacoes || "",
      telefone: encomenda.telefone || "",
      endereco: encomenda.endereco || "",
      numero: encomenda.numero || "",
      cep: encomenda.cep || "",
      desconto_percentual: encomenda.desconto_percentual || 0,
      desconto_valor: encomenda.desconto_valor || 0,
      taxa_entrega: encomenda.taxa_entrega || 0,
      topo_bolo: encomenda.topo_bolo || 0,
      outros: encomenda.outros || 0,
      topo_tema: encomenda.topo_tema || "",
      topo_aniversariante: encomenda.topo_aniversariante || "",
      topo_idade: encomenda.topo_idade || "",
      topo_obs: encomenda.topo_obs || "",
      topo_imagens: Array.isArray(encomenda.topo_imagens) ? encomenda.topo_imagens : [],
    });
    // Carregar o ID da conta a receber vinculada, se existir
    setContaReceberId(encomenda.conta_receber_id || null);
    
    // Buscar tags da encomenda
    try {
      const { data: tagsData } = await supabase
        .from('encomendas_tags')
        .select(`
          tag_id,
          tag:tags_encomendas (
            id,
            nome,
            cor
          )
        `)
        .eq('encomenda_id', encomenda.id);

      if (tagsData) {
        const tagsEncomenda = tagsData.map(t => t.tag).filter(Boolean);
        setTagsSelecionadas(tagsEncomenda);
      }
    } catch (error) {
      console.error('Erro ao buscar tags da encomenda:', error);
    }
    
    setDialogOpen(true);
  };

  const handleClienteSelect = (clienteNome: string) => {
    const cliente = clientes.find(c => c.nome === clienteNome);
    if (cliente) {
      setFormData({
        ...formData,
        cliente: clienteNome,
        telefone: cliente.telefone || "",
        endereco: cliente.endereco || "",
        numero: cliente.numero || "",
        cep: cliente.cep || "",
      });
    } else {
      setFormData({ ...formData, cliente: clienteNome });
    }
  };

  const handleProdutoSelect = (receitaId: string) => {
    const receita = receitas.find(r => r.id === receitaId);
    if (receita) {
      // Buscar a unidade de medida pelo ID
      const unidade = unidades.find(u => u.id === receita.unidadeRendimento);
      
      // Se não encontrar pelo ID, tentar buscar pela sigla (para compatibilidade com dados antigos)
      const unidadePorSigla = !unidade ? unidades.find(u => u.sigla === receita.unidadeRendimento) : null;
      
      const unidadeTexto = unidade?.sigla || unidadePorSigla?.sigla || receita.unidadeRendimento;
      
      // Calcular valor unitário: Preço de Venda / Quantidade (rendimento)
      const valorUnitario = receita.rendimento > 0 ? (receita.valorVenda || 0) / receita.rendimento : (receita.valorVenda || 0);
      
      setProdutoForm({
        receita_id: receitaId,
        produto: receita.nome,
        quantidade: "",
        unidade_medida: unidadeTexto,
        valor_unitario: valorUnitario,
      });
    }
  };

  const handleAddProduto = async () => {
    if (!produtoForm.receita_id || !produtoForm.quantidade) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const quantidade = parseFloat(produtoForm.quantidade);
    const subtotal = quantidade * produtoForm.valor_unitario;

    if (editingOrder) {
      // Se está editando, salvar direto no banco
      try {
        await createItem({
          encomenda_id: editingOrder.id,
          receita_id: produtoForm.receita_id,
          produto: produtoForm.produto,
          quantidade,
          unidade_medida: produtoForm.unidade_medida,
          valor_unitario: produtoForm.valor_unitario,
          subtotal,
        });
      } catch (error: any) {
        toast.error(error.message || "Erro ao adicionar produto");
        return;
      }
    } else {
      // Se está criando nova encomenda, adicionar em memória
      const novoProduto = {
        id: Math.random().toString(36).substr(2, 9),
        receita_id: produtoForm.receita_id,
        produto: produtoForm.produto,
        quantidade,
        unidade_medida: produtoForm.unidade_medida,
        valor_unitario: produtoForm.valor_unitario,
        subtotal,
      };
      setTempProdutos([...tempProdutos, novoProduto]);
      toast.success("Produto adicionado!");
    }

    setProdutoForm({
      receita_id: "",
      produto: "",
      quantidade: "",
      unidade_medida: "",
      valor_unitario: 0,
    });
    setProdutoDialogOpen(false);
  };

  const handleRemoveProduto = async (itemId: string) => {
    if (confirm("Tem certeza que deseja remover este produto?")) {
      if (editingOrder) {
        // Se está editando, deletar do banco
        try {
          await deleteItem(itemId);
        } catch (error: any) {
          toast.error(error.message || "Erro ao remover produto");
        }
      } else {
        // Se está criando, remover da lista temporária
        setTempProdutos(tempProdutos.filter(p => p.id !== itemId));
        toast.success("Produto removido!");
      }
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar se já tem 3 imagens
    if (formData.topo_imagens.length >= 3) {
      toast.error('Você pode enviar no máximo 3 imagens');
      return;
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas imagens');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('topo-bolo')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('topo-bolo')
        .getPublicUrl(filePath);

      setFormData({ ...formData, topo_imagens: [...formData.topo_imagens, publicUrl] });
      toast.success('Imagem enviada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao enviar imagem: ' + error.message);
    } finally {
      setUploadingImage(false);
      // Resetar o input para permitir upload do mesmo arquivo novamente
      event.target.value = '';
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    try {
      // Extrair o nome do arquivo da URL
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('topo-bolo')
          .remove([fileName]);
      }
      setFormData({ 
        ...formData, 
        topo_imagens: formData.topo_imagens.filter(img => img !== imageUrl) 
      });
      toast.success('Imagem removida');
    } catch (error: any) {
      console.error('Erro ao remover imagem:', error);
      toast.error('Erro ao remover imagem');
    }
  };

  const handleAbrirPagamento = () => {
    // Verificar se já existe conta vinculada
    if (contaReceberId) {
      toast.error('Esta encomenda já possui uma conta a receber. Alterações devem ser feitas no Módulo de Contas a Receber.');
      return;
    }

    // Validar se tem cliente
    if (!formData.cliente) {
      toast.error('Selecione o cliente antes de configurar o pagamento!');
      return;
    }

    // Validar se tem produtos
    if (produtosExibidos.length === 0) {
      toast.error('Adicione produtos antes de configurar o pagamento!');
      return;
    }

    // Abrir modal
    setModalPagamentoAberto(true);
  };

  const handleContaCriada = (contaId: string) => {
    console.log('✅ Conta a receber criada:', contaId);
    setContaReceberId(contaId);
    setModalPagamentoAberto(false);
    
    toast.success('Conta a receber criada e vinculada à encomenda!');
  };

  // Buscar ID do cliente selecionado
  const getClienteId = () => {
    const cliente = clientes.find(c => c.nome === formData.cliente);
    return cliente?.id || '';
  };

  // Gerar descrição dos produtos
  const getDescricaoProdutos = () => {
    if (produtosExibidos.length === 0) return 'Encomenda';
    return `Encomenda: ${produtosExibidos.map(p => p.produto).join(', ')}`;
  };

  const handleDarBaixa = async (encomenda: any) => {
    // Verificar se tem conta a receber vinculada
    if (!encomenda.conta_receber_id) {
      toast.error('Esta encomenda não possui conta a receber vinculada. Configure o pagamento primeiro.');
      return;
    }

    // Verificar se já foi confirmado
    if (encomenda.status === 'confirmado' || encomenda.status === 'em_producao' || encomenda.status === 'pronto' || encomenda.status === 'entregue') {
      toast.error('Esta encomenda já teve pagamento registrado.');
      return;
    }

    try {
      // Buscar a primeira parcela da conta a receber
      const { data: parcelas, error } = await supabase
        .from('contas_receber_parcelas')
        .select('*')
        .eq('conta_receber_id', encomenda.conta_receber_id)
        .order('numero_parcela', { ascending: true })
        .limit(1);

      if (error) throw error;

      if (!parcelas || parcelas.length === 0) {
        toast.error('Nenhuma parcela encontrada para esta conta.');
        return;
      }

      const primeiraParcela = parcelas[0];

      // Navegar para a página de detalhes com a parcela selecionada
      navigate(`/financeiro/contas-receber/detalhes/${encomenda.conta_receber_id}`, {
        state: { 
          parcelaId: primeiraParcela.id,
          voltarPara: '/encomendas',
          encomendaId: encomenda.id
        }
      });
    } catch (error: any) {
      console.error('Erro ao buscar parcela:', error);
      toast.error('Erro ao buscar parcela da conta a receber');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta encomenda?")) {
      try {
        await deleteEncomenda(id);
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir encomenda");
      }
    }
  };

  const handleExportarExcel = () => {
    try {
      // Preparar dados para exportação
      const dadosExportar = filteredOrders.map(encomenda => ({
        'Cliente': encomenda.cliente,
        'Status': statusLabels[encomenda.status as keyof typeof statusLabels],
        'Data Pedido': new Date(encomenda.data_pedido).toLocaleDateString("pt-BR"),
        'Data Entrega': encomenda.data_entrega ? new Date(encomenda.data_entrega).toLocaleDateString("pt-BR") : 'Aguardando Agendamento',
        'Hora Entrega': encomenda.hora_entrega ? encomenda.hora_entrega.slice(0, 5) : '-',
        'Tags': encomenda.tags && encomenda.tags.length > 0 ? encomenda.tags.map((t: any) => t.nome).join(', ') : '-',
        'Valor': `R$ ${encomenda.valor.toFixed(2)}`,
        'Telefone': encomenda.telefone || '-',
        'Endereço': encomenda.endereco || '-',
        'Observações': encomenda.observacoes || '-',
      }));

      // Criar planilha
      const ws = XLSX.utils.json_to_sheet(dadosExportar);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Encomendas");

      // Definir largura das colunas
      const columnWidths = [
        { wch: 25 }, // Cliente
        { wch: 15 }, // Status
        { wch: 15 }, // Data Pedido
        { wch: 15 }, // Data Entrega
        { wch: 12 }, // Hora Entrega
        { wch: 20 }, // Tags
        { wch: 15 }, // Valor
        { wch: 15 }, // Telefone
        { wch: 30 }, // Endereço
        { wch: 40 }, // Observações
      ];
      ws['!cols'] = columnWidths;

      // Gerar arquivo
      const nomeArquivo = `encomendas_${new Date().toLocaleDateString("pt-BR").replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(wb, nomeArquivo);

      toast.success('Planilha exportada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar planilha: ' + error.message);
    }
  };

  const filteredOrders = encomendas
    .filter(e => {
      const matchesStatus = statusFilter === "Todos" || e.status === statusFilter.toLowerCase().replace(" ", "_");
      const matchesCliente = clienteFilter === "Todos" || e.cliente === clienteFilter;
      const matchesDataEntrega = !dataEntregaFilter || e.data_entrega === dataEntregaFilter;
      const matchesHoraEntrega = !horaEntregaFilter || (e.hora_entrega && e.hora_entrega.slice(0, 5) === horaEntregaFilter);
      
      // Filtro por tag
      const matchesTag = tagFilter === "todos" || (e.tags && e.tags.some((t: any) => t.id === tagFilter));
      
      // Filtro por busca de nome
      const matchesBusca = !buscaNome || e.cliente.toLowerCase().includes(buscaNome.toLowerCase());
      
      return matchesStatus && matchesCliente && matchesDataEntrega && matchesHoraEntrega && matchesTag && matchesBusca;
    })
    .sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime());

  // Paginação
  const paginatedOrders = filteredOrders.slice(0, porPagina);

  // Lista de clientes únicos que possuem encomendas
  const clientesComEncomendas = Array.from(new Set(encomendas.map(e => e.cliente).filter(c => c && c.trim() !== ""))).sort();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestor de Encomendas"
        description="Controle completo de pedidos do cliente até a entrega"
        actions={
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Encomenda
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingOrder ? "Editar Encomenda" : "Nova Encomenda"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="data_pedido">Data do Pedido *</Label>
                    <Input
                      id="data_pedido"
                      type="date"
                      required
                      value={formData.data_pedido}
                      onChange={(e) =>
                        setFormData({ ...formData, data_pedido: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_entrega">Data de Entrega</Label>
                    <Input
                      id="data_entrega"
                      type="date"
                      value={formData.data_entrega}
                      onChange={(e) =>
                        setFormData({ ...formData, data_entrega: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hora_entrega">Hora da Entrega</Label>
                    <Input
                      id="hora_entrega"
                      type="time"
                      value={formData.hora_entrega}
                      onChange={(e) =>
                        setFormData({ ...formData, hora_entrega: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cliente">Nome do Cliente *</Label>
                    <ClienteAutocomplete
                      value={formData.cliente}
                      onSelect={handleClienteSelect}
                      placeholder="Selecione ou busque um cliente..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone/WhatsApp</Label>
                    <Input
                      id="telefone"
                      type="text"
                      value={formData.telefone}
                      onChange={(e) =>
                        setFormData({ ...formData, telefone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      type="text"
                      value={formData.endereco}
                      onChange={(e) =>
                        setFormData({ ...formData, endereco: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      type="text"
                      value={formData.numero}
                      onChange={(e) =>
                        setFormData({ ...formData, numero: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      type="text"
                      value={formData.cep}
                      onChange={(e) =>
                        setFormData({ ...formData, cep: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger className="bg-popover">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="confirmado">Confirmado</SelectItem>
                        <SelectItem value="em_producao">Em Produção</SelectItem>
                        <SelectItem value="pronto">Pronto</SelectItem>
                        <SelectItem value="entregue">Entregue</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Produtos da Encomenda</Label>
                    <Dialog open={produtoDialogOpen} onOpenChange={setProdutoDialogOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Produtos
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Adicionar Produto</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="produto-select">Produto *</Label>
                            <Select
                              value={produtoForm.receita_id}
                              onValueChange={handleProdutoSelect}
                            >
                              <SelectTrigger className="bg-popover">
                                <SelectValue placeholder="Selecione um produto..." />
                              </SelectTrigger>
                              <SelectContent className="bg-popover z-50">
                                {receitas.filter(r => r.id && r.id.trim() !== "").map((receita) => (
                                  <SelectItem key={receita.id} value={receita.id}>
                                    {receita.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="quantidade">Quantidade *</Label>
                              <Input
                                id="quantidade"
                                type="number"
                                step="0.01"
                                min="0"
                                value={produtoForm.quantidade}
                                onChange={(e) =>
                                  setProdutoForm({ ...produtoForm, quantidade: e.target.value })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="unidade-medida">Unidade de Medida</Label>
                              <Input
                                id="unidade-medida"
                                type="text"
                                disabled
                                value={produtoForm.unidade_medida || "Selecione um produto"}
                                className="bg-muted"
                              />
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="valor-unitario">Valor Unitário (R$)</Label>
                              <Input
                                id="valor-unitario"
                                type="number"
                                step="0.01"
                                min="0"
                                value={produtoForm.valor_unitario}
                                onChange={(e) =>
                                  setProdutoForm({ ...produtoForm, valor_unitario: Number(e.target.value) })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Subtotal</Label>
                              <Input
                                type="text"
                                disabled
                                value={`R$ ${(parseFloat(produtoForm.quantidade || "0") * produtoForm.valor_unitario).toFixed(2)}`}
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setProdutoDialogOpen(false)}
                            >
                              Cancelar
                            </Button>
                            <Button type="button" onClick={handleAddProduto}>
                              Adicionar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {produtosExibidos.length > 0 && (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead className="text-right">Qtd</TableHead>
                            <TableHead className="text-center">Un.</TableHead>
                            <TableHead className="text-right">Valor Unit.</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                            <TableHead className="text-center">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {produtosExibidos.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.produto}</TableCell>
                              <TableCell className="text-right">{item.quantidade}</TableCell>
                              <TableCell className="text-center">{item.unidade_medida}</TableCell>
                              <TableCell className="text-right">R$ {item.valor_unitario.toFixed(2)}</TableCell>
                              <TableCell className="text-right">R$ {item.subtotal.toFixed(2)}</TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveProduto(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={4} className="text-right font-bold">Sub Total:</TableCell>
                            <TableCell className="text-right font-bold">R$ {valorTotalProdutos.toFixed(2)}</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>

                      {/* Cards de Ajustes */}
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        {/* Desconto Concedido */}
                        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20">
                          <CardContent className="p-4">
                            <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
                              Desconto Concedido
                            </h4>
                            <div className="flex gap-2">
                              <div className="flex items-center gap-1 flex-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  value={formData.desconto_percentual || ""}
                                  onChange={(e) => setFormData({ ...formData, desconto_percentual: Number(e.target.value) })}
                                  className="h-9 text-sm"
                                  placeholder="0"
                                />
                                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">%</span>
                              </div>
                              <div className="flex items-center gap-1 flex-1">
                                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">R$</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={formData.desconto_valor || ""}
                                  onChange={(e) => setFormData({ ...formData, desconto_valor: Number(e.target.value) })}
                                  className="h-9 text-sm"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Taxa de Entrega */}
                        <Card className="border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20">
                          <CardContent className="p-4">
                            <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-3">
                              Taxa de Entrega
                            </h4>
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium text-green-800 dark:text-green-200">R$</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.taxa_entrega || ""}
                                onChange={(e) => setFormData({ ...formData, taxa_entrega: Number(e.target.value) })}
                                className="h-9 text-sm"
                                placeholder="0.00"
                              />
                            </div>
                          </CardContent>
                        </Card>

                        {/* Topo de Bolo */}
                        <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
                          <CardContent className="p-4">
                            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3">
                              Topo de Bolo
                            </h4>
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">R$</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.topo_bolo || ""}
                                onChange={(e) => setFormData({ ...formData, topo_bolo: Number(e.target.value) })}
                                className="h-9 text-sm"
                                placeholder="0.00"
                              />
                            </div>
                          </CardContent>
                        </Card>

                        {/* Outros */}
                        <Card className="border-l-4 border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20">
                          <CardContent className="p-4">
                            <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-3">
                              Outros
                            </h4>
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium text-purple-800 dark:text-purple-200">R$</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.outros || ""}
                                onChange={(e) => setFormData({ ...formData, outros: Number(e.target.value) })}
                                className="h-9 text-sm"
                                placeholder="0.00"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Cards sempre visíveis - Informações do Topo e Upload de Imagens */}
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        {/* Card de Informações do Topo */}
                        <Card className="border-l-4 border-l-pink-500 bg-pink-50/50 dark:bg-pink-950/20">
                          <CardContent className="p-4">
                            <h4 className="text-sm font-semibold text-pink-800 dark:text-pink-200 mb-3">
                              Informações do Topo de Bolo
                            </h4>
                            <div className="space-y-3">
                              <div>
                                <Label className="text-xs text-pink-700 dark:text-pink-300">Tema</Label>
                                <Input
                                  type="text"
                                  value={formData.topo_tema}
                                  onChange={(e) => setFormData({ ...formData, topo_tema: e.target.value })}
                                  className="h-9 text-sm mt-1"
                                  placeholder="Ex: Unicórnio, Futebol..."
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-pink-700 dark:text-pink-300">Nome do(a) Aniversariante</Label>
                                <Input
                                  type="text"
                                  value={formData.topo_aniversariante}
                                  onChange={(e) => setFormData({ ...formData, topo_aniversariante: e.target.value })}
                                  className="h-9 text-sm mt-1"
                                  placeholder="Nome"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-pink-700 dark:text-pink-300">Idade</Label>
                                <Input
                                  type="text"
                                  value={formData.topo_idade}
                                  onChange={(e) => setFormData({ ...formData, topo_idade: e.target.value })}
                                  className="h-9 text-sm mt-1"
                                  placeholder="Ex: 5 anos"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-pink-700 dark:text-pink-300">Observações</Label>
                                <Textarea
                                  value={formData.topo_obs}
                                  onChange={(e) => setFormData({ ...formData, topo_obs: e.target.value })}
                                  className="text-sm mt-1 min-h-[60px]"
                                  placeholder="Detalhes adicionais..."
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                      {/* Card de Upload de Imagens - Até 3 imagens */}
                        <Card className="border-l-4 border-l-pink-500 bg-pink-50/50 dark:bg-pink-950/20">
                          <CardContent className="p-4">
                            <h4 className="text-sm font-semibold text-pink-800 dark:text-pink-200 mb-3">
                              Imagens de Referência ({formData.topo_imagens.length}/3)
                            </h4>
                            <div className="space-y-3">
                              {/* Grid de imagens existentes */}
                              <div className="grid grid-cols-3 gap-2">
                                {formData.topo_imagens.map((imageUrl, index) => (
                                  <div key={index} className="relative group">
                                    <img
                                      src={imageUrl}
                                      alt={`Referência ${index + 1}`}
                                      className="w-full h-24 object-cover rounded-lg border-2 border-pink-200 dark:border-pink-700"
                                    />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => handleRemoveImage(imageUrl)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>

                              {/* Botão de upload */}
                              {formData.topo_imagens.length < 3 && (
                                <div className="border-2 border-dashed border-pink-300 dark:border-pink-700 rounded-lg p-4 text-center">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="topo-image-upload"
                                    disabled={uploadingImage}
                                  />
                                  <label
                                    htmlFor="topo-image-upload"
                                    className="cursor-pointer flex flex-col items-center gap-2"
                                  >
                                    <Upload className="h-8 w-8 text-pink-500" />
                                    <span className="text-sm text-pink-700 dark:text-pink-300">
                                      {uploadingImage ? "Enviando..." : "Clique para enviar imagem"}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      Máximo 5MB por imagem
                                    </span>
                                  </label>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Botões de Valor a Pagar e Pagamento */}
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-auto py-4 flex-col items-start border-2 border-primary/20 hover:border-primary/40 bg-primary/5 hover:bg-primary/10"
                        >
                          <span className="text-xs text-muted-foreground mb-1">Valor a Pagar</span>
                          <span className="text-2xl font-bold text-primary">
                            R$ {valorFinal.toFixed(2)}
                          </span>
                        </Button>
                        
                        <Button
                          type="button"
                          variant={contaReceberId ? "outline" : "default"}
                          className={`h-auto py-4 flex flex-col items-center justify-center gap-1 ${
                            contaReceberId 
                              ? 'border-2 border-gray-300 bg-gray-100 cursor-not-allowed hover:bg-gray-100' 
                              : ''
                          }`}
                          onClick={handleAbrirPagamento}
                          disabled={contaReceberId ? true : false}
                        >
                          <DollarSign className={`h-5 w-5 ${contaReceberId ? 'text-gray-400' : ''}`} />
                          <span className={`text-lg font-semibold ${contaReceberId ? 'text-gray-500' : ''}`}>
                            {contaReceberId ? 'Conta Vinculada' : 'Pagamento'}
                          </span>
                          {contaReceberId && (
                            <span className="text-xs text-gray-500">Editar em Contas a Receber</span>
                          )}
                        </Button>
                      </div>

                      {/* Modal de Pagamento - Contas a Receber */}
                      <Dialog open={modalPagamentoAberto} onOpenChange={setModalPagamentoAberto}>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Criar Conta a Receber</DialogTitle>
                          </DialogHeader>
                          
                          <ContasReceberFormModal
                            dataEmissaoInicial={formData.data_pedido}
                            clienteIdInicial={getClienteId()}
                            clienteNomeInicial={formData.cliente}
                            descricaoInicial={getDescricaoProdutos()}
                            valorTotalInicial={valorFinal}
                            planoContasIdInicial={planoContasVendaId}
                            onSucesso={handleContaCriada}
                            onCancelar={() => setModalPagamentoAberto(false)}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>

                 <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      rows={3}
                      value={formData.observacoes}
                      onChange={(e) =>
                        setFormData({ ...formData, observacoes: e.target.value })
                      }
                    />
                  </div>

                  {/* Seção de Tags */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Tags</CardTitle>
                      <CardDescription>
                        Categorize esta encomenda com tags
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Tags Selecionadas */}
                      {tagsSelecionadas.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                          {tagsSelecionadas.map(tag => (
                            <Badge
                              key={tag.id}
                              style={{ backgroundColor: tag.cor, color: '#fff' }}
                              className="flex items-center gap-1 pr-1"
                            >
                              {tag.nome}
                              <button
                                type="button"
                                onClick={() => setTagsSelecionadas(tagsSelecionadas.filter(t => t.id !== tag.id))}
                                className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Tags Disponíveis */}
                      <div>
                        <Label className="mb-2 block text-sm">Tags Disponíveis:</Label>
                        <div className="flex flex-wrap gap-2">
                          {tagsDisponiveis.map(tag => {
                            const selecionada = tagsSelecionadas.find(t => t.id === tag.id);
                            return (
                              <Badge
                                key={tag.id}
                                style={{ 
                                  backgroundColor: selecionada ? tag.cor : 'transparent',
                                  color: selecionada ? '#fff' : tag.cor,
                                  borderColor: tag.cor,
                                }}
                                className="cursor-pointer border-2 hover:scale-105 transition-transform"
                                onClick={() => {
                                  if (selecionada) {
                                    setTagsSelecionadas(tagsSelecionadas.filter(t => t.id !== tag.id));
                                  } else {
                                    setTagsSelecionadas([...tagsSelecionadas, tag]);
                                  }
                                }}
                              >
                                {tag.nome}
                              </Badge>
                            );
                          })}
                        </div>
                        {tagsDisponiveis.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            Nenhuma tag cadastrada. Crie tags em Configurações.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingOrder ? "Salvar Alterações" : "Criar Encomenda"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* DASHBOARD DE ENCOMENDAS */}
      
      {/* Filtro Mês/Ano - Horizontal */}
      <Card className="shadow-soft">
        <CardContent className="py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Período:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Ano</Label>
              <Select
                value={anoSelecionado.toString()}
                onValueChange={(value) => setAnoSelecionado(parseInt(value))}
              >
                <SelectTrigger className="bg-popover h-9 w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Mês</Label>
              <Select
                value={mesSelecionado.toString()}
                onValueChange={(value) => setMesSelecionado(parseInt(value))}
              >
                <SelectTrigger className="bg-popover h-9 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {meses.map((mes, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {mes}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Visão Geral */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total */}
        <Card className="border-blue-200 bg-blue-50 shadow-soft">
          <CardHeader className="pb-1 pt-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-blue-700" />
              <CardTitle className="text-xs text-blue-700">Total de Encomendas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold text-blue-700">
              {indicadores.total}
            </div>
            <p className="text-xs text-blue-600 mt-0.5">
              {meses[mesSelecionado]}/{anoSelecionado}
            </p>
          </CardContent>
        </Card>

        {/* Pendentes */}
        <Card className="border-yellow-200 bg-yellow-50 shadow-soft">
          <CardHeader className="pb-1 pt-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-700" />
              <CardTitle className="text-xs text-yellow-700">Pendentes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold text-yellow-700">
              {indicadores.pendentes}
            </div>
            <p className="text-xs text-yellow-600 mt-0.5">
              Aguardando pagamento
            </p>
          </CardContent>
        </Card>

        {/* Canceladas */}
        <Card className="border-red-200 bg-red-50 shadow-soft">
          <CardHeader className="pb-1 pt-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-700" />
              <CardTitle className="text-xs text-red-700">Canceladas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold text-red-700">
              {indicadores.canceladas}
            </div>
            <p className="text-xs text-red-600 mt-0.5">
              Não realizadas
            </p>
          </CardContent>
        </Card>

        {/* Confirmadas */}
        <Card className="border-blue-200 bg-blue-50 shadow-soft">
          <CardHeader className="pb-1 pt-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-700" />
              <CardTitle className="text-xs text-blue-700">Confirmadas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold text-blue-700">
              {indicadores.confirmadas}
            </div>
            <p className="text-xs text-blue-600 mt-0.5">
              Pagamento confirmado
            </p>
          </CardContent>
        </Card>

        {/* Entregues */}
        <Card className="border-green-200 bg-green-50 shadow-soft">
          <CardHeader className="pb-1 pt-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-700" />
              <CardTitle className="text-xs text-green-700">Entregues/Finalizadas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold text-green-700">
              {indicadores.entregues}
            </div>
            <p className="text-xs text-green-600 mt-0.5">
              Concluídas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Collapsible open={filtrosAbertos} onOpenChange={setFiltrosAbertos}>
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <CardTitle>Filtros</CardTitle>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${filtrosAbertos ? '' : '-rotate-90'}`} />
              </CollapsibleTrigger>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setClienteFilter("Todos");
                  setStatusFilter("Todos");
                  setDataEntregaFilter("");
                  setHoraEntregaFilter("");
                  setTagFilter("todos");
                }}
                disabled={clienteFilter === "Todos" && statusFilter === "Todos" && !dataEntregaFilter && !horaEntregaFilter && tagFilter === "todos"}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Limpar Filtros
              </Button>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Filtro de Cliente */}
                <div className="space-y-2">
                  <Label htmlFor="filtro-cliente">Cliente</Label>
                  <Select value={clienteFilter} onValueChange={setClienteFilter}>
                    <SelectTrigger id="filtro-cliente" className="bg-popover">
                      <SelectValue placeholder="Todos os clientes" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="Todos">Todos os clientes</SelectItem>
                      {clientesComEncomendas.map((cliente) => (
                        <SelectItem key={cliente} value={cliente}>
                          {cliente}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de Status */}
                <div className="space-y-2">
                  <Label htmlFor="filtro-status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="filtro-status" className="bg-popover">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="Todos">Todos</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Confirmado">Confirmado</SelectItem>
                      <SelectItem value="Em Produção">Em Produção</SelectItem>
                      <SelectItem value="Pronto">Pronto</SelectItem>
                      <SelectItem value="Entregue">Entregue</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de Tags */}
                <div className="space-y-2">
                  <Label htmlFor="filtro-tag">Tag</Label>
                  <Select value={tagFilter} onValueChange={setTagFilter}>
                    <SelectTrigger id="filtro-tag" className="bg-popover">
                      <SelectValue placeholder="Todas as tags" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="todos">Todas as tags</SelectItem>
                      {tagsDisponiveis.map(tag => (
                        <SelectItem key={tag.id} value={tag.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tag.cor }}
                            />
                            {tag.nome}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de Data da Entrega */}
                <div className="space-y-2">
                  <Label htmlFor="filtro-data-entrega">Data da Entrega</Label>
                  <Input
                    id="filtro-data-entrega"
                    type="date"
                    value={dataEntregaFilter}
                    onChange={(e) => setDataEntregaFilter(e.target.value)}
                    className="bg-popover"
                  />
                </div>

                {/* Filtro de Hora da Entrega */}
                <div className="space-y-2">
                  <Label htmlFor="filtro-hora-entrega">Hora da Entrega</Label>
                  <Input
                    id="filtro-hora-entrega"
                    type="time"
                    value={horaEntregaFilter}
                    onChange={(e) => setHoraEntregaFilter(e.target.value)}
                    className="bg-popover"
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Lista de Encomendas</CardTitle>
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
              <FileDown className="h-4 w-4" />
              Exportar para Excel
            </Button>

            {/* Campo de Busca - Direita */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={buscaNome}
                onChange={(e) => setBuscaNome(e.target.value)}
                className="pl-9 bg-popover"
              />
            </div>
          </div>
        </div>
        <CardContent>
          {paginatedOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {statusFilter !== "Todos" || clienteFilter !== "Todos" || dataEntregaFilter || horaEntregaFilter
                  ? "Nenhuma encomenda encontrada com os filtros aplicados"
                  : "Nenhuma encomenda cadastrada"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Pedido</TableHead>
                    <TableHead>Data Entrega</TableHead>
                    <TableHead>Hora da Entrega</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((encomenda) => (
                    <TableRow key={encomenda.id}>
                      <TableCell className="font-medium">{encomenda.cliente}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[encomenda.status as keyof typeof statusColors]} variant="outline">
                          {statusLabels[encomenda.status as keyof typeof statusLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(encomenda.data_pedido).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        {encomenda.data_entrega ? (
                          new Date(encomenda.data_entrega).toLocaleDateString("pt-BR")
                        ) : (
                          <Badge className="bg-red-100 text-red-800 border-red-200" variant="outline">
                            Aguardando Agendamento
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{encomenda.hora_entrega ? encomenda.hora_entrega.slice(0, 5) : "-"}</TableCell>
                      
                      {/* COLUNA DE TAGS */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {encomenda.tags && encomenda.tags.length > 0 ? (
                            encomenda.tags.map((tag: any) => (
                              <Badge
                                key={tag.id}
                                style={{ backgroundColor: tag.cor, color: '#fff' }}
                                className="text-xs"
                              >
                                {tag.nome}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>R$ {encomenda.valor.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {encomenda.conta_receber_id && 
                           encomenda.status === 'pendente' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDarBaixa(encomenda)}
                              title="Dar Baixa"
                            >
                              <HandCoins className="h-4 w-4 text-success" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(encomenda)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(encomenda.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Encomendas;
