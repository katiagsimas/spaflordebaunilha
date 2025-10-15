import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, addDays } from "date-fns";
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
  codigo: string;
  descricao: string;
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
  const { categorias, loading: loadingCategorias } = useCategoriasFinanceiras();
  const { planoContas, loading: loadingPlanos } = usePlanoContas();
  const { tiposDocumento, loading: loadingTiposDocumento } = useTiposDocumento();
  const { bancos } = useBancos();
  
  const [parcelaDialogOpen, setParcelaDialogOpen] = useState(false);
  const [numeroParcelas, setNumeroParcelas] = useState<number>(2);
  const [dataVencimentoParcelas, setDataVencimentoParcelas] = useState<Date>(new Date());
  const [parcelas, setParcelas] = useState<Parcela[]>([]);

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

  const onSubmit = (data: FormValues) => {
    const valor = parseFloat(data.valor.replace(/[^\d,]/g, '').replace(',', '.'));

    const contaPagar: ContaPagar = {
      id: conta?.id || crypto.randomUUID(),
      descricao: data.descricao,
      categoriaId: data.categoriaId,
      planoContaId: data.planoContaId,
      valor,
      dataEmissao: data.dataEmissao.toISOString(),
      dataVencimento: data.dataEmissao.toISOString(), // Usa data de emissão como vencimento
      status: 'pendente',
      fornecedorNome: data.fornecedorNome || undefined,
      fornecedorDocumento: data.fornecedorDocumento || undefined,
      bancoId: data.bancoId || undefined,
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

  const handleGerarParcelas = () => {
    const valorString = form.getValues("valor");
    const dataEmissao = form.getValues("dataEmissao");
    
    if (!valorString || !dataEmissao) {
      return;
    }
    
    const valorTotal = parseFloat(valorString.replace(/[^\d,]/g, '').replace(',', '.'));
    const valorParcela = valorTotal / numeroParcelas;
    
    const novasParcelas: Parcela[] = [];
    for (let i = 0; i < numeroParcelas; i++) {
      novasParcelas.push({
        numero: i + 1,
        total: numeroParcelas,
        valor: valorParcela,
        dataVencimento: addDays(dataVencimentoParcelas, i * 30),
        dataEmissao: dataEmissao,
      });
    }
    
    setParcelas(novasParcelas);
    setParcelaDialogOpen(false);
  };

  const handleRemoverParcela = (index: number) => {
    setParcelas(parcelas.filter((_, i) => i !== index));
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
                min="2"
                max="60"
                value={numeroParcelas}
                onChange={(e) => setNumeroParcelas(parseInt(e.target.value) || 2)}
                placeholder="Ex: 3"
              />
              <p className="text-xs text-[#9C8B82] mt-1">Mínimo 2, máximo 60 parcelas</p>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#6B5047]">
            {conta ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <FormMessage />
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
                          <TableHead className="text-[#6B5047]">Parcela</TableHead>
                          <TableHead className="text-[#6B5047]">Data Emissão</TableHead>
                          <TableHead className="text-[#6B5047]">Data Vencimento</TableHead>
                          <TableHead className="text-[#6B5047] text-right">Valor</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parcelas.map((parcela, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {parcela.numero} de {parcela.total}
                            </TableCell>
                            <TableCell>
                              {format(parcela.dataEmissao, "dd/MM/yyyy")}
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

              {/* Checkboxes de Parcela e Recorrente */}
              <div className="mt-6 pt-4 border-t border-[#E8E3DF] space-y-3">
                <FormField
                  control={form.control}
                  name="parcelado"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) {
                              setParcelaDialogOpen(true);
                            } else {
                              setParcelas([]);
                            }
                          }}
                        />
                      </FormControl>
                      <FormLabel className="text-[#6B5047] cursor-pointer flex items-center gap-2 font-normal">
                        <CreditCard className="h-4 w-4 text-[#D89B8C]" />
                        Parcela
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recorrente"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-[#6B5047] cursor-pointer flex items-center gap-2 font-normal">
                        <Calendar className="h-4 w-4 text-[#D89B8C]" />
                        Recorrente
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
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
