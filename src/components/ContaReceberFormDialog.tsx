import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, DollarSign, FileText, User, CreditCard, Repeat, Package, ExternalLink, Building2, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { format, addDays, addMonths, startOfMonth } from "date-fns";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatCpfCnpj } from "@/lib/utils";
import { toast } from "sonner";
import { useCategoriasFinanceiras } from "@/hooks/useCategoriasFinanceiras";
import { usePlanoContas } from "@/hooks/usePlanoContas";
import { useClientes } from "@/hooks/useClientes";
import { ClienteAutocomplete } from "@/components/ClienteAutocomplete";
import { useContasReceber } from "@/hooks/useContasReceber";
import { DatePickerField } from "@/components/DatePickerField";
import { useBancos } from "@/hooks/useBancos";
import { useTiposDocumento } from "@/hooks/useTiposDocumento";

// Helper para renderizar ícone dinamicamente
const renderIcon = (iconName?: string) => {
  if (!iconName) return null;
  const IconComponent = (LucideIcons as any)[iconName];
  if (!IconComponent) return null;
  return <IconComponent className="h-4 w-4 inline mr-2" />;
};

interface ContaReceber {
  id: string;
  descricao: string;
  categoriaId: string;
  planoContaId: string;
  valor: number;
  dataEmissao: string;
  dataVencimento: string;
  dataPagamento?: string;
  status: 'pendente' | 'recebido' | 'atrasado' | 'cancelado';
  formaPagamento?: string;
  bancoId?: string;
  tipoDocumentoId?: string;
  numeroDocumento?: string;
  clienteNome?: string;
  clienteDocumento?: string;
  observacoes?: string;
  parcelado: boolean;
  numeroParcela?: number;
  totalParcelas?: number;
  grupoParcelasId?: string;
  recorrente: boolean;
  frequenciaRecorrencia?: string;
  proximaRecorrencia?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface Categoria {
  id: string;
  nome: string;
  tipo: string;
  icone?: string;
  ativa: boolean;
}

interface PlanoContas {
  id: string;
  nome: string;
  categoriaId: string;
  ativo: boolean;
}

interface TipoDocumento {
  id: string;
  codigo: string;
  descricao: string;
}

interface Banco {
  id: string;
  nome: string;
  tipo: string;
  saldo_inicial: number;
}

const formSchema = z.object({
  descricao: z.string()
    .min(1, "Descrição é obrigatória")
    .max(200, "Descrição deve ter no máximo 200 caracteres")
    .trim(),
  categoriaId: z.string().min(1, "Selecione uma categoria"),
  planoContaId: z.string().min(1, "Selecione um plano de contas"),
  valor: z.number()
    .min(0.01, "Valor deve ser maior que zero"),
  dataEmissao: z.date(),
  clienteNome: z.string().min(1, "Nome do cliente é obrigatório").max(100),
  clienteDocumento: z.string().optional().or(z.literal("")),
  bancoId: z.string().min(1, "Selecione um banco"),
  tipoDocumentoId: z.string().min(1, "Selecione um tipo de documento"),
  numeroDocumento: z.string().max(50).optional().or(z.literal("")),
  observacoes: z.string().max(500).optional().or(z.literal("")),
  parcelado: z.boolean(),
  numeroParcela: z.number().optional(),
  totalParcelas: z.number().optional(),
  recorrente: z.boolean(),
  frequenciaRecorrencia: z.string().optional().or(z.literal("")),
}).refine((data) => {
  if (data.clienteDocumento) {
    const doc = data.clienteDocumento.replace(/\D/g, '');
    return doc.length === 0 || doc.length === 11 || doc.length === 14;
  }
  return true;
}, {
  message: "CPF/CNPJ inválido",
  path: ["clienteDocumento"],
});

type FormValues = z.infer<typeof formSchema>;

interface ContaReceberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta?: ContaReceber | null;
  onSave: () => void;
}

