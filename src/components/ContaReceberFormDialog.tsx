import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { formatCpfCnpj } from "@/lib/utils";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";

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
  nome: string;
  ativo: boolean;
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
  dataVencimento: z.date(),
  clienteNome: z.string().max(100).optional().or(z.literal("")),
  clienteDocumento: z.string().optional().or(z.literal("")),
  tipoDocumentoId: z.string().optional().or(z.literal("")),
  numeroDocumento: z.string().max(50).optional().or(z.literal("")),
  observacoes: z.string().max(500).optional().or(z.literal("")),
  parcelado: z.boolean(),
  numeroParcela: z.number().optional(),
  totalParcelas: z.number().optional(),
  recorrente: z.boolean(),
  frequenciaRecorrencia: z.string().optional().or(z.literal("")),
}).refine((data) => data.dataVencimento >= data.dataEmissao, {
  message: "Data de vencimento deve ser igual ou posterior à data de emissão",
  path: ["dataVencimento"],
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
  const [categorias] = useLocalStorage<Categoria[]>("sugarbox_categorias_financeiras", []);
  const [planosContas] = useLocalStorage<PlanoContas[]>("sugarbox_planos_contas", []);
  const [tiposDocumento] = useLocalStorage<TipoDocumento[]>("sugarbox_tipos_documento", []);
  const [contas, setContas] = useLocalStorage<ContaReceber[]>("sugarbox_contas_receber", []);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>("");
  const [valorInput, setValorInput] = useState("");

  const categoriasReceita = categorias.filter(c => c.tipo === 'receita' && c.ativa);
  const planosContasFiltrados = planosContas.filter(
    p => p.categoriaId === selectedCategoriaId && p.ativo
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: "",
      categoriaId: "",
      planoContaId: "",
      valor: 0,
      dataEmissao: new Date(),
      dataVencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      clienteNome: "",
      clienteDocumento: "",
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

  useEffect(() => {
    if (conta) {
      form.reset({
        descricao: conta.descricao,
        categoriaId: conta.categoriaId,
        planoContaId: conta.planoContaId,
        valor: conta.valor,
        dataEmissao: new Date(conta.dataEmissao),
        dataVencimento: new Date(conta.dataVencimento),
        clienteNome: conta.clienteNome || "",
        clienteDocumento: conta.clienteDocumento || "",
        tipoDocumentoId: conta.tipoDocumentoId || "",
        numeroDocumento: conta.numeroDocumento || "",
        observacoes: conta.observacoes || "",
        parcelado: conta.parcelado,
        numeroParcela: conta.numeroParcela,
        totalParcelas: conta.totalParcelas,
        recorrente: conta.recorrente,
        frequenciaRecorrencia: conta.frequenciaRecorrencia || "mensal",
      });
      setSelectedCategoriaId(conta.categoriaId);
      setValorInput(conta.valor.toFixed(2));
    } else {
      form.reset({
        descricao: "",
        categoriaId: "",
        planoContaId: "",
        valor: 0,
        dataEmissao: new Date(),
        dataVencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        clienteNome: "",
        clienteDocumento: "",
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
      setValorInput("");
    }
  }, [conta, form, open]);

  function onSubmit(values: FormValues) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(values.dataVencimento);
    vencimento.setHours(0, 0, 0, 0);

    let status: 'pendente' | 'atrasado' = 'pendente';
    if (vencimento < hoje) {
      status = 'atrasado';
    }

    const novaConta: ContaReceber = {
      id: conta?.id || crypto.randomUUID(),
      descricao: values.descricao.trim(),
      categoriaId: values.categoriaId,
      planoContaId: values.planoContaId,
      valor: values.valor,
      dataEmissao: values.dataEmissao.toISOString(),
      dataVencimento: values.dataVencimento.toISOString(),
      status,
      clienteNome: values.clienteNome?.trim(),
      clienteDocumento: values.clienteDocumento?.trim(),
      tipoDocumentoId: values.tipoDocumentoId,
      numeroDocumento: values.numeroDocumento?.trim(),
      observacoes: values.observacoes?.trim(),
      parcelado: values.parcelado,
      numeroParcela: values.numeroParcela,
      totalParcelas: values.totalParcelas,
      recorrente: values.recorrente,
      frequenciaRecorrencia: values.frequenciaRecorrencia,
      tags: [],
      createdAt: conta?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const contasAtualizadas = conta
      ? contas.map(c => c.id === conta.id ? novaConta : c)
      : [...contas, novaConta];

    contasAtualizadas.sort((a, b) => 
      new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime()
    );

    setContas(contasAtualizadas);
    toast.success(conta ? "✓ Conta atualizada com sucesso!" : "✓ Conta a receber criada com sucesso!");
    onOpenChange(false);
    onSave();
  }

  function handleValorChange(value: string) {
    const numericValue = value.replace(/[^\d,]/g, '').replace(',', '.');
    setValorInput(value);
    const parsed = parseFloat(numericValue);
    if (!isNaN(parsed)) {
      form.setValue('valor', parsed);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{conta ? "Editar Conta a Receber" : "Nova Conta a Receber"}</DialogTitle>
          <DialogDescription>
            Preencha os dados da conta a receber
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Descrição */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Venda de bolo para Maria Silva, Encomenda Casamento"
                      {...field}
                      maxLength={200}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Categoria e Plano de Contas */}
            <div className="border border-[#E8E3DF] rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-[#6B5047]">Categoria e Plano de Contas</h3>
              
              <FormField
                control={form.control}
                name="categoriaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedCategoriaId(value);
                        form.setValue('planoContaId', '');
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background">
                        {categoriasReceita.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icone && <span className="mr-2">{cat.icone}</span>}
                            {cat.nome}
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
                    <FormLabel>Plano de Contas *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!selectedCategoriaId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedCategoriaId ? "Selecione o plano..." : "Primeiro selecione uma categoria"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background">
                        {planosContasFiltrados.map((plano) => (
                          <SelectItem key={plano.id} value={plano.id}>
                            {plano.nome}
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
            <div className="border border-[#E8E3DF] rounded-lg p-4">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9C8B82]" />
                        <Input
                          type="text"
                          placeholder="0,00"
                          value={valorInput}
                          onChange={(e) => handleValorChange(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Datas */}
            <div className="border border-[#E8E3DF] rounded-lg p-4">
              <h3 className="font-semibold text-[#6B5047] mb-4">Datas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dataEmissao"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Emissão *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Selecione...</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
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
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataVencimento"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Vencimento *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Selecione...</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Cliente */}
            <div className="border border-[#E8E3DF] rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-[#6B5047]">Cliente (opcional)</h3>
              
              <FormField
                control={form.control}
                name="clienteNome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} maxLength={100} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clienteDocumento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF/CNPJ</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        value={field.value ? formatCpfCnpj(field.value) : ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Documento */}
            <div className="border border-[#E8E3DF] rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-[#6B5047]">Documento (opcional)</h3>
              
              <FormField
                control={form.control}
                name="tipoDocumentoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Documento</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background">
                        {tiposDocumento.filter(t => t.ativo).map((tipo) => (
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
                    <FormLabel>Número do Documento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: NF-001234" {...field} maxLength={50} />
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
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais..."
                      rows={3}
                      maxLength={500}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Opções */}
            <div className="space-y-3">
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
                      <FormLabel>Esta é uma receita parcelada</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

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
                      <FormLabel>Esta é uma receita recorrente</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#D89B8C] hover:bg-[#B87C6D]">
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
