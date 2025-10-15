import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { DatePickerField } from "@/components/DatePickerField";

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

interface Banco {
  id: string;
  nome: string;
  ativo: boolean;
}

const formSchema = z.object({
  dataRecebimento: z.date(),
  valorRecebido: z.number().min(0.01, "Valor deve ser maior que zero"),
  formaPagamento: z.string().min(1, "Selecione uma forma de pagamento"),
  bancoId: z.string().min(1, "Selecione um banco"),
  observacoes: z.string().max(200).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

interface RegistrarRecebimentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta: ContaReceber | null;
  onSave: () => void;
}

export function RegistrarRecebimentoDialog({
  open,
  onOpenChange,
  conta,
  onSave,
}: RegistrarRecebimentoDialogProps) {
  const [bancos] = useLocalStorage<Banco[]>("sugarbox_bancos", []);
  const [contas, setContas] = useLocalStorage<ContaReceber[]>("sugarbox_contas_receber", []);
  const [valorInput, setValorInput] = useState("");

  const bancosAtivos = bancos.filter(b => b.ativo);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dataRecebimento: new Date(),
      valorRecebido: 0,
      formaPagamento: 'pix',
      bancoId: "",
      observacoes: "",
    },
  });

  useEffect(() => {
    if (conta && open) {
      form.reset({
        dataRecebimento: new Date(),
        valorRecebido: conta.valor,
        formaPagamento: 'pix',
        bancoId: "",
        observacoes: "",
      });
      setValorInput(conta.valor.toFixed(2));
    }
  }, [conta, open, form]);

  function onSubmit(values: FormValues) {
    if (!conta) return;

    const valorOriginal = conta.valor;
    const diferenca = values.valorRecebido - valorOriginal;
    
    let observacaoAdicional = "";
    if (diferenca !== 0) {
      if (diferenca > 0) {
        observacaoAdicional = `Juros de R$ ${diferenca.toFixed(2)}`;
      } else {
        observacaoAdicional = `Desconto de R$ ${Math.abs(diferenca).toFixed(2)}`;
      }
    }

    const observacaoCompleta = [
      observacaoAdicional,
      values.observacoes
    ].filter(Boolean).join('\n');

    const contaAtualizada: ContaReceber = {
      ...conta,
      dataPagamento: values.dataRecebimento.toISOString(),
      valor: values.valorRecebido,
      formaPagamento: values.formaPagamento,
      bancoId: values.bancoId,
      status: 'recebido',
      observacoes: observacaoCompleta || conta.observacoes,
      updatedAt: new Date().toISOString(),
    };

    const contasAtualizadas = contas.map(c => 
      c.id === conta.id ? contaAtualizada : c
    );

    setContas(contasAtualizadas);
    toast.success("✓ Recebimento registrado com sucesso!");
    onOpenChange(false);
    onSave();
  }

  function handleValorChange(value: string) {
    const numericValue = value.replace(/[^\d,]/g, '').replace(',', '.');
    setValorInput(value);
    const parsed = parseFloat(numericValue);
    if (!isNaN(parsed)) {
      form.setValue('valorRecebido', parsed);
    }
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  function formatDate(dateString: string | undefined | null): string {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";
      return format(date, "dd/MM/yyyy");
    } catch {
      return "-";
    }
  }

  function isAtrasada() {
    if (!conta) return false;
    const hoje = new Date();
    const vencimento = new Date(conta.dataVencimento);
    hoje.setHours(0, 0, 0, 0);
    vencimento.setHours(0, 0, 0, 0);
    return vencimento < hoje;
  }

  const valorRecebido = form.watch('valorRecebido');
  const valorOriginal = conta?.valor || 0;
  const diferenca = valorRecebido - valorOriginal;

  if (!conta) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Recebimento</DialogTitle>
          <DialogDescription>
            Confirme os dados do recebimento
          </DialogDescription>
        </DialogHeader>

        {/* Resumo da Conta */}
        <div className={cn(
          "p-4 rounded-lg border space-y-2",
          isAtrasada() 
            ? "bg-[#FFEBEE]/30 border-[#D88B8B]" 
            : "bg-[#FAF7F5] border-[#E8E3DF]"
        )}>
          <h3 className="font-semibold text-[#6B5047]">{conta.descricao}</h3>
          {conta.clienteNome && (
            <p className="text-sm text-[#9C8B82]">Cliente: {conta.clienteNome}</p>
          )}
          <p className="text-sm text-[#9C8B82]">
            Valor: <span className="font-semibold text-[#6B5047]">{formatCurrency(conta.valor)}</span>
          </p>
          <p className="text-sm text-[#9C8B82]">
            Vencimento: {formatDate(conta.dataVencimento)}
            {isAtrasada() && (
              <span className="ml-2 text-[#C62828] font-medium">(ATRASADA)</span>
            )}
          </p>
        </div>

        <Separator />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Data do Recebimento */}
            <FormField
              control={form.control}
              name="dataRecebimento"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Recebimento *</FormLabel>
                  <FormControl>
                    <DatePickerField
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione a data..."
                    />
                  </FormControl>
                  <p className="text-xs text-[#9C8B82]">
                    Hoje: {formatDate(new Date().toISOString())}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Valor Recebido */}
            <FormField
              control={form.control}
              name="valorRecebido"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Recebido *</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
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
                      {diferenca !== 0 && (
                        <div className={cn(
                          "flex items-center gap-2 text-sm p-2 rounded",
                          diferenca > 0 
                            ? "text-[#C62828] bg-[#FFEBEE]/30" 
                            : "text-[#388E3C] bg-[#E8F5E9]/30"
                        )}>
                          {diferenca > 0 ? (
                            <>
                              <TrendingUp className="h-4 w-4" />
                              <span>Juros de {formatCurrency(diferenca)}</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-4 w-4" />
                              <span>Desconto de {formatCurrency(Math.abs(diferenca))}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </FormControl>
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
                  <FormLabel>Forma de Pagamento *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dinheiro" id="dinheiro" />
                        <Label htmlFor="dinheiro" className="font-normal cursor-pointer">
                          Dinheiro
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pix" id="pix" />
                        <Label htmlFor="pix" className="font-normal cursor-pointer">
                          Pix
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cartao_credito" id="cartao_credito" />
                        <Label htmlFor="cartao_credito" className="font-normal cursor-pointer">
                          Cartão de Crédito
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cartao_debito" id="cartao_debito" />
                        <Label htmlFor="cartao_debito" className="font-normal cursor-pointer">
                          Cartão de Débito
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="transferencia" id="transferencia" />
                        <Label htmlFor="transferencia" className="font-normal cursor-pointer">
                          Transferência Bancária
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="boleto" id="boleto" />
                        <Label htmlFor="boleto" className="font-normal cursor-pointer">
                          Boleto
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="outros" id="outros" />
                        <Label htmlFor="outros" className="font-normal cursor-pointer">
                          Outros
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Banco/Conta */}
            <FormField
              control={form.control}
              name="bancoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banco/Conta *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o banco..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background">
                      {bancosAtivos.map((banco) => (
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

            {/* Observações */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Obs do Recebimento</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais sobre este recebimento..."
                      rows={2}
                      maxLength={200}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#8BA888] hover:bg-[#7A9777]">
                Confirmar Recebimento
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