export function ContaReceberFormDialog({
  open,
  onOpenChange,
  conta,
  onSave,
}: ContaReceberFormDialogProps) {
  const { categorias: categoriasFinanceiras } = useCategoriasFinanceiras();
  const { planoContas } = usePlanoContas();
  const { clientes } = useClientes();
  const { createItem, updateItem } = useContasReceber();
  const { bancos } = useBancos();
  const { tiposDocumento } = useTiposDocumento();
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>("");
  const [selectedClienteNome, setSelectedClienteNome] = useState<string>("");
  const [valorInput, setValorInput] = useState("");
  
  // Estados para parcelamento
  const [showParcelamentoDialog, setShowParcelamentoDialog] = useState(false);
  const [numeroParcelas, setNumeroParcelas] = useState("");
  const [dataVencimentoParcela, setDataVencimentoParcela] = useState<Date | undefined>();
  const [parcelas, setParcelas] = useState<Array<{
    numero: number;
    total: number;
    dataEmissao: string;
    dataVencimento: string;
    valor: number;
    valorTotal: number;
  }>>([]);

  // Estados para recorrência
  const [showRecorrenciaDialog, setShowRecorrenciaDialog] = useState(false);
  const [numeroRecorrencias, setNumeroRecorrencias] = useState("");
  const [dataVencimentoRecorrencia, setDataVencimentoRecorrencia] = useState<Date | undefined>();
  const [recorrencias, setRecorrencias] = useState<Array<{
    numero: number;
    total: number;
    dataEmissao: string;
    dataVencimento: string;
    valor: number;
    valorTotal: number;
  }>>([]);

  // Funções para edição inline das parcelas
  const handleEditParcelaValor = (index: number, novoValor: string) => {
    const valor = parseFloat(novoValor.replace(',', '.'));
    if (!isNaN(valor) && valor > 0) {
      const novasParcelas = [...parcelas];
      novasParcelas[index].valor = valor;
      setParcelas(novasParcelas);
    }
  };

  const handleEditParcelaData = (index: number, novaData: string) => {
    if (novaData) {
      const novasParcelas = [...parcelas];
      novasParcelas[index].dataVencimento = novaData;
      setParcelas(novasParcelas);
    }
  };

  // Funções para edição inline das recorrências
  const handleEditRecorrenciaValor = (index: number, novoValor: string) => {
    const valor = parseFloat(novoValor.replace(',', '.'));
    if (!isNaN(valor) && valor > 0) {
      const novasRecorrencias = [...recorrencias];
      novasRecorrencias[index].valor = valor;
      setRecorrencias(novasRecorrencias);
    }
  };

  const handleEditRecorrenciaData = (index: number, novaData: string) => {
    if (novaData) {
      const novasRecorrencias = [...recorrencias];
      novasRecorrencias[index].dataVencimento = novaData;
      setRecorrencias(novasRecorrencias);
    }
  };

  // Filtrar apenas categorias de receita
  const categoriasReceita = categoriasFinanceiras.filter(c => c.tipo === 'receita');
  
  // Buscar o nome da categoria selecionada
  const categoriaSelecionada = categoriasReceita.find(c => c.id === selectedCategoriaId);
  
  // Filtrar planos de contas pela categoria selecionada (comparando o nome)
  const planosContasFiltrados = planoContas.filter(
    p => p.categoria === categoriaSelecionada?.nome && p.ativo && p.tipo === 'RECEITA'
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: "",
      categoriaId: "",
      planoContaId: "",
      valor: 0,
      dataEmissao: new Date(),
      clienteNome: "",
      clienteDocumento: "",
      bancoId: "",
      tipoDocumentoId: "",
      numeroDocumento: "",
      observacoes: "",
      parcelado: false,
      numeroParcela: 1,
      totalParcelas: 1,
      recorrente: false,
      frequenciaRecorrencia: "mensal",
    },
  });

  const parcelado = form.watch("parcelado");
  const recorrente = form.watch("recorrente");

  // Quando marcar "Parcela", desmarcar "Recorrente" e limpar dados
  useEffect(() => {
    if (parcelado) {
      form.setValue("recorrente", false);
      form.setValue("frequenciaRecorrencia", "");
      setRecorrencias([]);
    }
  }, [parcelado]);

  // Quando marcar "Recorrente", desmarcar "Parcela" e limpar dados
  useEffect(() => {
    if (recorrente) {
      form.setValue("parcelado", false);
      form.setValue("totalParcelas", undefined);
      form.setValue("numeroParcela", undefined);
      setParcelas([]);
    }
  }, [recorrente]);

  useEffect(() => {
    if (conta && open) {
      const contaAny = conta as any;
      
      // Parse das datas corretamente
      const dataEmissao = contaAny.data_emissao 
        ? new Date(contaAny.data_emissao + 'T12:00:00') 
        : (contaAny.created_at ? new Date(contaAny.created_at) : new Date());
      
      const dataVencimento = contaAny.data_vencimento 
        ? new Date(contaAny.data_vencimento + 'T12:00:00') 
        : new Date();

      form.reset({
        descricao: contaAny.descricao || "",
        categoriaId: contaAny.categoria_id || contaAny.categoriaId || "",
        planoContaId: contaAny.plano_conta_id || contaAny.planoContaId || "",
        valor: contaAny.valor || 0,
        dataEmissao,
        clienteNome: contaAny.cliente_nome || contaAny.clienteNome || "",
        clienteDocumento: contaAny.cliente_documento || contaAny.clienteDocumento || "",
        bancoId: contaAny.banco_id || contaAny.bancoId || "",
        tipoDocumentoId: contaAny.tipo_documento_id || contaAny.tipoDocumentoId || "",
        numeroDocumento: contaAny.numero_documento || contaAny.numeroDocumento || "",
        observacoes: contaAny.observacoes || "",
        parcelado: contaAny.parcelado || false,
        numeroParcela: contaAny.numeroParcela || 1,
        totalParcelas: contaAny.totalParcelas || 1,
        recorrente: contaAny.recorrente || false,
        frequenciaRecorrencia: contaAny.frequenciaRecorrencia || "mensal",
      });
      setSelectedCategoriaId(contaAny.categoria_id || contaAny.categoriaId || "");
      setSelectedClienteNome(contaAny.cliente_nome || contaAny.clienteNome || "");
      setValorInput(contaAny.valor ? contaAny.valor.toFixed(2) : "");
    } else if (!open) {
      // Quando fechar o diálogo, resetar o formulário
      form.reset({
        descricao: "",
        categoriaId: "",
        planoContaId: "",
        valor: 0,
        dataEmissao: new Date(),
        clienteNome: "",
        clienteDocumento: "",
        bancoId: "",
        tipoDocumentoId: "",
        numeroDocumento: "",
        observacoes: "",
        parcelado: false,
        numeroParcela: 1,
        totalParcelas: 1,
        recorrente: false,
        frequenciaRecorrencia: "mensal",
      });
      setSelectedCategoriaId("");
      setSelectedClienteNome("");
      setValorInput("");
    }
  }, [conta, open, form]);

  async function onSubmit(values: FormValues) {
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // Se está editando, apenas atualiza a conta existente
      if (conta?.id) {
        const vencimento = new Date(values.dataEmissao);
        vencimento.setHours(0, 0, 0, 0);

        let status: 'pendente' | 'atrasado' = 'pendente';
        if (vencimento < hoje) {
          status = 'atrasado';
        }

        const contaData = {
          descricao: values.descricao.trim(),
          valor: values.valor,
          data_emissao: values.dataEmissao.toISOString().split('T')[0],
          data_vencimento: values.dataEmissao.toISOString().split('T')[0],
          status,
          categoria_id: values.categoriaId || null,
          plano_conta_id: values.planoContaId || null,
          banco_id: values.bancoId || null,
          tipo_documento_id: values.tipoDocumentoId || null,
          numero_documento: values.numeroDocumento?.trim() || null,
          observacoes: values.observacoes?.trim() || null,
          cliente_nome: values.clienteNome?.trim() || null,
          cliente_documento: values.clienteDocumento?.trim() || null,
        };

        await updateItem(conta.id, contaData);
        toast.success("✓ Evento Lançado com Sucesso!");
        onOpenChange(false);
        onSave();
        return;
      }

      // Criando novas contas
      // Se tem parcelas, criar múltiplas contas (uma para cada parcela)
      if (parcelas.length > 0) {
        for (const parcela of parcelas) {
          const vencimento = new Date(parcela.dataVencimento);
          vencimento.setHours(0, 0, 0, 0);

          let status: 'pendente' | 'atrasado' = 'pendente';
          if (vencimento < hoje) {
            status = 'atrasado';
          }

          const contaData = {
            descricao: `${values.descricao.trim()} (${parcela.numero}/${parcela.total})`,
            valor: parcela.valor,
            data_emissao: parcela.dataEmissao,
            data_vencimento: parcela.dataVencimento,
            status,
            categoria_id: values.categoriaId || null,
            plano_conta_id: values.planoContaId || null,
            banco_id: values.bancoId || null,
            tipo_documento_id: values.tipoDocumentoId || null,
            numero_documento: values.numeroDocumento?.trim() || null,
            observacoes: values.observacoes?.trim() || null,
            cliente_nome: values.clienteNome?.trim() || null,
            cliente_documento: values.clienteDocumento?.trim() || null,
          };

          await createItem(contaData);
        }
        toast.success(`✓ Evento Lançado com Sucesso! ${parcelas.length} parcelas criadas.`);
        onOpenChange(false);
      }
      // Se tem recorrências, criar múltiplas contas (uma para cada recorrência)
      else if (recorrencias.length > 0) {
        for (const recorrencia of recorrencias) {
          const vencimento = new Date(recorrencia.dataVencimento);
          vencimento.setHours(0, 0, 0, 0);

          let status: 'pendente' | 'atrasado' = 'pendente';
          if (vencimento < hoje) {
            status = 'atrasado';
          }

          const contaData = {
            descricao: `${values.descricao.trim()} (${recorrencia.numero}/${recorrencia.total})`,
            valor: recorrencia.valor,
            data_emissao: recorrencia.dataEmissao,
            data_vencimento: recorrencia.dataVencimento,
            status,
            categoria_id: values.categoriaId || null,
            plano_conta_id: values.planoContaId || null,
            banco_id: values.bancoId || null,
            tipo_documento_id: values.tipoDocumentoId || null,
            numero_documento: values.numeroDocumento?.trim() || null,
            observacoes: values.observacoes?.trim() || null,
            cliente_nome: values.clienteNome?.trim() || null,
            cliente_documento: values.clienteDocumento?.trim() || null,
          };

          await createItem(contaData);
        }
        toast.success(`✓ Evento Lançado com Sucesso! ${recorrencias.length} recorrências criadas.`);
        onOpenChange(false);
      }
      // Se não tem parcelas nem recorrências, criar apenas uma conta
      else {
        const vencimento = new Date(values.dataEmissao);
        vencimento.setHours(0, 0, 0, 0);

        let status: 'pendente' | 'atrasado' = 'pendente';
        if (vencimento < hoje) {
          status = 'atrasado';
        }

        const contaData = {
          descricao: values.descricao.trim(),
          valor: values.valor,
          data_emissao: values.dataEmissao.toISOString().split('T')[0],
          data_vencimento: values.dataEmissao.toISOString().split('T')[0],
          status,
          categoria_id: values.categoriaId || null,
          plano_conta_id: values.planoContaId || null,
          banco_id: values.bancoId || null,
          tipo_documento_id: values.tipoDocumentoId || null,
          numero_documento: values.numeroDocumento?.trim() || null,
          observacoes: values.observacoes?.trim() || null,
          cliente_nome: values.clienteNome?.trim() || null,
          cliente_documento: values.clienteDocumento?.trim() || null,
        };

        await createItem(contaData);
        toast.success("✓ Evento Lançado com Sucesso!");
        onOpenChange(false);
      }
      
      onSave();
    } catch (error: any) {
      console.error('Erro completo ao salvar conta:', error);
      toast.error('Erro ao salvar conta: ' + (error.message || 'Erro desconhecido'));
    }
  }

  function handleValorChange(value: string) {
    const numericValue = value.replace(/[^\d,]/g, '').replace(',', '.');
    setValorInput(value);
    const parsed = parseFloat(numericValue);
    if (!isNaN(parsed)) {
      form.setValue('valor', parsed);
    }
  }

  function handleClienteSelect(clienteNome: string) {
    setSelectedClienteNome(clienteNome);
    form.setValue('clienteNome', clienteNome);
    
    // Buscar cliente completo e preencher CPF/CNPJ
    const cliente = clientes.find(c => c.nome === clienteNome);
    if (cliente?.cpf_cnpj) {
      form.setValue('clienteDocumento', cliente.cpf_cnpj);
    }
  }

  function handleFormError(errors: any) {
    // Montar mensagem de erro amigável
    const errorMessages: string[] = [];
    
    if (errors.descricao) {
      errorMessages.push(`• Descrição: ${errors.descricao.message}`);
    }
    if (errors.categoriaId) {
      errorMessages.push(`• Categoria: ${errors.categoriaId.message}`);
    }
    if (errors.planoContaId) {
      errorMessages.push(`• Plano de Contas: ${errors.planoContaId.message}`);
    }
    if (errors.valor) {
      errorMessages.push(`• Valor: ${errors.valor.message}`);
    }
    if (errors.dataEmissao) {
      errorMessages.push(`• Data de Emissão: ${errors.dataEmissao.message}`);
    }
    if (errors.clienteNome) {
      errorMessages.push(`• Nome do Cliente: ${errors.clienteNome.message}`);
    }
    if (errors.clienteDocumento) {
      errorMessages.push(`• CPF/CNPJ do Cliente: ${errors.clienteDocumento.message}`);
    }
    if (errors.bancoId) {
      errorMessages.push(`• Banco: ${errors.bancoId.message}`);
    }
    if (errors.tipoDocumentoId) {
      errorMessages.push(`• Tipo de Documento: ${errors.tipoDocumentoId.message}`);
    }
    if (errors.numeroDocumento) {
      errorMessages.push(`• Número do Documento: ${errors.numeroDocumento.message}`);
    }
    if (errors.observacoes) {
      errorMessages.push(`• Observações: ${errors.observacoes.message}`);
    }
    
    if (errorMessages.length > 0) {
      toast.error(
        `Salvamento não foi possível devido a:\n\n${errorMessages.join('\n')}`,
        { duration: 5000 }
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background to-[#FAF7F5]">
        <DialogHeader className="border-b border-[#E8E3DF] pb-4">
          <DialogTitle className="text-2xl font-bold text-[#6B5047] flex items-center gap-2">
            <FileText className="h-6 w-6 text-[#D89B8C]" />
            {conta ? "Editar Conta a Receber" : "Nova Conta a Receber"}
          </DialogTitle>
          <DialogDescription className="text-[#9C8B82]">
            Preencha os dados da conta a receber
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, handleFormError)} className="space-y-6 mt-4">
            {/* Datas */}
            <div className="bg-white rounded-lg p-5 border border-[#E8E3DF] shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-[#6B5047] flex items-center gap-2 mb-4 pb-2 border-b border-[#E8E3DF]">
                <Calendar className="h-5 w-5 text-[#D89B8C]" />
                Data de Emissão
              </h3>
              <FormField
                control={form.control}
                name="dataEmissao"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-[#6B5047] font-medium">Data de Emissão *</FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Selecione a data..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Cliente */}
            <div className="bg-white rounded-lg p-5 border border-[#E8E3DF] shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E3DF]">
                <h3 className="font-semibold text-[#6B5047] flex items-center gap-2">
                  <User className="h-5 w-5 text-[#D89B8C]" />
                  Cliente
                </h3>
                <Link 
                  to="/cadastros/clientes"
                  className="text-xs text-[#D89B8C] hover:text-[#B87C6D] flex items-center gap-1 transition-colors"
                  target="_blank"
                >
                  <ExternalLink className="h-3 w-3" />
                  Gerenciar Clientes
                </Link>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#6B5047] mb-2 block">
                    Nome do Cliente *
                  </label>
                  <ClienteAutocomplete
                    value={selectedClienteNome}
                    onSelect={handleClienteSelect}
                    placeholder="Buscar cliente cadastrado..."
                  />
                </div>

              </div>

              <FormField
                control={form.control}
                name="clienteDocumento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#6B5047] font-medium">CPF/CNPJ</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        value={field.value ? formatCpfCnpj(field.value) : ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="border-[#E8E3DF] focus:border-[#D89B8C] focus:ring-[#D89B8C]"
                        disabled
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Documento */}
            <div className="bg-white rounded-lg p-5 border border-[#E8E3DF] shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E3DF]">
                <h3 className="font-semibold text-[#6B5047] flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#D89B8C]" />
                  Documento
                </h3>
                <Link 
                  to="/configuracoes/tipos-documento"
                  className="text-xs text-[#D89B8C] hover:text-[#B87C6D] flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Gerenciar Tipos de Documento
                </Link>
              </div>
              
              <FormField
                control={form.control}
                name="tipoDocumentoId"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-[#6B5047] font-medium">Tipo de Documento *</FormLabel>
                      {tiposDocumento.length === 0 && (
                        <Link 
                          to="/configuracoes/tipos-documento"
                          className="text-xs text-[#D89B8C] hover:text-[#B87C6D] flex items-center gap-1"
                        >
                          + Criar tipo de documento
                        </Link>
                      )}
                    </div>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="border-[#E8E3DF] focus:border-[#D89B8C] focus:ring-[#D89B8C]">
                          <SelectValue placeholder={
                            tiposDocumento.length === 0 
                              ? "Nenhum tipo cadastrado" 
                              : "Selecione o tipo de documento..."
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background">
                        {tiposDocumento.map((tipo) => (
                          <SelectItem key={tipo.id} value={tipo.id}>
                            {tipo.descricao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bancoId"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-[#6B5047] font-medium">Banco *</FormLabel>
                      {bancos.length === 0 && (
                        <Link 
                          to="/configuracoes/bancos"
                          className="text-xs text-[#D89B8C] hover:text-[#B87C6D] flex items-center gap-1"
                        >
                          + Criar banco
                        </Link>
                      )}
                    </div>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="border-[#E8E3DF] focus:border-[#D89B8C] focus:ring-[#D89B8C]">
                          <SelectValue placeholder={
                            bancos.length === 0 
                              ? "Nenhum banco cadastrado" 
                              : "Selecione o banco..."
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background">
                        {bancos.map((banco) => (
                          <SelectItem key={banco.id} value={banco.id}>
                            {banco.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numeroDocumento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#6B5047] font-medium">Número do Documento (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: NF-001234" {...field} maxLength={50} className="border-[#E8E3DF] focus:border-[#D89B8C] focus:ring-[#D89B8C]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Descrição */}
            <div className="bg-white rounded-lg p-4 border border-[#E8E3DF] shadow-sm hover:shadow-md transition-shadow">
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#6B5047] font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#D89B8C]" />
                      Descrição *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Ex: Kit Festa "P"'
                        {...field}
                        maxLength={200}
                        className="border-[#E8E3DF] focus:border-[#D89B8C] focus:ring-[#D89B8C]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Categoria e Plano de Contas */}
            <div className="bg-white rounded-lg p-5 border border-[#E8E3DF] shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E3DF]">
                <h3 className="font-semibold text-[#6B5047] flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#D89B8C]" />
                  Categoria e Plano de Contas
                </h3>
                <Link 
                  to="/financeiro/categorias-financeiras"
                  className="text-xs text-[#D89B8C] hover:text-[#B87C6D] flex items-center gap-1 transition-colors"
                  target="_blank"
                >
                  <ExternalLink className="h-3 w-3" />
                  Gerenciar Categorias
                </Link>
              </div>
              
              <FormField
                control={form.control}
                name="categoriaId"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-[#6B5047] font-medium">Categoria *</FormLabel>
                      {categoriasReceita.length === 0 && (
                        <Link 
                          to="/financeiro/categorias-financeiras"
                          className="text-xs text-[#D89B8C] hover:text-[#B87C6D] flex items-center gap-1"
                          target="_blank"
                        >
                          + Criar categoria
                        </Link>
                      )}
                    </div>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedCategoriaId(value);
                        form.setValue('planoContaId', '');
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="border-[#E8E3DF] focus:border-[#D89B8C] focus:ring-[#D89B8C]">
                          <SelectValue placeholder="Selecione a categoria...">
                            {field.value ? (
                              (() => {
                                const selectedCat = categoriasReceita.find(c => c.id === field.value);
                                return selectedCat ? (
                                  <span className="flex items-center">
                                    {renderIcon(selectedCat.icone)}
                                    {selectedCat.nome}
                                  </span>
                                ) : 'Selecione a categoria...';
                              })()
                            ) : 'Selecione a categoria...'}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background z-50">
                        {categoriasReceita.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <span className="flex items-center">
                              {renderIcon(cat.icone)}
                              {cat.nome}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="planoContaId"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-[#6B5047] font-medium">Plano de Contas *</FormLabel>
                      {selectedCategoriaId && planosContasFiltrados.length === 0 && (
                        <Link 
                          to="/financeiro/planos-contas"
                          className="text-xs text-[#D89B8C] hover:text-[#B87C6D] flex items-center gap-1"
                          target="_blank"
                        >
                          + Criar plano de conta
                        </Link>
                      )}
                    </div>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!selectedCategoriaId}
                    >
                      <FormControl>
                        <SelectTrigger className="border-[#E8E3DF] focus:border-[#D89B8C] focus:ring-[#D89B8C]">
                          <SelectValue placeholder={
                            !selectedCategoriaId 
                              ? "Primeiro selecione uma categoria" 
                              : planosContasFiltrados.length === 0 
                                ? "Nenhum plano de conta disponível"
                                : "Selecione o plano..."
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background">
                        {planosContasFiltrados.map((plano) => (
                          <SelectItem key={plano.id} value={plano.id}>
                            {plano.codigo} - {plano.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Valor */}
            <div className="bg-gradient-to-r from-[#8BA888]/10 to-transparent rounded-lg p-5 border border-[#8BA888]/20 shadow-sm space-y-4">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#6B5047] font-semibold flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-[#8BA888]" />
                      Valor *
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C8B82]" />
                        <Input
                          type="text"
                          placeholder="0,00"
                          value={valorInput}
                          onChange={(e) => handleValorChange(e.target.value)}
                          className="pl-10 text-lg font-semibold border-[#E8E3DF] focus:border-[#8BA888] focus:ring-[#8BA888]"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Opções: Parcela e Recorrente */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#8BA888]/20">
                <FormField
                  control={form.control}
                  name="parcelado"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-[#E8E3DF] p-3 hover:bg-[#8BA888]/5 transition-colors">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) {
                              setShowParcelamentoDialog(true);
                            } else {
                              setParcelas([]);
                            }
                          }}
                          className="border-[#8BA888] data-[state=checked]:bg-[#8BA888] data-[state=checked]:border-[#8BA888]"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium text-[#6B5047] cursor-pointer">
                          Parcela
                        </FormLabel>
                        <p className="text-xs text-[#9C8B82]">Receita parcelada</p>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recorrente"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-[#E8E3DF] p-3 hover:bg-[#7BA8D8]/5 transition-colors">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) {
                              setShowRecorrenciaDialog(true);
                            } else {
                              setRecorrencias([]);
                            }
                          }}
                          className="border-[#7BA8D8] data-[state=checked]:bg-[#7BA8D8] data-[state=checked]:border-[#7BA8D8]"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium text-[#6B5047] cursor-pointer">
                          Recorrente
                        </FormLabel>
                        <p className="text-xs text-[#9C8B82]">Receita recorrente</p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Tabela de Parcelas */}
            {parcelas.length > 0 && (
              <div className="bg-white rounded-lg p-5 border border-[#8BA888]/30 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E8E3DF]">
                  <h3 className="font-semibold text-[#6B5047] flex items-center gap-2">
                    <Repeat className="h-5 w-5 text-[#8BA888]" />
                    Parcelas
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setParcelas([]);
                      form.setValue('parcelado', false);
                    }}
                    className="text-xs text-[#9C8B82] hover:text-[#6B5047]"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                </div>
                
                <div className="rounded-md border border-[#E8E3DF] overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#FAF7F5]">
                        <TableHead className="text-[#6B5047] font-semibold">Data Emissão</TableHead>
                        <TableHead className="text-[#6B5047] font-semibold text-right">Valor Total</TableHead>
                        <TableHead className="text-[#6B5047] font-semibold">Parcela</TableHead>
                        <TableHead className="text-[#6B5047] font-semibold">Data Vencimento</TableHead>
                        <TableHead className="text-[#6B5047] font-semibold text-right">Valor a Pagar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parcelas.map((parcela, index) => (
                        <TableRow key={parcela.numero} className="hover:bg-[#FAF7F5]/50">
                          <TableCell className="text-[#9C8B82]">
                            {format(new Date(parcela.dataEmissao), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-[#6B5047]">
                            R$ {parcela.valorTotal.toFixed(2).replace('.', ',')}
                          </TableCell>
                          <TableCell className="font-medium text-[#6B5047]">
                            {parcela.numero} de {parcela.total}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={parcela.dataVencimento}
                              onChange={(e) => handleEditParcelaData(index, e.target.value)}
                              className="border-[#E8E3DF] focus:border-[#8BA888] focus:ring-[#8BA888] h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="text"
                              value={parcela.valor.toFixed(2).replace('.', ',')}
                              onChange={(e) => handleEditParcelaValor(index, e.target.value)}
                              className="border-[#E8E3DF] focus:border-[#8BA888] focus:ring-[#8BA888] h-8 text-sm text-right font-semibold"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Tabela de Recorrências */}
            {recorrencias.length > 0 && (
              <div className="bg-white rounded-lg p-5 border border-[#7BA8D8]/30 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E8E3DF]">
                  <h3 className="font-semibold text-[#6B5047] flex items-center gap-2">
                    <Repeat className="h-5 w-5 text-[#7BA8D8]" />
                    Recorrências
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRecorrencias([]);
                      form.setValue('recorrente', false);
                    }}
                    className="text-xs text-[#9C8B82] hover:text-[#6B5047]"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                </div>
                
                <div className="rounded-md border border-[#E8E3DF] overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#FAF7F5]">
                        <TableHead className="text-[#6B5047] font-semibold">Data Emissão</TableHead>
                        <TableHead className="text-[#6B5047] font-semibold text-right">Valor Total</TableHead>
                        <TableHead className="text-[#6B5047] font-semibold">Recorrência</TableHead>
                        <TableHead className="text-[#6B5047] font-semibold">Data Vencimento</TableHead>
                        <TableHead className="text-[#6B5047] font-semibold text-right">Valor a Pagar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recorrencias.map((recorrencia, index) => (
                        <TableRow key={recorrencia.numero} className="hover:bg-[#FAF7F5]/50">
                          <TableCell className="text-[#9C8B82]">
                            {format(new Date(recorrencia.dataEmissao), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-[#6B5047]">
                            R$ {recorrencia.valorTotal.toFixed(2).replace('.', ',')}
                          </TableCell>
                          <TableCell className="font-medium text-[#6B5047]">
                            {recorrencia.numero} de {recorrencia.total}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={recorrencia.dataVencimento}
                              onChange={(e) => handleEditRecorrenciaData(index, e.target.value)}
                              className="border-[#E8E3DF] focus:border-[#7BA8D8] focus:ring-[#7BA8D8] h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="text"
                              value={recorrencia.valor.toFixed(2).replace('.', ',')}
                              onChange={(e) => handleEditRecorrenciaValor(index, e.target.value)}
                              className="border-[#E8E3DF] focus:border-[#7BA8D8] focus:ring-[#7BA8D8] h-8 text-sm text-right font-semibold"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Cliente */}
            {/* Documento */}
            {/* Observações */}
            <div className="bg-white rounded-lg p-4 border border-[#E8E3DF] shadow-sm">
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#6B5047] font-medium">Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informações adicionais..."
                        rows={3}
                        maxLength={500}
                        {...field}
                        className="border-[#E8E3DF] focus:border-[#D89B8C] focus:ring-[#D89B8C] resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>


            <DialogFooter className="bg-gradient-to-r from-[#FAF7F5] to-transparent pt-6 border-t border-[#E8E3DF]">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="border-[#E8E3DF] hover:bg-[#FAF7F5]"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-[#D89B8C] hover:bg-[#B87C6D] shadow-md hover:shadow-lg transition-all"
              >
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>

      {/* Diálogo de Parcelamento */}
      <Dialog open={showParcelamentoDialog} onOpenChange={setShowParcelamentoDialog}>
        <DialogContent className="max-w-md bg-gradient-to-br from-background to-[#FAF7F5]">
          <DialogHeader className="border-b border-[#E8E3DF] pb-4">
            <DialogTitle className="text-xl font-bold text-[#6B5047] flex items-center gap-2">
              <Repeat className="h-5 w-5 text-[#8BA888]" />
              Configurar Parcelamento
            </DialogTitle>
            <DialogDescription className="text-[#9C8B82]">
              Defina o número de parcelas e a data de vencimento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-[#6B5047] mb-2 block">
                Número de Parcelas *
              </label>
              <Input
                type="number"
                min="2"
                max="999"
                placeholder="Ex: 3"
                value={numeroParcelas}
                onChange={(e) => setNumeroParcelas(e.target.value)}
                className="border-[#E8E3DF] focus:border-[#8BA888] focus:ring-[#8BA888]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#6B5047] mb-2 block">
                Data de Vencimento da 1ª Parcela *
              </label>
              <DatePickerField
                value={dataVencimentoParcela}
                onChange={setDataVencimentoParcela}
                placeholder="Selecione a data..."
              />
            </div>
          </div>

          <DialogFooter className="border-t border-[#E8E3DF] pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowParcelamentoDialog(false);
                form.setValue('parcelado', false);
                setNumeroParcelas("");
                setDataVencimentoParcela(undefined);
              }}
              className="border-[#E8E3DF] hover:bg-[#FAF7F5]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                const numParcelas = parseInt(numeroParcelas);
                if (!numParcelas || numParcelas < 2) {
                  toast.error("Informe um número válido de parcelas (mínimo 2)");
                  return;
                }
                if (!dataVencimentoParcela) {
                  toast.error("Selecione a data de vencimento da primeira parcela");
                  return;
                }

                const valorTotal = form.getValues('valor');
                if (!valorTotal || valorTotal <= 0) {
                  toast.error("Informe o valor total antes de parcelar");
                  return;
                }

                const dataEmissaoForm = form.getValues('dataEmissao');
                console.log('Data de emissão do formulário:', dataEmissaoForm);
                
                if (!dataEmissaoForm) {
                  toast.error("Por favor, informe a data de emissão antes de gerar as parcelas");
                  return;
                }

                const valorParcela = valorTotal / numParcelas;
                
                const novasParcelas = Array.from({ length: numParcelas }, (_, i) => {
                  const dataVenc = addMonths(dataVencimentoParcela, i);
                  return {
                    numero: i + 1,
                    total: numParcelas,
                    dataEmissao: dataEmissaoForm.toISOString().split('T')[0],
                    dataVencimento: dataVenc.toISOString().split('T')[0],
                    valor: valorParcela,
                    valorTotal: valorTotal
                  };
                });

                setParcelas(novasParcelas);
                setShowParcelamentoDialog(false);
                toast.success(`✓ ${numParcelas} parcelas geradas com sucesso!`);
              }}
              className="bg-[#8BA888] hover:bg-[#7A9777] text-white"
            >
              Gerar Parcelas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Recorrência */}
      <Dialog open={showRecorrenciaDialog} onOpenChange={setShowRecorrenciaDialog}>
        <DialogContent className="max-w-md bg-gradient-to-br from-background to-[#FAF7F5]">
          <DialogHeader className="border-b border-[#E8E3DF] pb-4">
            <DialogTitle className="text-xl font-bold text-[#6B5047] flex items-center gap-2">
              <Repeat className="h-5 w-5 text-[#7BA8D8]" />
              Configurar Recorrência
            </DialogTitle>
            <DialogDescription className="text-[#9C8B82]">
              Defina o número de recorrências e a data de vencimento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-[#6B5047] mb-2 block">
                Número de Recorrências *
              </label>
              <Input
                type="number"
                min="2"
                max="999"
                placeholder="Ex: 12"
                value={numeroRecorrencias}
                onChange={(e) => setNumeroRecorrencias(e.target.value)}
                className="border-[#E8E3DF] focus:border-[#7BA8D8] focus:ring-[#7BA8D8]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#6B5047] mb-2 block">
                Data de Vencimento da 1ª Recorrência *
              </label>
              <DatePickerField
                value={dataVencimentoRecorrencia}
                onChange={setDataVencimentoRecorrencia}
                placeholder="Selecione a data..."
              />
            </div>
          </div>

          <DialogFooter className="border-t border-[#E8E3DF] pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowRecorrenciaDialog(false);
                form.setValue('recorrente', false);
                setNumeroRecorrencias("");
                setDataVencimentoRecorrencia(undefined);
              }}
              className="border-[#E8E3DF] hover:bg-[#FAF7F5]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                const numRecorrencias = parseInt(numeroRecorrencias);
                if (!numRecorrencias || numRecorrencias < 2) {
                  toast.error("Informe um número válido de recorrências (mínimo 2)");
                  return;
                }
                if (!dataVencimentoRecorrencia) {
                  toast.error("Selecione a data de vencimento da primeira recorrência");
                  return;
                }

                const valorTotal = form.getValues('valor');
                if (!valorTotal || valorTotal <= 0) {
                  toast.error("Informe o valor total antes de criar recorrências");
                  return;
                }
                
                const dataEmissaoForm = form.getValues('dataEmissao');
                if (!dataEmissaoForm) {
                  toast.error("Informe a data de emissão antes de criar recorrências");
                  return;
                }
                
                const novasRecorrencias = Array.from({ length: numRecorrencias }, (_, i) => {
                  // Data de vencimento: primeira é a informada, demais no mesmo dia do mês seguinte
                  const dataVenc = addMonths(dataVencimentoRecorrencia, i);
                  // Data de emissão: usa a data do formulário e adiciona meses
                  const dataEmis = addMonths(dataEmissaoForm, i);
                  
                  return {
                    numero: i + 1,
                    total: numRecorrencias,
                    dataEmissao: dataEmis.toISOString().split('T')[0],
                    dataVencimento: dataVenc.toISOString().split('T')[0],
                    valor: valorTotal,
                    valorTotal: valorTotal
                  };
                });

                setRecorrencias(novasRecorrencias);
                setShowRecorrenciaDialog(false);
                toast.success(`${numRecorrencias} recorrências criadas com sucesso!`);
              }}
              className="bg-[#7BA8D8] hover:bg-[#6A97C7] text-white"
            >
              Gerar Recorrências
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
