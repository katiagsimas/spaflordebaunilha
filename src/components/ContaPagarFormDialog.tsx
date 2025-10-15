import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, addDays, addMonths, startOfMonth } from "date-fns";
import { CalendarIcon, DollarSign, FileText, Building2, Calendar, User, ExternalLink, Landmark, CreditCard, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCategoriasFinanceiras } from "@/hooks/useCategoriasFinanceiras";
import { usePlanoContas } from "@/hooks/usePlanoContas";
import { useTiposDocumento } from "@/hooks/useTiposDocumento";
import { useBancos } from "@/hooks/useBancos";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatCpfCnpj } from "@/lib/utils";
import { DatePickerField } from "@/components/DatePickerField";
import { FornecedorAutocomplete } from "@/components/FornecedorAutocomplete";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useContasPagar } from "@/hooks/useContasPagar";

interface Banco {
  id: string;
  nome: string;
  tipo: string;
  saldo_inicial: number;
}

interface TipoDocumento {
  id: string;
  codigo: string;
  descricao: string;
}

interface Parcela {
  numero: number;
  total: number;
  valor: number;
  dataVencimento: Date;
  dataEmissao: Date;
}

interface ParcelaRecorrente {
  numero: number;
  dataEmissao: Date;
  valorTotal: number;
  totalParcelas: number;
  valorPagar: number;
  dataVencimento: Date;
}

interface ContaPagarFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta?: any;
  onSave: () => void;
}

