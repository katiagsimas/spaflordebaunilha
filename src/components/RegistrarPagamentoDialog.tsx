import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, AlertCircle, TrendingDown, TrendingUp } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface RegistrarPagamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta?: any;
  onSave: (conta: any) => void;
  tipo?: 'receber' | 'pagar';
}

interface Banco {
  id: string;
  nome: string;
}

const formSchema = z.object({
  dataPagamento: z.date(),
  valorPago: z.string().min(1, "Informe o valor pago"),
  formaPagamento: z.string().min(1, "Selecione a forma de pagamento"),
  bancoId: z.string().min(1, "Selecione o banco"),
  observacoesPagamento: z.string().max(200, "Máximo 200 caracteres").optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function RegistrarPagamentoDialog({ open, onOpenChange, conta, onSave, tipo = 'receber' }: RegistrarPagamentoDialogProps) {
  const [bancos] = useLocalStorage<Banco[]>("bancos", []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dataPagamento: new Date(),
      valorPago: "",
      formaPagamento: "",
      bancoId: "",
      observacoesPagamento: "",
    },
  });

  const valorPago = form.watch("valorPago");

  // Calcular diferença de valor
  const diferencaValor = useMemo(() => {
    if (!conta || !valorPago) return null;
    
    const valorPagoNum = parseFloat(valorPago.replace(/[^\d,]/g, '').replace(',', '.'));
    if (isNaN(valorPagoNum)) return null;
    
    const diferenca = valorPagoNum - conta.valor;
    return {
      valor: Math.abs(diferenca),
      tipo: diferenca > 0 ? 'acrescimo' : diferenca < 0 ? 'desconto' : 'igual'
    };
  }, [conta, valorPago]);

  // Calcular dias de atraso
  const diasAtraso = useMemo(() => {
    if (!conta) return 0;
    const hoje = new Date();
    const vencimento = new Date(conta.dataVencimento);
    return differenceInDays(hoje, vencimento);
  }, [conta]);

  useEffect(() => {
    if (open && conta) {
      form.reset({
        dataPagamento: new Date(),
        valorPago: conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        formaPagamento: "",
        bancoId: "",
        observacoesPagamento: "",
      });
    }
  }, [open, conta, form]);

  const onSubmit = (data: FormValues) => {
    if (!conta) return;

    const valorPagoNum = parseFloat(data.valorPago.replace(/[^\d,]/g, '').replace(',', '.'));

    const contaAtualizada = {
      ...conta,
      status: 'pago',
      dataPagamento: data.dataPagamento.toISOString(),
      valorPago: valorPagoNum,
      formaPagamento: data.formaPagamento,
      bancoId: data.bancoId,
      observacoesPagamento: data.observacoesPagamento || undefined,
      updatedAt: new Date().toISOString(),
    };

    onSave(contaAtualizada);
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length === 0) {
      form.setValue('valorPago', '');
      return;
    }
    const numValue = parseInt(value) / 100;
    form.setValue('valorPago', numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const formasPagamento = [
    { value: 'dinheiro', label: 'Dinheiro', icon: '💵' },
    { value: 'pix', label: 'Pix', icon: '📱' },
    { value: 'cartao_credito', label: 'Cartão de Crédito', icon: '💳' },
    { value: 'cartao_debito', label: 'Cartão de Débito', icon: '💳' },
    { value: 'transferencia', label: 'Transferência Bancária', icon: '🏦' },
    { value: 'boleto', label: 'Boleto', icon: '🧾' },
    { value: 'outros', label: 'Outros', icon: '📄' },
  ];

  if (!conta) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#6B5047]">
            {tipo === 'pagar' ? 'Registrar Pagamento' : 'Registrar Recebimento'}
          </DialogTitle>
        </DialogHeader>

        {/* Resumo da Conta */}
        <div className={cn(
          "p-4 rounded-lg border-2",
          conta.status === 'atrasado' ? "bg-[#FFEBEE] border-[#D88B8B]" : "bg-[#FAF7F5] border-[#E8E3DF]"
        )}>
          <div className="space-y-2">
            <h3 className="font-bold text-[#6B5047] text-lg">{conta.descricao}</h3>
            {conta.fornecedorNome && (
              <p className="text-sm text-[#9C8B82]">
                {tipo === 'pagar' ? 'Fornecedor' : 'Cliente'}: {conta.fornecedorNome}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#9C8B82]">Valor:</span>
              <span className="text-2xl font-bold text-[#6B5047]">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(conta.valor)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#9C8B82]">Vencimento:</span>
              <span className="font-medium text-[#6B5047]">
                {format(new Date(conta.dataVencimento), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
          </div>

          {conta.status === 'atrasado' && diasAtraso > 0 && (
            <div className="mt-3 p-3 bg-white rounded-lg flex items-center gap-2 text-[#C62828]">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="font-semibold text-sm">
                ⚠️ ATENÇÃO: Venceu há {diasAtraso} {diasAtraso === 1 ? 'dia' : 'dias'}
              </span>
            </div>
          )}

          {conta.status === 'pendente' && diasAtraso < 0 && Math.abs(diasAtraso) < 7 && (
            <div className="mt-3 p-3 bg-[#E3F2FD] rounded-lg flex items-center gap-2 text-[#1976D2]">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="font-medium text-sm">
                💡 Pagamento antecipado (vence em {Math.abs(diasAtraso)} {Math.abs(diasAtraso) === 1 ? 'dia' : 'dias'})
              </span>
            </div>
          )}
        </div>

        <Separator />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Data do Pagamento */}
            <FormField
              control={form.control}
              name="dataPagamento"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-[#6B5047] font-semibold">
                    Data do {tipo === 'pagar' ? 'Pagamento' : 'Recebimento'} *
                  </FormLabel>
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
                  <p className="text-xs text-[#9C8B82]">
                    Hoje: {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Valor Pago */}
            <FormField
              control={form.control}
              name="valorPago"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#6B5047] font-semibold">Valor Pago *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8B82] font-semibold">R$</span>
                      <Input
                        {...field}
                        onChange={handleValorChange}
                        placeholder="0,00"
                        className="pl-10 text-lg font-semibold"
                      />
                    </div>
                  </FormControl>
                  <p className="text-xs text-[#9C8B82]">
                    ℹ️ Altere se houver desconto, juros ou multa
                  </p>
                  
                  {/* Mostrar diferença de valor */}
                  {diferencaValor && diferencaValor.tipo !== 'igual' && (
                    <div className={cn(
                      "mt-2 p-3 rounded-lg flex items-center gap-2",
                      diferencaValor.tipo === 'desconto' ? "bg-[#E8F5E9] text-[#388E3C]" : "bg-[#FEF3E2] text-[#B8860B]"
                    )}>
                      {diferencaValor.tipo === 'desconto' ? (
                        <TrendingDown className="h-4 w-4 shrink-0" />
                      ) : (
                        <TrendingUp className="h-4 w-4 shrink-0" />
                      )}
                      <span className="font-semibold text-sm">
                        {diferencaValor.tipo === 'desconto' ? '✅ Desconto' : '⚠️ Acréscimo (juros/multa)'} de{' '}
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(diferencaValor.valor)}
                      </span>
                    </div>
                  )}
                  
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Forma de Pagamento */}
            <FormField
              control={form.control}
              name="formaPagamento"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-[#6B5047] font-semibold">
                    Forma de {tipo === 'pagar' ? 'Pagamento' : 'Recebimento'} *
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 gap-3"
                    >
                      {formasPagamento.map((forma) => (
                        <div key={forma.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={forma.value} id={forma.value} />
                          <label
                            htmlFor={forma.value}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                          >
                            <span>{forma.icon}</span>
                            {forma.label}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Banco */}
            <FormField
              control={form.control}
              name="bancoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#6B5047] font-semibold">Banco/Conta *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o banco..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bancos.length === 0 ? (
                        <div className="p-2 text-sm text-[#9C8B82]">
                          Nenhum banco cadastrado
                        </div>
                      ) : (
                        bancos.map((banco) => (
                          <SelectItem key={banco.id} value={banco.id}>
                            🏦 {banco.nome}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-[#9C8B82]">
                    De qual conta {tipo === 'pagar' ? 'saiu' : 'entrou'} o dinheiro?
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Observações do Pagamento */}
            <FormField
              control={form.control}
              name="observacoesPagamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#6B5047]">
                    Observações do {tipo === 'pagar' ? 'Pagamento' : 'Recebimento'}
                    <span className="text-xs text-[#9C8B82] ml-2">({field.value?.length || 0}/200 caracteres)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Pago com atraso, multa de R$ 10,00"
                      className="resize-none"
                      rows={2}
                      maxLength={200}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ações */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="lg">
                Confirmar {tipo === 'pagar' ? 'Pagamento' : 'Recebimento'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
