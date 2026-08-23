import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChefHat, Upload, X, FileDown } from "lucide-react";
import { exportarReceitaPDF } from "@/utils/exportarReceitaPDF";
import { useUnidadesMedida } from "@/hooks/useUnidadesMedida";
import { useCategorias } from "@/hooks/useCategorias";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useMaoObraPerfis } from "@/hooks/useMaoObraPerfis";
import { useReceitasMaoObra } from "@/hooks/useReceitasMaoObra";
import { MaoObraSection, type MaoObraLinha } from "@/components/MaoObraSection";
import { CardAnalise } from "@/components/CardAnalise";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/contexts/GroupContext";
import { getActiveGroupId } from "@/lib/activeGroup";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toast } from "sonner";
import { EmbalagemAutocomplete } from "@/components/EmbalagemAutocomplete";
import { CriarIngredienteModal } from "@/components/CriarIngredienteModal";
import { BuscarProdutoRevenda } from "@/components/BuscarProdutoRevenda";
import { CriarEmbalagemModal } from "@/components/CriarEmbalagemModal";

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

type UploadImagemStatus = "enviando" | "concluído" | "erro";

interface UploadImagemItem {
  id: string;
  nome: string;
  progresso: number;
  status: UploadImagemStatus;
  mensagem?: string;
}