const formSchema = z.object({
  descricao: z.string()
    .min(3, "Descrição deve ter no mínimo 3 caracteres")
    .max(200, "Descrição deve ter no máximo 200 caracteres")
    .transform(val => val.trim()),
  categoriaId: z.string().min(1, "Selecione uma categoria"),
  planoContaId: z.string().min(1, "Selecione um plano de contas"),
  valor: z.string()
    .min(1, "Informe o valor")
    .refine((val) => {
      const num = parseFloat(val.replace(/[^\d,]/g, '').replace(',', '.'));
      return num > 0 && num <= 999999.99;
    }, "Valor deve ser entre R$ 0,01 e R$ 999.999,99"),
  dataEmissao: z.date(),
  fornecedorNome: z.string().min(1, "Nome do fornecedor é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  fornecedorDocumento: z.string().optional(),
  bancoId: z.string().min(1, "Selecione um banco"),
  tipoDocumentoId: z.string().min(1, "Tipo de documento é obrigatório"),
  numeroDocumento: z.string().max(50, "Número deve ter no máximo 50 caracteres").optional(),
  observacoes: z.string().max(500, "Observações devem ter no máximo 500 caracteres").optional(),
  parcelado: z.boolean(),
  numeroParcela: z.number().optional(),
  totalParcelas: z.number().optional(),
  frequenciaParcelas: z.enum(['mensal', 'quinzenal', 'semanal', 'personalizado']).optional(),
  recorrente: z.boolean(),
  frequenciaRecorrencia: z.enum(['mensal', 'bimestral', 'trimestral', 'semestral', 'anual']).optional(),
  proximaRecorrencia: z.date().optional(),
}).refine((data) => {
  if (data.fornecedorDocumento && data.fornecedorDocumento.length > 0) {
    const numbers = data.fornecedorDocumento.replace(/\D/g, '');
    return numbers.length === 11 || numbers.length === 14;
  }
  return true;
}, {
  message: "CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos",
  path: ["fornecedorDocumento"],
}).refine((data) => {
  // Apenas valida se parcelado estiver explicitamente marcado como true
  if (data.parcelado === true && (!data.totalParcelas || data.totalParcelas < 1)) {
    return false;
  }
  return true;
}, {
  message: "Para despesas parceladas, informe o número de parcelas (mínimo 1)",
  path: ["totalParcelas"],
}).refine((data) => {
  if (data.recorrente && !data.frequenciaRecorrencia) {
    return false;
  }
  return true;
}, {
  message: "Para despesas recorrentes, selecione a frequência",
  path: ["frequenciaRecorrencia"],
});

type FormValues = z.infer<typeof formSchema>;

export function ContaPagarFormDialog({ open, onOpenChange, conta, onSave }: ContaPagarFormDialogProps) {
  const { categorias, loading: loadingCategorias } = useCategoriasFinanceiras();
  const { planoContas, loading: loadingPlanos } = usePlanoContas();
  const { tiposDocumento, loading: loadingTiposDocumento } = useTiposDocumento();
  const { bancos } = useBancos();
  const { createItem } = useContasPagar();
  
  const [parcelaDialogOpen, setParcelaDialogOpen] = useState(false);
  const [numeroParcelas, setNumeroParcelas] = useState<number>(1);
  const [dataVencimentoParcelas, setDataVencimentoParcelas] = useState<Date>(new Date());
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  
  const [recorrenteDialogOpen, setRecorrenteDialogOpen] = useState(false);
  const [numeroParcelasRecorrente, setNumeroParcelasRecorrente] = useState<number>(1);
  const [dataVencimentoRecorrente, setDataVencimentoRecorrente] = useState<Date>(new Date());
  const [parcelasRecorrentes, setParcelasRecorrentes] = useState<ParcelaRecorrente[]>([]);

  // Filtrar apenas categorias de despesa
  const categoriasDespesa = categorias.filter(c => c.tipo === 'despesa');
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: "",
      categoriaId: "",
      planoContaId: "",
      valor: "",
      dataEmissao: new Date(),
      fornecedorNome: "",
      fornecedorDocumento: "",
      bancoId: "",
      tipoDocumentoId: "",
      numeroDocumento: "",
      observacoes: "",
      parcelado: false,
      numeroParcela: undefined,
      totalParcelas: undefined,
      frequenciaParcelas: undefined,
      recorrente: false,
      frequenciaRecorrencia: undefined,
      proximaRecorrencia: undefined,
    },
  });

  const selectedCategoriaId = form.watch("categoriaId");
  const parcelado = form.watch("parcelado");
  const recorrente = form.watch("recorrente");

  // Quando marcar "Parcela", desmarcar "Recorrente" e limpar dados
  useEffect(() => {
    if (parcelado) {
      form.setValue("recorrente", false);
      form.setValue("frequenciaRecorrencia", undefined);
      form.setValue("proximaRecorrencia", undefined);
    }
  }, [parcelado]);

  // Quando marcar "Recorrente", desmarcar "Parcela" e limpar dados
  useEffect(() => {
    if (recorrente) {
      form.setValue("parcelado", false);
      form.setValue("totalParcelas", undefined);
      form.setValue("numeroParcela", undefined);
      setParcelas([]);
      setRecorrenteDialogOpen(true);
    } else {
      setParcelasRecorrentes([]);
    }
  }, [recorrente]);
  
  // Buscar o nome da categoria selecionada
  const categoriaSelecionada = categoriasDespesa.find(c => c.id === selectedCategoriaId);
  
  // Filtrar planos de contas pela categoria selecionada (comparando o nome)
  const planosDisponiveis = planoContas.filter(
    p => p.categoria === categoriaSelecionada?.nome && p.ativo && p.tipo === 'DESPESA'
  );

  useEffect(() => {
    if (conta) {
      form.reset({
        descricao: conta.descricao,
        categoriaId: conta.categoriaId,
        planoContaId: conta.planoContaId,
        valor: conta.valor.toString(),
        dataEmissao: new Date(conta.dataEmissao),
        fornecedorNome: conta.fornecedorNome || "",
        fornecedorDocumento: conta.fornecedorDocumento || "",
        bancoId: conta.bancoId || "",
        tipoDocumentoId: conta.tipoDocumentoId || "",
        numeroDocumento: conta.numeroDocumento || "",
        observacoes: conta.observacoes || "",
        parcelado: conta.parcelado || false,
        numeroParcela: conta.numeroParcela,
        totalParcelas: conta.totalParcelas,
        recorrente: conta.recorrente || false,
        frequenciaRecorrencia: conta.frequenciaRecorrencia,
        proximaRecorrencia: conta.proximaRecorrencia ? new Date(conta.proximaRecorrencia) : undefined,
      });
    } else {
      form.reset({
        descricao: "",
        categoriaId: "",
        planoContaId: "",
        valor: "",
        dataEmissao: new Date(),
        fornecedorNome: "",
        fornecedorDocumento: "",
        bancoId: "",
        tipoDocumentoId: "",
        numeroDocumento: "",
        observacoes: "",
        parcelado: false,
        numeroParcela: undefined,
        totalParcelas: undefined,
        frequenciaParcelas: undefined,
        recorrente: false,
        frequenciaRecorrencia: undefined,
        proximaRecorrencia: undefined,
      });
    }
  }, [conta, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // Se tem parcelas configuradas, criar múltiplas contas (uma para cada parcela)
      if (parcelas.length > 0) {
        for (const parcela of parcelas) {
          const vencimento = new Date(parcela.dataVencimento);
          vencimento.setHours(0, 0, 0, 0);

          let status: 'pendente' | 'atrasado' = 'pendente';
          if (vencimento < hoje) {
            status = 'atrasado';
          }

          const contaData = {
            descricao: `${data.descricao} (${parcela.numero}/${parcela.total})`,
            valor: parcela.valor,
            data_vencimento: formatDateToISO(parcela.dataVencimento),
            status,
            categoria_id: data.categoriaId || null,
            observacoes: data.observacoes || null,
            banco_id: data.bancoId || null,
          };

          await createItem(contaData);
        }
        toast.success(`✓ Evento Lançado com Sucesso! ${parcelas.length} parcelas criadas.`);
        onOpenChange(false);
        onSave();
      }
      // Se tem recorrências configuradas, criar múltiplas contas (uma para cada recorrência)
      else if (parcelasRecorrentes.length > 0) {
        for (const recorrencia of parcelasRecorrentes) {
          const vencimento = new Date(recorrencia.dataVencimento);
          vencimento.setHours(0, 0, 0, 0);

          let status: 'pendente' | 'atrasado' = 'pendente';
          if (vencimento < hoje) {
            status = 'atrasado';
          }

          const contaData = {
            descricao: `${data.descricao} (${recorrencia.numero}/${recorrencia.totalParcelas})`,
            valor: recorrencia.valorPagar,
            data_vencimento: formatDateToISO(recorrencia.dataVencimento),
            status,
            categoria_id: data.categoriaId || null,
            observacoes: data.observacoes || null,
            banco_id: data.bancoId || null,
          };

          await createItem(contaData);
        }
        toast.success(`✓ Evento Lançado com Sucesso! ${parcelasRecorrentes.length} recorrências criadas.`);
        onOpenChange(false);
        onSave();
      }
      // Se não tem parcelas nem recorrências, criar apenas uma conta
      else {
        const valor = parseFloat(data.valor.replace(/[^\d,]/g, '').replace(',', '.'));
        
        const vencimento = new Date(data.dataEmissao);
        vencimento.setHours(0, 0, 0, 0);

        let status: 'pendente' | 'atrasado' = 'pendente';
        if (vencimento < hoje) {
          status = 'atrasado';
        }

        const contaPagar = {
          descricao: data.descricao,
          categoria_id: data.categoriaId,
          valor,
          data_vencimento: formatDateToISO(data.dataEmissao),
          status,
          observacoes: data.observacoes || null,
          banco_id: data.bancoId || null,
        };

        await createItem(contaPagar);
        toast.success("✓ Evento Lançado com Sucesso!");
        onOpenChange(false);
        onSave();
      }
    } catch (error: any) {
      console.error('Erro ao salvar conta:', error);
      toast.error('Erro ao salvar conta: ' + (error.message || 'Erro desconhecido'));
    }
  };

  // Função auxiliar para formatar data sem problemas de timezone
  function formatDateToISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    if (errors.fornecedorNome) {
      errorMessages.push(`• Nome do Fornecedor: ${errors.fornecedorNome.message}`);
    }
    if (errors.fornecedorDocumento) {
      errorMessages.push(`• CPF/CNPJ do Fornecedor: ${errors.fornecedorDocumento.message}`);
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
    if (errors.totalParcelas) {
      errorMessages.push(`• Total de Parcelas: ${errors.totalParcelas.message}`);
    }
    if (errors.frequenciaRecorrencia) {
      errorMessages.push(`• Frequência de Recorrência: ${errors.frequenciaRecorrencia.message}`);
    }
    
    if (errorMessages.length > 0) {
      toast.error(
        `Salvamento não foi possível devido a:\n\n${errorMessages.join('\n')}`,
        { duration: 5000 }
      );
    }
  }

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length === 0) {
      form.setValue('valor', '');
      return;
    }
    const numValue = parseInt(value) / 100;
    form.setValue('valor', numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const getCategoriaById = (id: string) => categorias.find(c => c.id === id);

  const handleGerarParcelas = () => {
    const valorString = form.getValues("valor");
    const dataEmissao = form.getValues("dataEmissao");
    
    console.log('Valores do formulário:', { valorString, dataEmissao, numeroParcelas, dataVencimentoParcelas });
    
    // Validações com feedback ao usuário
    if (!valorString || valorString === '' || valorString === '0,00') {
      toast.error('Por favor, informe o valor total da conta antes de gerar as parcelas.');
      return;
    }
    
    if (!numeroParcelas || numeroParcelas < 1) {
      toast.error('O número de parcelas deve ser no mínimo 1.');
      return;
    }
    
    if (numeroParcelas > 60) {
      toast.error('O número de parcelas não pode ser maior que 60.');
      return;
    }
    
    if (!dataVencimentoParcelas) {
      toast.error('Por favor, informe a data de vencimento da primeira parcela.');
      return;
    }
    
    const valorTotal = parseFloat(valorString.replace(/[^\d,]/g, '').replace(',', '.'));
    
    if (isNaN(valorTotal) || valorTotal <= 0) {
      toast.error('Valor informado é inválido.');
      return;
    }
    
    const valorParcela = valorTotal / numeroParcelas;
    
    // Usar data de emissão do formulário ou data atual se não estiver preenchida
    const dataEmissaoFinal = dataEmissao || new Date();
    
    const novasParcelas: Parcela[] = [];
    for (let i = 0; i < numeroParcelas; i++) {
      novasParcelas.push({
        numero: i + 1,
        total: numeroParcelas,
        valor: valorParcela,
        dataVencimento: addDays(dataVencimentoParcelas, i * 30),
        dataEmissao: dataEmissaoFinal,
      });
    }
    
    setParcelas(novasParcelas);
    form.setValue('totalParcelas', numeroParcelas);
    setParcelaDialogOpen(false);
    toast.success(`✓ ${numeroParcelas} parcelas geradas com sucesso!`);
  };

  const handleRemoverParcela = (index: number) => {
    setParcelas(parcelas.filter((_, i) => i !== index));
  };

  const handleGerarParcelasRecorrentes = () => {
    const valorString = form.getValues("valor");
    
    // Validações com feedback ao usuário
    if (!valorString || valorString === '' || valorString === '0,00') {
      toast.error('Por favor, informe o valor total da conta antes de gerar as parcelas recorrentes.');
      return;
    }
    
    if (!numeroParcelasRecorrente || numeroParcelasRecorrente < 1) {
      toast.error('O número de parcelas deve ser no mínimo 1.');
      return;
    }
    
    if (numeroParcelasRecorrente > 60) {
      toast.error('O número de parcelas não pode ser maior que 60.');
      return;
    }
    
    if (!dataVencimentoRecorrente) {
      toast.error('Por favor, informe a data de vencimento da primeira parcela.');
      return;
    }
    
    const valorTotal = parseFloat(valorString.replace(/[^\d,]/g, '').replace(',', '.'));
    
    if (isNaN(valorTotal) || valorTotal <= 0) {
      toast.error('Valor informado é inválido.');
      return;
    }
    
    const novasParcelasRecorrentes: ParcelaRecorrente[] = [];
    for (let i = 0; i < numeroParcelasRecorrente; i++) {
      // Calcular a data de vencimento adicionando meses
      const dataVenc = addMonths(dataVencimentoRecorrente, i);
      // Data de emissão é sempre o dia 1 do mês do vencimento
      const dataEmis = startOfMonth(dataVenc);
      
      novasParcelasRecorrentes.push({
        numero: i + 1,
        dataEmissao: dataEmis,
        valorTotal: valorTotal,
        totalParcelas: numeroParcelasRecorrente,
        valorPagar: valorTotal,
        dataVencimento: dataVenc,
      });
    }
    
    setParcelasRecorrentes(novasParcelasRecorrentes);
    setRecorrenteDialogOpen(false);
    toast.success(`✓ ${numeroParcelasRecorrente} parcelas recorrentes geradas com sucesso!`);
  };

  const handleRemoverParcelaRecorrente = (index: number) => {
    setParcelasRecorrentes(parcelasRecorrentes.filter((_, i) => i !== index));
  };

  return (
    <>
      {/* Diálogo de Parcelamento */}
      <Dialog open={parcelaDialogOpen} onOpenChange={setParcelaDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#6B5047]">Configurar Parcelamento</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-[#6B5047] mb-2 block">
                Número de Parcelas *
              </label>
              <Input
                type="number"
                min="1"
                max="60"
                value={numeroParcelas}
                onChange={(e) => setNumeroParcelas(parseInt(e.target.value) || 1)}
                placeholder="Ex: 3"
              />
              <p className="text-xs text-[#9C8B82] mt-1">Mínimo 1, máximo 60 parcelas</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-[#6B5047] mb-2 block">
                Data de Vencimento da 1ª Parcela *
              </label>
              <DatePickerField
                value={dataVencimentoParcelas}
                onChange={(date) => date && setDataVencimentoParcelas(date)}
                placeholder="Selecione a data"
              />
              <p className="text-xs text-[#9C8B82] mt-1">
                As próximas parcelas terão vencimento a cada 30 dias
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setParcelaDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleGerarParcelas}
            >
              Gerar Parcelas
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Recorrência */}
      <Dialog open={recorrenteDialogOpen} onOpenChange={setRecorrenteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#6B5047]">Configurar Recorrência</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-[#6B5047] mb-2 block">
                Número de Parcelas *
              </label>
              <Input
                type="number"
                min="1"
                max="60"
                value={numeroParcelasRecorrente}
                onChange={(e) => setNumeroParcelasRecorrente(parseInt(e.target.value) || 1)}
                placeholder="Ex: 12"
              />
              <p className="text-xs text-[#9C8B82] mt-1">Mínimo 1, máximo 60 parcelas</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-[#6B5047] mb-2 block">
                Data de Vencimento *
              </label>
              <DatePickerField
                value={dataVencimentoRecorrente}
                onChange={(date) => date && setDataVencimentoRecorrente(date)}
                placeholder="Selecione a data"
              />
              <p className="text-xs text-[#9C8B82] mt-1">
                As próximas parcelas terão o mesmo dia de vencimento nos meses seguintes
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRecorrenteDialogOpen(false);
                form.setValue("recorrente", false);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleGerarParcelasRecorrentes}
            >
              Gerar Parcelas
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#6B5047]">
            {conta ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, handleFormError)} className="space-y-6">
            {/* Datas */}
            <div className="bg-white rounded-lg p-5 border border-[#E8E3DF] shadow-sm hover:shadow-md transition-shadow space-y-4">
              <h3 className="font-semibold text-[#6B5047] flex items-center gap-2 pb-2 border-b border-[#E8E3DF]">
                <Calendar className="h-5 w-5 text-[#D89B8C]" />
                Data
              </h3>

              <FormField
                control={form.control}
                name="dataEmissao"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-[#6B5047]">Data de Emissão *</FormLabel>
                    <FormControl>
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Selecione a data"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Fornecedor */}
            <div className="bg-white rounded-lg p-5 border border-[#E8E3DF] shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E3DF]">
                <h3 className="font-semibold text-[#6B5047] flex items-center gap-2">
                  <User className="h-5 w-5 text-[#D89B8C]" />
                  Fornecedor
                </h3>
                <Link 
                  to="/cadastros/fornecedores"
                  className="text-xs text-[#D89B8C] hover:text-[#B87C6D] flex items-center gap-1 transition-colors"
                  target="_blank"
                >
                  <ExternalLink className="h-3 w-3" />
                  Gerenciar Fornecedores
                </Link>
              </div>

              <FormField
                control={form.control}
                name="fornecedorNome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#6B5047]">Nome do Fornecedor *</FormLabel>
                    <FormControl>
                      <FornecedorAutocomplete
                        value={field.value || ""}
                        onSelect={(nome, documento) => {
                          field.onChange(nome);
                          if (documento) {
                            form.setValue('fornecedorDocumento', documento);
                          }
                        }}
                        placeholder="Selecione um fornecedor..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fornecedorDocumento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#6B5047]">CPF/CNPJ</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        {...field}
                        onChange={(e) => {
                          const formatted = formatCpfCnpj(e.target.value);
                          field.onChange(formatted);
                        }}
                        maxLength={18}
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
                  <Building2 className="h-5 w-5 text-[#D89B8C]" />
                  Documento
                </h3>
                <div className="flex gap-2">
                  <Link 
                    to="/configuracoes"
                    className="text-xs text-[#D89B8C] hover:text-[#B87C6D] flex items-center gap-1 transition-colors"
                    target="_blank"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Gerenciar Bancos
                  </Link>
                  <Link 
                    to="/financeiro/tipos-documento"
                    className="text-xs text-[#D89B8C] hover:text-[#B87C6D] flex items-center gap-1 transition-colors"
                    target="_blank"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Gerenciar Tipos
                  </Link>
                </div>
              </div>

              <FormField
                control={form.control}
                name="tipoDocumentoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#6B5047]">Tipo de Documento *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                    <FormLabel className="text-[#6B5047]">Banco *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={bancos.length === 0 ? "Nenhum banco cadastrado" : "Selecione..."} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bancos.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            Nenhum banco cadastrado
                          </div>
                        ) : (
                          bancos.map((banco) => (
                            <SelectItem key={banco.id} value={banco.id}>
                              {banco.nome}
                            </SelectItem>
                          ))
                        )}
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
                    <FormLabel className="text-[#6B5047]">Número do Documento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: NF-12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Descrição */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#6B5047]">
                    Descrição *
                    <span className="text-xs text-[#9C8B82] ml-2">({field.value.length}/200 caracteres)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Conta de Luz - Outubro, Fornecedor ABC - Ingredientes"
                      {...field}
                      maxLength={200}
                    />
                  </FormControl>
                  <p className="text-xs text-[#9C8B82]">Descreva a despesa de forma clara e objetiva</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Categoria e Plano de Contas */}
            <div className="bg-white rounded-lg p-5 border border-[#E8E3DF] shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E3DF]">
                <h3 className="font-semibold text-[#6B5047] flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#D89B8C]" />
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
                    <FormLabel className="text-[#6B5047]">Categoria *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Limpa o plano de contas quando mudar a categoria
                        form.setValue('planoContaId', '');
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoriasDespesa.length === 0 ? (
                          <div className="p-2 text-sm text-[#9C8B82]">
                            Nenhuma categoria de despesa cadastrada
                          </div>
                        ) : (
                          categoriasDespesa.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: cat.cor }}
                                />
                                {cat.nome}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {categoriasDespesa.length === 0 && (
                      <Link 
                        to="/financeiro/categorias-financeiras"
                        className="text-xs text-[#D89B8C] hover:text-[#B87C6D] flex items-center gap-1 mt-2"
                        target="_blank"
                      >
                        <ExternalLink className="h-3 w-3" />
                        + Criar categoria
                      </Link>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="planoContaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#6B5047]">
                      Plano de Contas *
                      <Link 
                        to="/financeiro/planos-contas"
                        className="text-xs text-[#D89B8C] hover:text-[#B87C6D] ml-2 inline-flex items-center gap-1"
                        target="_blank"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Gerenciar Planos
                      </Link>
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedCategoriaId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o plano..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {planosDisponiveis.length === 0 ? (
                          <div className="p-2 text-sm text-[#9C8B82]">
                            {selectedCategoriaId 
                              ? "Nenhum plano de contas disponível para esta categoria" 
                              : "Selecione uma categoria primeiro"}
                          </div>
                        ) : (
                          planosDisponiveis.map((plano) => (
                            <SelectItem key={plano.id} value={plano.id}>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-[#9C8B82]">{plano.codigo}</span>
                                <span>{plano.nome}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {planosDisponiveis.length === 0 && selectedCategoriaId && (
                      <Link 
                        to="/financeiro/planos-contas"
                        className="text-xs text-[#D89B8C] hover:text-[#B87C6D] flex items-center gap-1 mt-2"
                        target="_blank"
                      >
                        <ExternalLink className="h-3 w-3" />
                        + Criar plano de contas
                      </Link>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Valores */}
            <div className="bg-white rounded-lg p-5 border border-[#E8E3DF] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center pb-4 border-b border-[#E8E3DF]">
                <h3 className="font-semibold text-[#6B5047] flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#D89B8C]" />
                  Valores
                </h3>
              </div>

              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel className="text-[#6B5047]">Valor *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8B82] font-semibold">R$</span>
                        <Input
                          {...field}
                          onChange={handleValorChange}
                          placeholder="0,00"
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <p className="text-xs text-[#9C8B82]">Valor total da despesa</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Checkboxes de Parcela e Recorrente */}
              <div className="mt-6 pt-4 border-t border-[#E8E3DF] grid grid-cols-2 gap-3">
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
                              setParcelaDialogOpen(true);
                            } else {
                              setParcelas([]);
                              form.setValue('totalParcelas', undefined);
                            }
                          }}
                          className="border-[#8BA888] data-[state=checked]:bg-[#8BA888] data-[state=checked]:border-[#8BA888]"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium text-[#6B5047] cursor-pointer">
                          Parcela
                        </FormLabel>
                        <p className="text-xs text-[#9C8B82]">Despesa parcelada</p>
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
                            if (!checked) {
                              setParcelasRecorrentes([]);
                            }
                          }}
                          className="border-[#7BA8D8] data-[state=checked]:bg-[#7BA8D8] data-[state=checked]:border-[#7BA8D8]"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium text-[#6B5047] cursor-pointer">
                          Recorrente
                        </FormLabel>
                        <p className="text-xs text-[#9C8B82]">Despesa recorrente</p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Tabela de Parcelas */}
              {parcelas.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-semibold text-[#6B5047] flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#D89B8C]" />
                    Parcelas Configuradas
                  </h4>
                  
                  <div className="border border-[#E8E3DF] rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#FAF7F5]">
                          <TableHead className="text-[#6B5047]">Data Emissão</TableHead>
                          <TableHead className="text-[#6B5047] text-right">Valor Total</TableHead>
                          <TableHead className="text-[#6B5047]">Parcela</TableHead>
                          <TableHead className="text-[#6B5047]">Data Vencimento</TableHead>
                          <TableHead className="text-[#6B5047] text-right">Valor a Pagar</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parcelas.map((parcela, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {format(parcela.dataEmissao, "dd/MM/yyyy")}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              R$ {(parcela.valor * parcela.total).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="font-medium">
                              {parcela.numero} de {parcela.total}
                            </TableCell>
                            <TableCell>
                              {format(parcela.dataVencimento, "dd/MM/yyyy")}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              R$ {parcela.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoverParcela(index)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-[#FAF7F5] rounded-lg border border-[#E8E3DF]">
                    <span className="font-semibold text-[#6B5047]">Valor Total:</span>
                    <span className="font-bold text-lg text-[#6B5047]">
                      R$ {(parcelas.reduce((acc, p) => acc + p.valor, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Tabela de Parcelas Recorrentes */}
              {parcelasRecorrentes.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-semibold text-[#6B5047] flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#D89B8C]" />
                    Parcelas Recorrentes Configuradas
                  </h4>
                  
                  <div className="border border-[#E8E3DF] rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#FAF7F5]">
                          <TableHead className="text-[#6B5047]">Data Emissão</TableHead>
                          <TableHead className="text-[#6B5047] text-right">Valor Total</TableHead>
                          <TableHead className="text-[#6B5047]">Parcela</TableHead>
                          <TableHead className="text-[#6B5047] text-right">Valor a Pagar</TableHead>
                          <TableHead className="text-[#6B5047]">Data Vencimento</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parcelasRecorrentes.map((parcela, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {format(parcela.dataEmissao, "dd/MM/yyyy")}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              R$ {parcela.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="font-medium">
                              {parcela.numero} de {parcela.totalParcelas}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              R$ {parcela.valorPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              {format(parcela.dataVencimento, "dd/MM/yyyy")}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoverParcelaRecorrente(index)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>

            {/* Observações */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#6B5047]">
                    Observações
                    <span className="text-xs text-[#9C8B82] ml-2">({field.value?.length || 0}/500 caracteres)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais sobre esta despesa..."
                      className="resize-none"
                      rows={3}
                      maxLength={500}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            {/* Ações */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Salvar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
}
