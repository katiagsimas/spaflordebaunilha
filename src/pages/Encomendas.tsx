import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { getTodayISO, formatDateBR, parseISOToDate } from "@/lib/dateUtils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, ShoppingBag, DollarSign, Clock, CalendarCheck, Package, Upload, X, HandCoins, Tag as TagIcon, FileDown, Calendar, ClipboardList, CheckCircle2, XCircle, AlertCircle, ChevronDown, UserPlus } from "lucide-react";
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
import { EncomendaTagsSection } from "@/components/EncomendaTagsSection";


import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';
import { z } from 'zod';

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
    clienteId: "", // Armazena o ID do cliente selecionado
    data_pedido: getTodayISO(),
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

  // Verificar se há um ID na URL para abrir automaticamente o formulário de edição
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const encomendaId = searchParams.get('id');
    
    if (encomendaId && encomendas.length > 0 && !editingOrder) {
      const encomenda = encomendas.find(e => e.id === encomendaId);
      if (encomenda) {
        handleEdit(encomenda);
        // Limpar o parâmetro da URL após abrir o formulário
        window.history.replaceState({}, '', '/encomendas');
      }
    }
  }, [encomendas, editingOrder]);

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

        // Buscar tags do usuário E tags do sistema (user_id IS NULL)
        const { data, error } = await supabase
          .from('tags_encomendas')
          .select('*')
          .or(`user_id.eq.${user.id},user_id.is.null`)
          .eq('ativo', true)
          .order('padrao_sistema', { ascending: false })
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
      clienteId: "",
      data_pedido: getTodayISO(),
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
    
    // Para edição de encomenda existente
    if (editingOrder) {
      // Verificar se tem produtos
      if (produtosEncomenda.length === 0) {
        toast.error("Adicione pelo menos um produto à encomenda!");
        return;
      }

      // Verificar se o pagamento foi configurado
      if (!contaReceberId) {
        toast.error("Configure o pagamento antes de salvar a encomenda!");
        return;
      }
      
      try {
        // Preparar os dados com o valor final calculado
        const { clienteId, ...dadosEncomenda } = formData; // Remover clienteId que não existe na tabela
        const dadosParaSalvar = {
          ...dadosEncomenda,
          valor: valorFinal,
          data_entrega: formData.data_entrega || null,
          hora_entrega: formData.hora_entrega || null,
          conta_receber_id: contaReceberId || null,
        };

        // Validação básica dos campos essenciais com Zod
        const basicSchema = z.object({
          cliente: z.string().trim().min(1, 'Nome do cliente é obrigatório'),
          data_pedido: z.string().min(1, 'Data do pedido é obrigatória'),
          status: z.enum(['pendente', 'confirmado', 'em_producao', 'pronto', 'entregue', 'cancelado']),
          valor: z.number().nonnegative('Valor não pode ser negativo'),
        });

        basicSchema.parse({
          cliente: dadosParaSalvar.cliente,
          data_pedido: dadosParaSalvar.data_pedido,
          status: dadosParaSalvar.status,
          valor: dadosParaSalvar.valor,
        });
        
        await updateEncomenda(editingOrder.id, dadosParaSalvar);
        
        // Salvar tags ao atualizar
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
        
        setDialogOpen(false);
        resetForm();
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          const zodError = error as z.ZodError;
          toast.error(zodError.issues[0].message);
        } else {
          toast.error(error.message || "Erro ao salvar encomenda");
        }
      }
    } else {
      // Para nova encomenda, apenas validar e abrir modal de pagamento
      if (tempProdutos.length === 0) {
        toast.error("Adicione pelo menos um produto à encomenda!");
        return;
      }

      if (!formData.cliente) {
        toast.error("Selecione o cliente!");
        return;
      }

      // Validação básica dos campos essenciais
      const basicSchema = z.object({
        cliente: z.string().trim().min(1, 'Nome do cliente é obrigatório'),
        data_pedido: z.string().min(1, 'Data do pedido é obrigatória'),
        status: z.enum(['pendente', 'confirmado', 'em_producao', 'pronto', 'entregue', 'cancelado']),
        valor: z.number().nonnegative('Valor não pode ser negativo'),
      });

      try {
        basicSchema.parse({
          cliente: formData.cliente,
          data_pedido: formData.data_pedido,
          status: formData.status,
          valor: valorFinal,
        });

        // Abrir modal de pagamento
        toast.info("Configure o pagamento para finalizar a encomenda");
        handleAbrirPagamento();
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          const zodError = error as z.ZodError;
          toast.error(zodError.issues[0].message);
        } else {
          toast.error(error.message || "Erro de validação");
        }
      }
    }
  };

  const handleEdit = async (encomenda: any) => {
    setEditingOrder(encomenda);
    setFormData({
      cliente: encomenda.cliente,
      clienteId: "", // Ao editar, buscar pela lista de clientes
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

  const handleClienteSelect = (clienteNome: string, clienteCompleto?: any) => {
    if (clienteCompleto) {
      setFormData({
        ...formData,
        cliente: clienteNome,
        clienteId: clienteCompleto.id || "",
        telefone: clienteCompleto.telefone || "",
        endereco: clienteCompleto.endereco || "",
        numero: clienteCompleto.numero || "",
        cep: clienteCompleto.cep || "",
      });
    } else {
      // Caso não tenha recebido clienteCompleto, buscar na lista
      const cliente = clientes.find(c => c.nome === clienteNome);
      if (cliente) {
        setFormData({
          ...formData,
          cliente: clienteNome,
          clienteId: cliente.id,
          telefone: cliente.telefone || "",
          endereco: cliente.endereco || "",
          numero: cliente.numero || "",
          cep: cliente.cep || "",
        });
      } else {
        setFormData({ ...formData, cliente: clienteNome });
      }
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
      // Obter usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Se estiver editando uma encomenda existente, usar o ID dela
      // Se for nova, usar um ID temporário baseado em timestamp
      const encomendaId = editingOrder || `temp_${Date.now()}`;
      
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${timestamp}.${fileExt}`;
      const filePath = `encomendas/${user.id}/${encomendaId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('encomendas')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      // Armazenar o path (não a URL completa) para facilitar migrações futuras
      setFormData({ ...formData, topo_imagens: [...formData.topo_imagens, filePath] });
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
      // Se a URL é um path do Storage (não começa com http), deletar do Storage
      if (!imageUrl.startsWith('http')) {
        await supabase.storage
          .from('encomendas')
          .remove([imageUrl]);
      } else {
        // Se for URL antiga do topo-bolo, tentar extrair o nome do arquivo
        const fileName = imageUrl.split('/').pop();
        if (fileName && !fileName.includes('/')) {
          // É uma URL antiga do formato Math.random()
          await supabase.storage
            .from('topo-bolo')
            .remove([fileName]);
        }
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

  const handleContaCriada = async (contaId: string) => {
    
    setContaReceberId(contaId);
    setModalPagamentoAberto(false);
    
    // Criar encomenda automaticamente após salvar as parcelas
    try {
      const { clienteId, ...dadosEncomenda } = formData; // Remover clienteId que não existe na tabela
      const dadosParaSalvar = {
        ...dadosEncomenda,
        valor: valorFinal,
        data_entrega: formData.data_entrega || null,
        hora_entrega: formData.hora_entrega || null,
        conta_receber_id: contaId,
      };

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

      setDialogOpen(false);
      resetForm();
      toast.success('Encomenda criada com sucesso!');
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar encomenda");
    }
  };

  // Buscar ID do cliente selecionado
  const getClienteId = () => {
    // Se o cliente foi recém adicionado, usar o ID armazenado no formData
    if (formData.clienteId) {
      return formData.clienteId;
    }
    // Caso contrário, buscar na lista de clientes
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
      
      // Filtro por tag
      const matchesTag = tagFilter === "todos" || (e.tags && e.tags.some((t: any) => t.id === tagFilter));
      
      // Filtro por busca de nome
      const matchesBusca = !buscaNome || e.cliente.toLowerCase().includes(buscaNome.toLowerCase());
      
      return matchesStatus && matchesCliente && matchesDataEntrega && matchesTag && matchesBusca;
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
                                {formData.topo_imagens.map((imagePath, index) => (
                                  <EncomendaImagePreview
                                    key={index}
                                    imagePath={imagePath}
                                    index={index}
                                    onRemove={handleRemoveImage}
                                  />
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
                  <EncomendaTagsSection 
                    tagsDisponiveis={tagsDisponiveis}
                    tagsSelecionadas={tagsSelecionadas}
                    onTagToggle={(tag) => {
                      const selecionada = tagsSelecionadas.find(t => t.id === tag.id);
                      if (selecionada) {
                        setTagsSelecionadas(tagsSelecionadas.filter(t => t.id !== tag.id));
                      } else {
                        setTagsSelecionadas([...tagsSelecionadas, tag]);
                      }
                    }}
                  />

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{indicadores.total}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Pendentes */}
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{indicadores.pendentes}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        {/* Confirmadas */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Confirmadas</p>
                <p className="text-2xl font-bold">{indicadores.confirmadas}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Entregues */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entregues</p>
                <p className="text-2xl font-bold">{indicadores.entregues}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Canceladas */}
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Canceladas</p>
                <p className="text-2xl font-bold">{indicadores.canceladas}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {/* Filtro de Cliente */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <Label htmlFor="filtro-cliente" className="text-xs mb-1.5 block">Cliente</Label>
            <Select value={clienteFilter} onValueChange={setClienteFilter}>
              <SelectTrigger id="filtro-cliente" className="bg-background h-9 text-sm">
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
          </CardContent>
        </Card>

        {/* Filtro de Status */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <Label htmlFor="filtro-status" className="text-xs mb-1.5 block">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="filtro-status" className="bg-background h-9 text-sm">
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
          </CardContent>
        </Card>

        {/* Filtro de Origem do pedido */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <Label className="text-xs mb-1.5 block">Origem</Label>
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="bg-background h-9 text-sm">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="todos">Todas</SelectItem>
                {tagsDisponiveis.filter(t => ['instagram', 'whatsapp', 'indicação', 'google maps', 'fidelização interna', 'parceria local'].includes(t.nome.toLowerCase())).map(tag => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.cor }} />
                      {tag.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Filtro de Tipo de evento */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <Label className="text-xs mb-1.5 block">Evento</Label>
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="bg-background h-9 text-sm">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="todos">Todos</SelectItem>
                {tagsDisponiveis.filter(t => ['aniversário infantil', 'aniversário adulto', 'mesversário', 'batizado', 'casamento', 'noivado', 'chá de bebê', 'chá de fraldas', 'empresarial'].includes(t.nome.toLowerCase())).map(tag => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.cor }} />
                      {tag.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Filtro de Data da Entrega */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <Label htmlFor="filtro-data-entrega" className="text-xs mb-1.5 block">Data Entrega</Label>
            <Input
              id="filtro-data-entrega"
              type="date"
              value={dataEntregaFilter}
              onChange={(e) => setDataEntregaFilter(e.target.value)}
              className="bg-background h-9 text-sm"
            />
          </CardContent>
        </Card>

        {/* Botão Limpar Filtros */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3 flex items-end h-full">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 text-xs"
              onClick={() => {
                setClienteFilter("Todos");
                setStatusFilter("Todos");
                setTagFilter("todos");
                setDataEntregaFilter("");
                setBuscaNome("");
                toast.success("Filtros limpos com sucesso!");
              }}
            >
              <X className="h-3 w-3 mr-1.5" />
              Limpar
            </Button>
          </CardContent>
        </Card>
      </div>

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
                {statusFilter !== "Todos" || clienteFilter !== "Todos" || dataEntregaFilter
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
                    <TableHead>Tipo de Evento</TableHead>
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
                      
                      {/* COLUNA DE TIPO DE EVENTO */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(() => {
                            const tiposEventoNomes = [
                              'aniversário infantil', 'aniversário adulto', 'mesversário', 
                              'batizado', 'casamento', 'noivado', 'chá de bebê', 
                              'chá de fraldas', 'empresarial'
                            ];
                            const tiposEventoTags = encomenda.tags?.filter((tag: any) => 
                              tiposEventoNomes.includes(tag.nome.toLowerCase())
                            ) || [];
                            
                            return tiposEventoTags.length > 0 ? (
                              tiposEventoTags.map((tag: any) => (
                                <Badge
                                  key={tag.id}
                                  style={{ backgroundColor: tag.cor, color: '#fff' }}
                                  className="text-xs"
                                >
                                  {tag.nome}
                                </Badge>
                              ))
                            ) : null;
                          })()}
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