export default function ReceitaForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { activeGroupId } = useGroup();
  const queryClient = useQueryClient();
  const [ingredientesCadastrados, setIngredientesCadastrados] = useState<any[]>([]);
  const [embalagensCadastradas, setEmbalagensCadastradas] = useState<any[]>([]);

  const { categorias, categoriasAtivas } = useCategorias();
  const { unidades } = useUnidadesMedida();
  const { salvarMaosObra } = useReceitasMaoObra(id);
  const { profile } = useUserProfile();
  const { perfis } = useMaoObraPerfis();

  // Buscar ingredientes e embalagens do Supabase
  useEffect(() => {
    const fetchDados = async () => {
      try {
        if (!user) return;

        // Buscar insumos normais
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
        
        // Buscar receitas do tipo "Produto para Combo" do Supabase
        const { data: receitasCombo, error: receitasError } = await supabase
          .from('receitas')
          .select('*')
          .eq('usuario_id', user.id)
          .eq('tipo', 'produto_combo');

        if (receitasError) throw receitasError;

        const receitasComboFormatadas = (receitasCombo || []).map((r: any) => {
          // Buscar a sigla correta da unidade de medida
          const unidade = unidades.find(u => u.id === r.unidade_rendimento);
          const siglaNome = unidade?.sigla || unidade?.nome || 'un';
          
          return {
            id: `receita_${r.id}`,
            preco: r.custo_total || 0,
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
        
        // Combinar insumos e receitas combo
        const todosItens = [...(ingredientesData || []), ...receitasComboFormatadas];
        setIngredientesCadastrados(todosItens);

        // Buscar embalagens
        const { data: embalagensData, error: embalagensError } = await supabase
          .from('embalagens')
          .select(`
            *,
            tipo_insumo:tipos_insumos (
              id,
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

        if (embalagensError) throw embalagensError;
        setEmbalagensCadastradas(embalagensData || []);

      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      }
    };

    fetchDados();
  }, []);

  const [maosObra, setMaosObra] = useState<MaoObraLinha[]>([]);
  
  const [formData, setFormData] = useState({
    nome: "",
    categoria: "",
    tipo: "produto_avulso" as "produto_avulso" | "produto_combo",
    cardapio: "ativo" as "ativo" | "fora",
    rendimento: "",
    unidadeRendimentoId: "",
  });
  
  const [ingredientes, setIngredientes] = useState<IngredienteReceita[]>([]);
  const [embalagens, setEmbalagens] = useState<EmbalagemReceita[]>([]);
  const [modoPreparo, setModoPreparo] = useState("");
  const [imagens, setImagens] = useState<string[]>([]);
  const [uploadsImagem, setUploadsImagem] = useState<UploadImagemItem[]>([]);
  const [imagensComErroPreview, setImagensComErroPreview] = useState<string[]>([]);
  
  // Estados para cadastro em cadeia de ingredientes
  const [mostrarPopoverIngrediente, setMostrarPopoverIngrediente] = useState(false);
  const [termoBuscaIngrediente, setTermoBuscaIngrediente] = useState('');
  const [modalCriarIngredienteOpen, setModalCriarIngredienteOpen] = useState(false);
  const [descricaoInicialIng, setDescricaoInicialIng] = useState('');

  // Estados para cadastro em cadeia de embalagens
  const [mostrarPopoverEmbalagem, setMostrarPopoverEmbalagem] = useState(false);
  const [termoBuscaEmbalagem, setTermoBuscaEmbalagem] = useState('');
  const [modalCriarEmbalagemOpen, setModalCriarEmbalagemOpen] = useState(false);
  const [descricaoInicialEmb, setDescricaoInicialEmb] = useState('');
  
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
  const [valorVendaInput, setValorVendaInput] = useState("");

  // Sincronizar valorVendaInput quando valorVenda mudar externamente
  useEffect(() => {
    if (valorVenda > 0) {
      setValorVendaInput(valorVenda.toString().replace('.', ','));
    } else {
      setValorVendaInput("");
    }
  }, [valorVenda]);

  useEffect(() => {
    if (id) {
      const fetchReceita = async () => {
        try {
          const { data: receitaData, error: receitaError } = await supabase
            .from('receitas')
            .select('*')
            .eq('id', id)
            .single();

          if (receitaError) throw receitaError;
          if (!receitaData) return;

          // Buscar ingredientes, embalagens, despesas e imagens
          const [ingredientesRes, embalagensRes, despesasRes, imagensRes] = await Promise.all([
            supabase.from('receitas_ingredientes').select('*').eq('receita_id', id),
            supabase.from('receitas_embalagens').select('*').eq('receita_id', id),
            supabase.from('receitas_despesas_venda').select('*').eq('receita_id', id),
            supabase.from('receitas_imagens').select('*').eq('receita_id', id).order('ordem'),
          ]);

          setFormData({
            nome: receitaData.nome,
            categoria: receitaData.categoria || "",
            tipo: (receitaData.tipo as "produto_avulso" | "produto_combo") || "produto_avulso",
            cardapio: (receitaData.cardapio as "ativo" | "fora") || "ativo",
            rendimento: receitaData.rendimento.toString(),
            unidadeRendimentoId: receitaData.unidade_rendimento,
          });
          
          // Carregar mãos de obra
          const { data: maosObraData } = await supabase
            .from("receitas_mao_obra")
            .select("*")
            .eq("receita_id", id);
            
          if (maosObraData && maosObraData.length > 0) {
            setMaosObra(
              maosObraData.map((mo) => ({
                id: mo.id,
                usar_valor_padrao: mo.usar_valor_padrao,
                perfil_id: mo.perfil_id,
                horas: mo.horas,
              }))
            );
          }

          // Mapear ingredientes
          const ingredientesFormatados = (ingredientesRes.data || []).map((ing: any) => ({
            id: ing.id,
            ingredienteId: ing.ingrediente_id,
            ingrediente: ing.ingrediente,
            marca: ing.marca || "",
            qtdeEmbalagem: Number(ing.qtde_embalagem),
            unidadeMedida: ing.unidade_medida,
            precoEmbalagem: Number(ing.preco_embalagem),
            quantidadeUtilizada: Number(ing.quantidade_utilizada),
            custoUnitario: Number(ing.custo_unitario),
            custoReceita: Number(ing.custo_receita),
          }));

          // Mapear embalagens
          const embalagensFormatadas = (embalagensRes.data || []).map((emb: any) => ({
            id: emb.id,
            embalagemId: emb.embalagem_id,
            embalagem: emb.embalagem,
            marca: emb.marca || "",
            qtdeEmbalagem: Number(emb.qtde_embalagem),
            unidadeMedida: emb.unidade_medida,
            precoEmbalagem: Number(emb.preco_embalagem),
            quantidadeUtilizada: Number(emb.quantidade_utilizada),
            custoUnitario: Number(emb.custo_unitario),
            custoReceita: Number(emb.custo_receita),
          }));

          // Mapear despesas de venda
          const despesasFormatadas = (despesasRes.data || []).map((desp: any) => ({
            id: desp.despesa_id,
            nome: desp.nome,
            percentual: Number(desp.percentual),
            valor: Number(desp.valor),
          }));

          // Mapear imagens
          const imagensFormatadas = (imagensRes.data || []).map((img: any) => img.url);

          setIngredientes(ingredientesFormatados);
          setEmbalagens(embalagensFormatadas);
          setModoPreparo(receitaData.modo_preparo || "");
          setValorVenda(receitaData.valor_venda ? Number(receitaData.valor_venda) : 0);
          setImagens(imagensFormatadas);

          if (despesasFormatadas.length > 0) {
            setDespesasVenda(despesasFormatadas);
          }
        } catch (error) {
          console.error('Erro ao carregar receita:', error);
          toast.error('Erro ao carregar receita');
        }
      };

      fetchReceita();
    }
  }, [id]);

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
        embalagem: embalagemSelecionada.tipo_insumo?.descricao || "",
        marca: embalagemSelecionada.marca || "",
        qtdeEmbalagem: embalagemSelecionada.tipo_insumo?.quantidade_embalagem || 0,
        unidadeMedida: embalagemSelecionada.tipo_insumo?.unidade_medida?.sigla || "",
        precoEmbalagem: embalagemSelecionada.preco || 0,
      });
      setEmbalagens(novasEmbalagens);
    }
  };

  const handleQuantidadeEmbalagemChange = (index: number, quantidade: number) => {

    const novosEmbalagens = [...embalagens];

    novosEmbalagens[index] = calcularCustosEmbalagem({
      ...novosEmbalagens[index],
      quantidadeUtilizada: quantidade,
    });
    setEmbalagens(novosEmbalagens);
  };


  const handleRemoveEmbalagem = (index: number) => {
    setEmbalagens(embalagens.filter((_, i) => i !== index));
  };

  const obterMensagemErroUpload = (mensagem?: string) => {
    const texto = (mensagem || "").toLowerCase();

    if (
      texto.includes("row-level security") ||
      texto.includes("new row violates row-level security policy")
    ) {
      return "Sua sessão não tem permissão para enviar imagens agora. Atualize a página e faça login novamente antes de tentar.";
    }

    if (texto.includes("jwt") || texto.includes("auth") || texto.includes("token")) {
      return "Sua autenticação expirou. Faça login novamente antes de enviar imagens.";
    }

    return mensagem || "Não foi possível enviar a imagem.";
  };

  const atualizarUploadImagem = (uploadId: string, dados: Partial<UploadImagemItem>) => {
    setUploadsImagem((prev) =>
      prev.map((item) => (item.id === uploadId ? { ...item, ...dados } : item)),
    );
  };

  const [signedImageUrls, setSignedImageUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const pathsToSign = imagens.filter(
      (i) => i && !i.startsWith("data:") && !/^https?:\/\//i.test(i) && !signedImageUrls[i],
    );
    if (pathsToSign.length === 0) return;
    (async () => {
      const entries: [string, string][] = [];
      await Promise.all(
        pathsToSign.map(async (path) => {
          const { data } = await supabase.storage
            .from("receitas")
            .createSignedUrl(path, 3600);
          if (data?.signedUrl) entries.push([path, data.signedUrl]);
        }),
      );
      if (entries.length > 0) {
        setSignedImageUrls((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
      }
    })();
  }, [imagens, signedImageUrls]);

  const obterSrcImagemReceita = (imagem: string) => {
    if (imagem.startsWith("data:") || /^https?:\/\//i.test(imagem)) {
      return imagem;
    }
    return signedImageUrls[imagem] || "";
  };

  const handleErroPreviewImagem = (imagem: string) => {
    setImagensComErroPreview((prev) =>
      prev.includes(imagem) ? prev : [...prev, imagem],
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const arquivos = Array.from(files);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      toast.error("Sua sessão expirou ou você não está autenticada. Faça login novamente antes de enviar imagens.");
      e.target.value = "";
      return;
    }

    const uploadsIniciais: UploadImagemItem[] = arquivos.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      nome: file.name,
      progresso: 8,
      status: "enviando",
      mensagem: id ? "Enviando imagem..." : "Preparando imagem para salvar...",
    }));

    setUploadsImagem((prev) => [...uploadsIniciais, ...prev].slice(0, 8));

    // Se já existe uma receita (está editando), podemos fazer upload imediatamente
    // Se não existe, salvaremos os arquivos temporariamente e faremos upload ao salvar
    const uploadPromises = arquivos.map(async (file, index) => {
      const uploadId = uploadsIniciais[index].id;

      if (!file.type.startsWith("image/")) {
        atualizarUploadImagem(uploadId, {
          status: "erro",
          progresso: 100,
          mensagem: "Arquivo ignorado: selecione apenas imagens.",
        });
        return null;
      }

      if (file.size > 5 * 1024 * 1024) {
        atualizarUploadImagem(uploadId, {
          status: "erro",
          progresso: 100,
          mensagem: "Arquivo acima de 5MB. Reduza a imagem antes de enviar.",
        });
        return null;
      }

      const timer = window.setInterval(() => {
        setUploadsImagem((prev) =>
          prev.map((item) =>
            item.id === uploadId && item.status === "enviando"
              ? { ...item, progresso: Math.min(item.progresso + 12, 90) }
              : item,
          ),
        );
      }, 250);

      try {
        // Se está editando uma receita existente, fazer upload imediatamente
        if (id) {
          const ext = file.name.split('.').pop() || 'jpg';
          const timestamp = Date.now();
          const fileName = `${timestamp}.${ext}`;
          const path = `${userId}/${id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('receitas')
            .upload(path, file, {
              upsert: false,
              cacheControl: '3600',
              contentType: file.type,
            });

          if (uploadError) {
            throw uploadError;
          }

          atualizarUploadImagem(uploadId, {
            status: "concluído",
            progresso: 100,
            mensagem: "Imagem enviada com sucesso.",
          });

          // Retornar o path para adicionar ao estado
          return path;
        } else {
          // Se está criando nova receita, guardar o arquivo em base64 temporariamente
          // Será convertido para Storage após criar a receita
          const imagemBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                resolve(event.target.result as string);
              }
            };
            reader.readAsDataURL(file);
          });

          atualizarUploadImagem(uploadId, {
            status: "concluído",
            progresso: 100,
            mensagem: "Imagem pronta para salvar na ficha técnica.",
          });

          return imagemBase64;
        }
      } catch (error: any) {
        const mensagem = obterMensagemErroUpload(error?.message);

        console.error('Erro ao processar imagem:', error);
        atualizarUploadImagem(uploadId, {
          status: "erro",
          progresso: 100,
          mensagem,
        });
        toast.error(mensagem);
        return null;
      } finally {
        window.clearInterval(timer);
      }
    });

    const urls = await Promise.all(uploadPromises);
    const validUrls = urls.filter((url): url is string => url !== null);
    
    if (validUrls.length > 0) {
      setImagensComErroPreview([]);
      setImagens(prev => [...prev, ...validUrls]);
      if (id) {
        toast.success(`${validUrls.length} imagem(ns) adicionada(s) com sucesso`);
      } else {
        toast.success(`${validUrls.length} imagem(ns) pronta(s) para salvar`);
      }
    }

    e.target.value = "";
  };

  const handleRemoveImage = async (index: number) => {
    const imagemUrl = imagens[index];
    
    // Se a imagem está no Storage (não é base64), deletar do Storage
    if (imagemUrl && !imagemUrl.startsWith('data:')) {

    try {

        const { error } = await supabase.storage
          .from('receitas')
          .remove([imagemUrl]);
        
        if (error) {
          console.error('Erro ao deletar imagem:', error);
          toast.error('Erro ao deletar imagem do storage');
          return;
        }
      } catch (error) {
        console.error('Erro ao deletar imagem:', error);
      }
    }
    
    setImagensComErroPreview((prev) => prev.filter((item) => item !== imagemUrl));
    setImagens(imagens.filter((_, i) => i !== index));
  };

  // Cálculos de custos
  const custoIngredientes = ingredientes.reduce((total, ing) => total + ing.custoReceita, 0);
  const custoEmbalagens = embalagens.reduce((total, emb) => total + emb.custoReceita, 0);
  
  // Custo de Mão de Obra Direta (NOVO SISTEMA)
  const custoMaoObra = maosObra.reduce((sum, mo) => {
    let valorHora: number;
    if (mo.usar_valor_padrao) {
      const perfilPadrao = perfis.find((p) => p.padrao && p.ativo);
      valorHora = perfilPadrao?.valor_hora || 0;
    } else if (mo.perfil_id) {
      const perfil = perfis.find((p) => p.id === mo.perfil_id);
      valorHora = perfil?.valor_hora || 0;
    } else {
      valorHora = 0;
    }
    return sum + (valorHora * mo.horas);
  }, 0);
  
  // Compatibilidade: manter variável com nome antigo
  const custoMaoDeObra = custoMaoObra;
  const custoFixoReceita = custoMaoObra;
  
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

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error("Por favor, informe o nome da receita");
      return;
    }

    if (!formData.rendimento || Number(formData.rendimento) <= 0) {
      toast.error("Por favor, informe um rendimento válido");
      return;
    }
    
    if (maosObra.length === 0) {
      toast.error("Por favor, adicione pelo menos uma mão de obra");
      return;
    }
    
    const totalHoras = maosObra.reduce((sum, mo) => sum + mo.horas, 0);
    if (totalHoras <= 0) {
      toast.error("Por favor, informe horas válidas para pelo menos uma mão de obra");
      return;
    }

    try {
      if (!user) throw new Error('Não autenticado');

      // Para "Produto para Combo", salvar custo sem embalagens (ingredientes + fixos)
      const custoParaSalvar = formData.tipo === "produto_combo" 
        ? custoIngredientes + custoFixoReceita 
        : custoTotal;

      // Salvar ou atualizar receita principal
      const activeGroupId = await getActiveGroupId(user.id);

      const receitaData = {
        usuario_id: user.id,
        owner_group_id: activeGroupId,
        nome: formData.nome,
        categoria: formData.categoria || null,
        tipo: formData.tipo,
        cardapio: formData.cardapio,
        tempo_preparo: Math.round(totalHoras * 60),
        unidade_tempo: "minutos",
        rendimento: Number(formData.rendimento),
        unidade_rendimento: formData.unidadeRendimentoId,
        custo_total: custoParaSalvar,
        valor_venda: valorVenda || null,
        modo_preparo: modoPreparo || null,
      };

      let receitaId: string;

      if (id) {
        // Atualizar receita existente
        const { error: receitaError } = await supabase
          .from('receitas')
          .update(receitaData)
          .eq('id', id);

        if (receitaError) throw receitaError;
        receitaId = id;

        // Deletar ingredientes, embalagens, despesas e imagens existentes
        await Promise.all([
          supabase.from('receitas_ingredientes').delete().eq('receita_id', id),
          supabase.from('receitas_embalagens').delete().eq('receita_id', id),
          supabase.from('receitas_despesas_venda').delete().eq('receita_id', id),
          supabase.from('receitas_imagens').delete().eq('receita_id', id),
        ]);
      } else {
        // Criar nova receita
        const { data: novaReceita, error: receitaError } = await supabase
          .from('receitas')
          .insert(receitaData)
          .select()
          .single();

        if (receitaError) throw receitaError;
        if (!novaReceita) throw new Error('Erro ao criar receita');
        receitaId = novaReceita.id;
      }

      // Inserir ingredientes
      if (ingredientes.length > 0) {
        const ingredientesData = ingredientes.map(ing => ({
          receita_id: receitaId,
          ingrediente_id: ing.ingredienteId,
          ingrediente: ing.ingrediente,
          marca: ing.marca || null,
          qtde_embalagem: ing.qtdeEmbalagem,
          unidade_medida: ing.unidadeMedida,
          preco_embalagem: ing.precoEmbalagem,
          quantidade_utilizada: ing.quantidadeUtilizada,
          custo_unitario: ing.custoUnitario,
          custo_receita: ing.custoReceita,
        }));

        const { error: ingredientesError } = await supabase
          .from('receitas_ingredientes')
          .insert(ingredientesData);

        if (ingredientesError) throw ingredientesError;
      }

      // Inserir embalagens
      if (embalagens.length > 0) {
        const embalagensData = embalagens.map(emb => ({
          receita_id: receitaId,
          embalagem_id: emb.embalagemId,
          embalagem: emb.embalagem,
          marca: emb.marca || null,
          qtde_embalagem: emb.qtdeEmbalagem,
          unidade_medida: emb.unidadeMedida,
          preco_embalagem: emb.precoEmbalagem,
          quantidade_utilizada: emb.quantidadeUtilizada,
          custo_unitario: emb.custoUnitario,
          custo_receita: emb.custoReceita,
        }));

        const { error: embalagensError } = await supabase
          .from('receitas_embalagens')
          .insert(embalagensData);

        if (embalagensError) throw embalagensError;
      }

      // Inserir despesas de venda
      if (despesasVenda.length > 0) {
        const despesasData = despesasVenda
          .filter(desp => desp.valor > 0 || desp.percentual > 0)
          .map(desp => ({
            receita_id: receitaId,
            despesa_id: desp.id,
            nome: desp.nome,
            percentual: desp.percentual,
            valor: desp.valor,
          }));

        if (despesasData.length > 0) {
          const { error: despesasError } = await supabase
            .from('receitas_despesas_venda')
            .insert(despesasData);

          if (despesasError) throw despesasError;
        }
      }

      // Inserir imagens
      if (imagens.length > 0) {
        const imagensData = [];
        
        // Separar imagens que precisam de upload (base64) das que já estão no Storage
        const indicesBase64 = imagens
          .map((url, index) => ({ url, index }))
          .filter((item) => item.url.startsWith('data:'));
        
        // Uploads paralelos para imagens base64
        const uploadPromises = indicesBase64.map(async ({ url, index }) => {
          const response = await fetch(url);
          const blob = await response.blob();
          
          const mimeType = blob.type;
          const ext = mimeType.split('/')[1] || 'jpg';
          
          const timestamp = Date.now();
          const fileName = `${timestamp}_${index}.${ext}`;
          const path = `${user?.id}/${receitaId}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('receitas')
            .upload(path, blob, { upsert: false });
          
          if (uploadError) {
            console.error('Erro ao fazer upload:', uploadError);
            throw uploadError;
          }
          
          return { index, path };
        });
        
        const uploadResults = await Promise.all(uploadPromises);
        
        // Construir imagensData preservando a ordem original
        for (let index = 0; index < imagens.length; index++) {
          const imagemUrl = imagens[index];
          
          if (imagemUrl.startsWith('data:')) {
            const result = uploadResults.find((r) => r.index === index);
            if (!result) {
              throw new Error(`Upload da imagem ${index} não retornou resultado`);
            }
            imagensData.push({
              receita_id: receitaId,
              url: result.path,
              ordem: index,
            });
          } else {
            // Se já é um path do Storage, usar diretamente
            imagensData.push({
              receita_id: receitaId,
              url: imagemUrl,
              ordem: index,
            });
          }
        }

        if (imagensData.length > 0) {
          const { error: imagensError } = await supabase
            .from('receitas_imagens')
            .insert(imagensData);

          if (imagensError) throw imagensError;
        }
      }
      
      // Salvar mãos de obra
      await salvarMaosObra({
        receitaId,
        maosObra: maosObra.map((mo) => ({
          perfil_id: mo.perfil_id,
          usar_valor_padrao: mo.usar_valor_padrao,
          horas: mo.horas,
        })),
      });

      if (id) {
        toast.success("Receita atualizada com sucesso!");
      } else {
        toast.success("Receita criada com sucesso!");
      }

      // Sincronizar preço global se solicitado
      if ((formData as any).sincronizarGlobal && ingredientes.length === 1 && valorVenda > 0) {
        const ingredientePrincipal = ingredientes[0];
        // Buscar o produto de revenda original pelo ingredienteId
        const { data: ingredienteInfo } = await supabase
          .from('ingredientes')
          .select('marca, preco_venda')
          .eq('id', ingredientePrincipal.ingredienteId)
          .single();

        if (ingredienteInfo) {
          // Atualizar o preço de venda no cadastro global de produtos de revenda
          const { error: syncError } = await supabase
            .from('produtos_revenda')
            .update({ preco_venda: valorVenda })
            .eq('usuario_id', user.id)
            .eq('codigo', ingredientePrincipal.marca) // Marca armazena o código para produtos Natura/Avon
            .eq('marca', ingredienteInfo.marca);

          if (syncError) {
            console.error('Erro ao sincronizar preço global:', syncError);
            toast.error("Receita salva, mas erro ao sincronizar preço global.");
          } else {
            // Também atualizar no cadastro de ingredientes para manter paridade
            await supabase
              .from('ingredientes')
              .update({ preco_venda: valorVenda })
              .eq('id', ingredientePrincipal.ingredienteId);
          }
        }
      }

      navigate("/precificacao/ficha-tecnica");

    } catch (error: any) {
      console.error('Erro ao salvar receita:', error);
      toast.error(error.message || 'Erro ao salvar receita');
    }
  };

  const handleIngredienteCriado = async (data: any) => {
    // Invalida o cache global para que outros componentes vejam o novo produto
    await queryClient.invalidateQueries({ queryKey: ['produtos_revenda'] });
    
    // Evita duplicados na listagem local
    setIngredientesCadastrados(prev => {
      if (prev.find(i => i.id === data.id)) return prev;
      return [...prev, data];
    });

    const novoIngrediente: IngredienteReceita = {
      id: `ing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ingredienteId: data.id,
      ingrediente: data.tipo_insumo.descricao,
      marca: data.marca || '',
      qtdeEmbalagem: data.tipo_insumo.quantidade_embalagem,
      unidadeMedida: data.tipo_insumo.unidade_medida.sigla,
      precoEmbalagem: data.preco,
      quantidadeUtilizada: 0,
      custoUnitario: data.preco / data.tipo_insumo.quantidade_embalagem,
      custoReceita: 0,
    };

    setIngredientes(prev => [...prev, novoIngrediente]);
    setTermoBuscaIngrediente('');
  };



  const handleEmbalagemCriada = async (data: any) => {
    // Invalida o cache global para que outros componentes vejam o novo produto
    await queryClient.invalidateQueries({ queryKey: ['produtos_revenda'] });
    
    // Evita duplicados na listagem local
    setEmbalagensCadastradas(prev => {
      if (prev.find(e => e.id === data.id)) return prev;
      return [...prev, data];
    });

    const novaEmbalagem: EmbalagemReceita = {
      id: `emb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      embalagemId: data.id,
      embalagem: data.tipo_insumo.descricao,
      marca: data.marca || '',
      qtdeEmbalagem: data.tipo_insumo.quantidade_embalagem,
      unidadeMedida: data.tipo_insumo.unidade_medida.sigla,
      precoEmbalagem: data.preco,
      quantidadeUtilizada: 0,
      custoUnitario: data.preco / data.tipo_insumo.quantidade_embalagem,
      custoReceita: 0,
    };

    setEmbalagens(prev => [...prev, novaEmbalagem]);
    setTermoBuscaEmbalagem('');
  };



  return (
    <div className="space-y-6">
      <PageHeader
        title={id ? "Editar Ficha Técnica" : "Nova Ficha Técnica"}
        description="Calcule Custos e Preços de Venda"
        backButton={<BackButton to="/precificacao/ficha-tecnica" />}
      />

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
                  {categoriasAtivas.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Nenhuma categoria habilitada.{" "}
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => navigate("/configuracoes/categorias")}
                      >
                        Habilitar agora
                      </Button>
                    </div>
                  )}
                  {categoriasAtivas.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.nome}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="cardapio">Serviço</Label>
                <Select
                  value={formData.cardapio}
                  onValueChange={(value: "ativo" | "fora") => setFormData({ ...formData, cardapio: value })}
                >
                  <SelectTrigger id="cardapio">
                    <SelectValue placeholder="Status do serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="fora">Fora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-1 min-h-[40px]">
                {ingredientes.length === 1 && ingredientes[0].quantidadeUtilizada === Number(formData.rendimento) && (
                  <>
                    <Checkbox 
                      id="sincronizarGlobal" 
                      checked={(formData as any).sincronizarGlobal}
                      onCheckedChange={(checked) => setFormData({ ...formData, sincronizarGlobal: !!checked } as any)}
                    />
                    <Label htmlFor="sincronizarGlobal" className="text-xs cursor-pointer text-sfb-cacau/70 leading-none">
                      Sincronizar preço global?
                    </Label>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          {/* Seção de Mão de Obra */}
          <MaoObraSection maosObra={maosObra} onChange={setMaosObra} />


          <div className="space-y-4">
            <div className="rounded-lg border border-sfb-areia/60 bg-white p-4">
              <BuscarProdutoRevenda onImportado={handleIngredienteCriado} />
            </div>
            <div className="flex justify-start items-center gap-2">

              <Popover open={mostrarPopoverIngrediente} onOpenChange={setMostrarPopoverIngrediente}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="default" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Ingrediente
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Buscar ingrediente..."
                      value={termoBuscaIngrediente}
                      onValueChange={setTermoBuscaIngrediente}
                    />
                    {(() => {
                      const ingredientesFiltrados = ingredientesCadastrados.filter(ing => {
                        const texto = `${ing.tipo_insumo?.descricao || ''} ${ing.marca || ''}`.toLowerCase();
                        return texto.includes(termoBuscaIngrediente.toLowerCase());
                      });
                      
                      return ingredientesFiltrados.length > 0 ? (
                        <CommandGroup className="max-h-64 overflow-auto">
                          {ingredientesFiltrados.map((ing) => (
                            <CommandItem
                              key={ing.id}
                              value={ing.id}
                              onSelect={() => {
                                handleSelectIngrediente(ingredientes.length, ing.id);
                                setMostrarPopoverIngrediente(false);
                                setTermoBuscaIngrediente('');
                              }}
                            >
                              <div className="flex flex-col w-full">
                                <span className="font-medium">
                                  {ing.tipo_insumo?.descricao}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {ing.marca ? `${ing.marca} - ` : ''}R$ {ing.preco?.toFixed(2)}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ) : (
                        <CommandEmpty>
                          <div className="flex flex-col items-center gap-2 py-4">
                            <p className="text-sm text-muted-foreground">
                              Nenhum ingrediente encontrado
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setDescricaoInicialIng(termoBuscaIngrediente);
                                setModalCriarIngredienteOpen(true);
                                setMostrarPopoverIngrediente(false);
                              }}
                              className="gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Cadastrar novo ingrediente
                            </Button>
                          </div>
                        </CommandEmpty>
                      );
                    })()}
                  </Command>
                </PopoverContent>
              </Popover>
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
            <div className="flex justify-start items-center gap-2">
              <Popover open={mostrarPopoverEmbalagem} onOpenChange={setMostrarPopoverEmbalagem}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="default" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Embalagem
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Buscar embalagem..."
                      value={termoBuscaEmbalagem}
                      onValueChange={setTermoBuscaEmbalagem}
                    />
                    {(() => {
                      const embalagensFiltradas = embalagensCadastradas.filter(emb => {
                        const texto = `${emb.tipo_insumo?.descricao || ''} ${emb.marca || ''}`.toLowerCase();
                        return texto.includes(termoBuscaEmbalagem.toLowerCase());
                      });
                      
                      return embalagensFiltradas.length > 0 ? (
                        <CommandGroup className="max-h-64 overflow-auto">
                          {embalagensFiltradas.map((emb) => (
                            <CommandItem
                              key={emb.id}
                              value={emb.id}
                              onSelect={() => {
                                handleSelectEmbalagem(embalagens.length, emb.id);
                                setMostrarPopoverEmbalagem(false);
                                setTermoBuscaEmbalagem('');
                              }}
                            >
                              <div className="flex flex-col w-full">
                                <span className="font-medium">
                                  {emb.tipo_insumo?.descricao}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {emb.marca ? `${emb.marca} - ` : ''}R$ {emb.preco?.toFixed(2)}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ) : (
                        <CommandEmpty>
                          <div className="flex flex-col items-center gap-2 py-4">
                            <p className="text-sm text-muted-foreground">
                              Nenhuma embalagem encontrada
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setDescricaoInicialEmb(termoBuscaEmbalagem);
                                setModalCriarEmbalagemOpen(true);
                                setMostrarPopoverEmbalagem(false);
                              }}
                              className="gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Cadastrar nova embalagem
                            </Button>
                          </div>
                        </CommandEmpty>
                      );
                    })()}
                  </Command>
                </PopoverContent>
              </Popover>
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
                    {imagensComErroPreview.includes(imagem) ? (
                      <div className="flex h-40 w-full items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted px-3 text-center text-sm text-muted-foreground">
                        Imagem indisponível para visualização
                      </div>
                    ) : (
                      <img
                        src={obterSrcImagemReceita(imagem)}
                        alt={`Imagem ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg border-2 border-border"
                        onError={() => handleErroPreviewImagem(imagem)}
                      />
                    )}
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

              {uploadsImagem.length > 0 && (
                <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                  {uploadsImagem.map((upload) => (
                    <div key={upload.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate font-medium">{upload.nome}</span>
                        <span
                          className={
                            upload.status === "erro"
                              ? "text-destructive"
                              : upload.status === "concluído"
                                ? "text-primary"
                                : "text-muted-foreground"
                          }
                        >
                          {upload.status === "enviando"
                            ? "enviando"
                            : upload.status === "concluído"
                              ? "concluído"
                              : "erro"}
                        </span>
                      </div>
                      <Progress value={upload.progresso} className="h-2" />
                      {upload.mensagem && (
                        <p
                          className={
                            upload.status === "erro"
                              ? "text-xs text-destructive"
                              : "text-xs text-muted-foreground"
                          }
                        >
                          {upload.mensagem}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
                        className="w-full font-bold text-xl bg-primary text-primary-foreground hover:bg-primary/90"
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
                                    value={despesa.valor ? despesa.valor.toFixed(2) : ""}
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
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">
                        R$
                      </span>
                      <Input
                        type="text"
                        value={valorVendaInput}
                        onChange={(e) => {
                          // Permitir apenas números e vírgula
                          const value = e.target.value.replace(/[^\d,]/g, '');
                          // Permitir apenas uma vírgula
                          const parts = value.split(',');
                          if (parts.length > 2) return;
                          setValorVendaInput(value);
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.replace(',', '.');
                          const numero = parseFloat(value) || 0;
                          setValorVenda(numero);
                          // Revalidar o formato do input
                          if (numero > 0) {
                            setValorVendaInput(numero.toString().replace('.', ','));
                          } else {
                            setValorVendaInput("");
                          }
                        }}
                        placeholder="0,00"
                        className="text-xl font-bold pl-12"
                      />
                    </div>
                    <Button 
                      className="w-full mt-3" 
                      onClick={() => {
                        if (valorVenda > 0) {
                          // Scroll suave até a seção de análise
                          const analiseElement = document.getElementById('analise-venda');
                          if (analiseElement) {
                            analiseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                          toast.success('Confira os alertas de CMV e Margem de Contribuição abaixo! 👇');
                        } else {
                          toast.error('Digite um valor de venda primeiro!');
                        }
                      }}
                    >
                      Confirmar
                    </Button>
                  </div>
                </div>

                {/* Análise da Venda */}
                {valorVenda > 0 && (
                  <div id="analise-venda" className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <CardAnalise
                      valor={percentualCMV}
                      tipo="percentual"
                      thresholds={{ bom: 35, ok: 45 }}
                      direcao="abaixo_e_melhor"
                      titulo="📊 CMV Real"
                      mensagens={{
                        bom: '✓ Excelente! CMV muito saudável',
                        ok: '⚠ Aceitável, mas pode melhorar',
                        ruim: '✗ ATENÇÃO! CMV muito alto',
                      }}
                      emoji={{ bom: '✅', ok: '⚠️', ruim: '❌' }}
                      emoticon={{ bom: '😊', ok: '😐', ruim: '😰' }}
                      alertas={{
                        bom: '🎉 PARABÉNS!',
                        ok: '💡 ATENÇÃO!',
                        ruim: '🚨 ALERTA IMPORTANTE!',
                      }}
                      descricoes={{
                        bom: 'Sua margem de lucro está ótima. Com esse CMV, você terá uma boa margem para cobrir despesas operacionais e ainda gerar lucro.',
                        ok: 'Seu CMV está na faixa aceitável, mas há espaço para otimização. Considere revisar custos de ingredientes ou ajustar o preço de venda para aumentar sua margem.',
                        ruim: 'CMV acima de 45% pode comprometer sua lucratividade! Riscos: pouca margem para despesas operacionais, dificuldade em cobrir custos fixos, vulnerabilidade a variações de preço. Recomenda-se: renegociar preços com fornecedores, otimizar receita ou aumentar preço de venda.',
                      }}
                    />

                    <CardAnalise
                      valor={percentualMargemContribuicao}
                      tipo="reais"
                      valorDisplay={margemContribuicao}
                      thresholds={{ bom: 65, ok: 55 }}
                      direcao="acima_e_melhor"
                      titulo="💵 Margem de Contribuição"
                      mensagens={{
                        bom: `${percentualMargemContribuicao.toFixed(1)}% do valor de venda`,
                        ok: `${percentualMargemContribuicao.toFixed(1)}% do valor de venda`,
                        ruim: `${percentualMargemContribuicao.toFixed(1)}% do valor de venda`,
                      }}
                      emoji={{ bom: '✅', ok: '⚠️', ruim: '❌' }}
                      emoticon={{ bom: '🎊', ok: '😕', ruim: '😱' }}
                      alertas={{
                        bom: '🎉 EXCELENTE MARGEM!',
                        ok: '💡 MARGEM RAZOÁVEL!',
                        ruim: '🚨 MARGEM MUITO BAIXA!',
                      }}
                      descricoes={{
                        bom: 'Ótima margem de contribuição! Você tem recursos suficientes para cobrir despesas operacionais, investir no negócio e garantir um bom lucro.',
                        ok: 'Margem aceitável, mas pode ser melhorada. Busque reduzir custos ou aumentar o preço de venda para ter mais recursos disponíveis após cobrir o CMV.',
                        ruim: 'Margem insuficiente! Com essa margem baixa, pode ser difícil cobrir todas as despesas operacionais (aluguel, luz, salários, etc.) e ainda ter lucro. É crucial revisar sua precificação ou reduzir custos.',
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => navigate("/precificacao/ficha-tecnica")}>
              Cancelar
            </Button>
            {id && (
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await exportarReceitaPDF(id);
                    toast.success("PDF gerado com sucesso!");
                  } catch (e: any) {
                    toast.error(`Erro ao gerar PDF: ${e?.message || e}`);
                  }
                }}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
            )}
            <Button onClick={handleSave}>
              {id ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <CriarIngredienteModal
        open={modalCriarIngredienteOpen}
        onOpenChange={setModalCriarIngredienteOpen}
        descricaoInicial={descricaoInicialIng}
        unidades={unidades}
        userId={user?.id}
        activeGroupId={activeGroupId}
        onInsumoCriado={handleIngredienteCriado}
      />

      <CriarEmbalagemModal
        open={modalCriarEmbalagemOpen}
        onOpenChange={setModalCriarEmbalagemOpen}
        descricaoInicial={descricaoInicialEmb}
        unidades={unidades}
        userId={user?.id}
        activeGroupId={activeGroupId}
        onEmbalagemCriada={handleEmbalagemCriada}
      />
    </div>
  );
}

