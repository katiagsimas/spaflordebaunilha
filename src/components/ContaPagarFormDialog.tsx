import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, DollarSign, FileText, Building2, Calendar, User, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { formatCpfCnpj } from "@/lib/utils";

interface ContaPagar {
  id: string;
  descricao: string;
  categoriaId: string;
  planoContaId: string;
  valor: number;
  dataEmissao: string;
  dataVencimento: string;
  dataPagamento?: string;
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  formaPagamento?: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'transferencia' | 'boleto' | 'outros';
  bancoId?: string;
  tipoDocumentoId?: string;
  numeroDocumento?: string;
  fornecedorNome?: string;
  fornecedorDocumento?: string;
  observacoes?: string;
  parcelado: boolean;
  numeroParcela?: number;
  totalParcelas?: number;
  grupoParcelasId?: string;
  recorrente: boolean;
  frequenciaRecorrencia?: 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';
  proximaRecorrencia?: string;
  centroCusto?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface Categoria {
  id: string;
  nome: string;
  cor: string;
  tipo: 'receita' | 'despesa';
}

interface PlanoContas {
  id: string;
  nome: string;
  categoriaId: string;
}

interface TipoDocumento {
  id: string;
  nome: string;
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
  dataVencimento: z.date(),
  fornecedorNome: z.string().max(100, "Nome deve ter no máximo 100 caracteres").optional(),
  fornecedorDocumento: z.string().optional(),
  tipoDocumentoId: z.string().optional(),
  numeroDocumento: z.string().max(50, "Número deve ter no máximo 50 caracteres").optional(),
  observacoes: z.string().max(500, "Observações devem ter no máximo 500 caracteres").optional(),
  parcelado: z.boolean(),
  numeroParcela: z.number().optional(),
  totalParcelas: z.number().min(2, "Mínimo 2 parcelas").max(60, "Máximo 60 parcelas").optional(),
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
  const emissao = new Date(data.dataEmissao);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  emissao.setHours(0, 0, 0, 0);
  return emissao <= hoje;
}, {
  message: "Data de emissão não pode ser futura",
  path: ["dataEmissao"],
}).refine((data) => data.dataVencimento >= data.dataEmissao, {
  message: "Data de vencimento deve ser igual ou posterior à data de emissão",
  path: ["dataVencimento"],
}).refine((data) => {
  if (data.parcelado && (!data.totalParcelas || data.totalParcelas < 2)) {
    return false;
  }
  return true;
}, {
  message: "Para despesas parceladas, informe o número de parcelas (mínimo 2)",
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

interface ContaPagarFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta?: ContaPagar;
  onSave: (conta: ContaPagar) => void;
}

export function ContaPagarFormDialog({ open, onOpenChange, conta, onSave }: ContaPagarFormDialogProps) {
  const [categorias] = useLocalStorage<Categoria[]>("categorias_financeiras", []);
  const [planos] = useLocalStorage<PlanoContas[]>("planos_contas", []);
  const [tiposDocumento] = useLocalStorage<TipoDocumento[]>("tipos_documento", []);

  const categoriasDespesa = categorias.filter(c => c.tipo === 'despesa');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: "",
      categoriaId: "",
      planoContaId: "",
      valor: "",
      dataEmissao: new Date(),
      dataVencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 dias
      fornecedorNome: "",
      fornecedorDocumento: "",
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
  const planosDisponiveis = planos.filter(p => p.categoriaId === selectedCategoriaId);

  useEffect(() => {
    if (conta) {
      form.reset({
        descricao: conta.descricao,
        categoriaId: conta.categoriaId,
        planoContaId: conta.planoContaId,
        valor: conta.valor.toString(),
        dataEmissao: new Date(conta.dataEmissao),
        dataVencimento: new Date(conta.dataVencimento),
        fornecedorNome: conta.fornecedorNome || "",
        fornecedorDocumento: conta.fornecedorDocumento || "",
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
        dataVencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        fornecedorNome: "",
        fornecedorDocumento: "",
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

  const onSubmit = (data: FormValues) => {
    const valor = parseFloat(data.valor.replace(/[^\d,]/g, '').replace(',', '.'));
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataVenc = new Date(data.dataVencimento);
    dataVenc.setHours(0, 0, 0, 0);
    let status: 'pendente' | 'atrasado' = 'pendente';
    
    if (dataVenc < hoje) {
      status = 'atrasado';
    }

    const contaPagar: ContaPagar = {
      id: conta?.id || crypto.randomUUID(),
      descricao: data.descricao,
      categoriaId: data.categoriaId,
      planoContaId: data.planoContaId,
      valor,
      dataEmissao: data.dataEmissao.toISOString(),
      dataVencimento: data.dataVencimento.toISOString(),
      status,
      fornecedorNome: data.fornecedorNome || undefined,
      fornecedorDocumento: data.fornecedorDocumento || undefined,
      tipoDocumentoId: data.tipoDocumentoId || undefined,
      numeroDocumento: data.numeroDocumento || undefined,
      observacoes: data.observacoes || undefined,
      parcelado: data.parcelado,
      numeroParcela: data.numeroParcela,
      totalParcelas: data.totalParcelas,
      recorrente: data.recorrente,
      frequenciaRecorrencia: data.frequenciaRecorrencia,
      proximaRecorrencia: data.proximaRecorrencia?.toISOString(),
      createdAt: conta?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(contaPagar);
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#6B5047]">
            {conta ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <FormLabel className="text-[#6B5047]">Plano de Contas *</FormLabel>
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
                              ? "Nenhum plano cadastrado para esta categoria" 
                              : "Selecione uma categoria primeiro"}
                          </div>
                        ) : (
                          planosDisponiveis.map((plano) => (
                            <SelectItem key={plano.id} value={plano.id}>
                              {plano.nome}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Valores */}
            <div className="bg-white rounded-lg p-5 border border-[#E8E3DF] shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-[#6B5047] flex items-center gap-2 pb-4 border-b border-[#E8E3DF]">
                <DollarSign className="h-5 w-5 text-[#D89B8C]" />
                Valores
              </h3>

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
            </div>

            {/* Datas */}
            <div className="bg-white rounded-lg p-5 border border-[#E8E3DF] shadow-sm hover:shadow-md transition-shadow space-y-4">
              <h3 className="font-semibold text-[#6B5047] flex items-center gap-2 pb-2 border-b border-[#E8E3DF]">
                <Calendar className="h-5 w-5 text-[#D89B8C]" />
                Datas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dataEmissao"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-[#6B5047]">Data de Emissão *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-[#9C8B82]">Data em que a despesa foi gerada</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataVencimento"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-[#6B5047]">Data de Vencimento *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-[#9C8B82]">Data limite para pagamento</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Fornecedor */}
            <div className="bg-white rounded-lg p-5 border border-[#E8E3DF] shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E3DF]">
                <h3 className="font-semibold text-[#6B5047] flex items-center gap-2">
                  <User className="h-5 w-5 text-[#D89B8C]" />
                  Fornecedor (opcional)
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
                    <FormLabel className="text-[#6B5047]">Nome do Fornecedor</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: CPFL, Fornecedor ABC Ingredientes" 
                        maxLength={100}
                        {...field} 
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
                  Documento (opcional)
                </h3>
                <Link 
                  to="/financeiro/tipos-documento"
                  className="text-xs text-[#D89B8C] hover:text-[#B87C6D] flex items-center gap-1 transition-colors"
                  target="_blank"
                >
                  <ExternalLink className="h-3 w-3" />
                  Gerenciar Tipos
                </Link>
              </div>

              <FormField
                control={form.control}
                name="tipoDocumentoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#6B5047]">Tipo de Documento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tiposDocumento.map((tipo) => (
                          <SelectItem key={tipo.id} value={tipo.id}>
                            {tipo.nome}
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
                    <FormLabel className="text-[#6B5047]">Número do Documento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: NF-12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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

            {/* Opções Avançadas */}
            <div className="space-y-4 p-4 bg-[#FAF7F5] rounded-lg border border-[#E8E3DF]">
              <FormField
                control={form.control}
                name="parcelado"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-[#6B5047] font-semibold">
                        Esta é uma despesa parcelada
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {/* Expandir opções de parcelamento */}
              {parcelado && (
                <div className="ml-6 space-y-4 p-4 bg-white rounded-lg border border-[#E8E3DF]">
                  <FormField
                    control={form.control}
                    name="totalParcelas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5047]">Número de Parcelas *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="2"
                            max="60"
                            placeholder="Ex: 12"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <p className="text-xs text-[#9C8B82]">Mínimo 2 parcelas, máximo 60</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numeroParcela"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5047]">Esta é a parcela número</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Ex: 1"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <p className="text-xs text-[#9C8B82]">Deixe vazio para gerar todas as parcelas automaticamente</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="recorrente"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-[#6B5047] font-semibold">
                        Esta é uma despesa recorrente
                      </FormLabel>
                      <p className="text-xs text-[#9C8B82]">Despesas que se repetem periodicamente</p>
                    </div>
                  </FormItem>
                )}
              />

              {/* Expandir opções de recorrência */}
              {recorrente && (
                <div className="ml-6 space-y-4 p-4 bg-white rounded-lg border border-[#E8E3DF]">
                  <FormField
                    control={form.control}
                    name="frequenciaRecorrencia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#6B5047]">Frequência *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a frequência..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mensal">Mensal (Ex: Aluguel, Luz, Água)</SelectItem>
                            <SelectItem value="bimestral">Bimestral</SelectItem>
                            <SelectItem value="trimestral">Trimestral</SelectItem>
                            <SelectItem value="semestral">Semestral</SelectItem>
                            <SelectItem value="anual">Anual (Ex: Impostos, Seguros)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="proximaRecorrencia"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-[#6B5047]">Próxima Recorrência</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy")
                                ) : (
                                  <span>Selecione a data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <p className="text-xs text-[#9C8B82]">💡 Dica: Despesas recorrentes são criadas automaticamente na data programada</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

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
  );
}
