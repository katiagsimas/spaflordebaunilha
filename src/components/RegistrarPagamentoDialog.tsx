import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, DollarSign, Building2 } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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
  formaPagamento: z.string().min(1, "Selecione a forma de pagamento"),
  bancoId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function RegistrarPagamentoDialog({ open, onOpenChange, conta, onSave, tipo = 'receber' }: RegistrarPagamentoDialogProps) {
  const [bancos] = useLocalStorage<Banco[]>("bancos", []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dataPagamento: new Date(),
      formaPagamento: "",
      bancoId: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        dataPagamento: new Date(),
        formaPagamento: "",
        bancoId: "",
      });
    }
  }, [open, form]);

  const onSubmit = (data: FormValues) => {
    if (!conta) return;

    const contaAtualizada = {
      ...conta,
      status: 'pago',
      dataPagamento: data.dataPagamento.toISOString(),
      formaPagamento: data.formaPagamento,
      bancoId: data.bancoId || undefined,
      updatedAt: new Date().toISOString(),
    };

    onSave(contaAtualizada);
  };

  const formasPagamento = [
    { value: 'dinheiro', label: 'Dinheiro' },
    { value: 'pix', label: 'Pix' },
    { value: 'cartao_credito', label: 'Cartão de Crédito' },
    { value: 'cartao_debito', label: 'Cartão de Débito' },
    { value: 'transferencia', label: 'Transferência' },
    { value: 'boleto', label: 'Boleto' },
    { value: 'outros', label: 'Outros' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#6B5047]">
            {tipo === 'pagar' ? 'Registrar Pagamento' : 'Registrar Recebimento'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Data do Pagamento */}
            <FormField
              control={form.control}
              name="dataPagamento"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-[#6B5047]">
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
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Forma de Pagamento */}
            <FormField
              control={form.control}
              name="formaPagamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#6B5047]">Forma de {tipo === 'pagar' ? 'Pagamento' : 'Recebimento'} *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {formasPagamento.map((forma) => (
                        <SelectItem key={forma.value} value={forma.value}>
                          {forma.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <FormLabel className="text-[#6B5047]">Banco (opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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

            {/* Resumo */}
            {conta && (
              <div className="p-4 bg-[#FAF7F5] rounded-lg border border-[#E8E3DF]">
                <p className="text-sm text-[#9C8B82] mb-2">Valor:</p>
                <p className="text-2xl font-bold text-[#6B5047]">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(conta.valor)}
                </p>
              </div>
            )}

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
                Confirmar {tipo === 'pagar' ? 'Pagamento' : 'Recebimento'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
