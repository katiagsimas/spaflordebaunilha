import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { ItemComEstoque } from "@/types/estoque";

interface AtualizarEstoqueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItemComEstoque | null;
  onSuccess: () => void;
}

export function AtualizarEstoqueDialog({ 
  open, 
  onOpenChange, 
  item,
  onSuccess 
}: AtualizarEstoqueDialogProps) {
  const [tipoMovimento, setTipoMovimento] = useState<"entrada" | "saida" | "ajuste">("entrada");
  const [dataMovimentacao, setDataMovimentacao] = useState<Date>(new Date());
  const [dataMovimentacaoInput, setDataMovimentacaoInput] = useState(format(new Date(), "dd/MM/yyyy"));
  const [quantidade, setQuantidade] = useState("");
  const [valor, setValor] = useState("");
  const [dataValidade, setDataValidade] = useState<Date | undefined>();
  const [dataValidadeInput, setDataValidadeInput] = useState("");
  const [observacao, setObservacao] = useState("");
  const [observacaoAberta, setObservacaoAberta] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverMovimentacaoOpen, setPopoverMovimentacaoOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    if (!quantidade || parseFloat(quantidade) <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "Informe uma quantidade válida maior que zero.",
        variant: "destructive",
      });
      return;
    }

    // Validar quantidade disponível para saída
    if (tipoMovimento === "saida") {
      const saldoAtual = (item as any).estoque?.saldo || 0;
      if (parseFloat(quantidade) > saldoAtual) {
        toast({
          title: "Quantidade indisponível",
          description: `Você tem apenas ${saldoAtual} ${item.unidade_base} disponíveis`,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const qtd = parseFloat(quantidade);
      const valorNum = valor ? parseFloat(valor) : null;
      const custoUnitario = valorNum && qtd > 0 ? valorNum / qtd : null;

      // Determinar o tipo correto baseado no movimento
      let tipoMovimentacao: 'ENTRADA' | 'SAIDA' | 'AJUSTE' = 'ENTRADA';
      if (tipoMovimento === 'saida') tipoMovimentacao = 'SAIDA';
      if (tipoMovimento === 'ajuste') tipoMovimentacao = 'AJUSTE';

      // Converter tipo do item para o enum correto
      let tipoItemEnum: 'INSUMO' | 'EMBALAGEM' | 'outros' = 'outros';
      if (item.tipo === 'ingrediente') tipoItemEnum = 'INSUMO';
      else if (item.tipo === 'embalagem') tipoItemEnum = 'EMBALAGEM';

      // Inserir movimentação
      const { error } = await supabase
        .from('movimentacoes_estoque')
        .insert([{
          item_id: item.id,
          tipo: tipoMovimentacao,
          quantidade: qtd,
          custo_unitario: custoUnitario,
          custo_total: valorNum,
          data: format(dataMovimentacao, 'yyyy-MM-dd'),
          observacoes: observacao || null,
          usuario_id: user.id,
          tipo_item: tipoItemEnum,
          unidade: item.unidade_base,
        }]);

      if (error) throw error;

      toast({
        title: "Estoque atualizado",
        description: `${tipoMovimento === "entrada" ? "Entrada" : tipoMovimento === "saida" ? "Saída" : "Ajuste"} de ${quantidade} ${item.unidade_base} registrado com sucesso.`,
      });
      
      onSuccess();
      onOpenChange(false);
      setDataMovimentacao(new Date());
      setDataMovimentacaoInput(format(new Date(), "dd/MM/yyyy"));
      setQuantidade("");
      setValor("");
      setDataValidade(undefined);
      setDataValidadeInput("");
      setObservacao("");
      setObservacaoAberta(false);
    } catch (error) {
      toast({
        title: "Erro ao atualizar estoque",
        description: "Ocorreu um erro ao processar a movimentação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDataMovimentacaoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    let formatted = value;
    
    if (value.length >= 2) {
      formatted = value.slice(0, 2) + "/" + value.slice(2);
    }
    if (value.length >= 4) {
      formatted = value.slice(0, 2) + "/" + value.slice(2, 4) + "/" + value.slice(4, 8);
    }
    
    setDataMovimentacaoInput(formatted);
    
    if (value.length === 8) {
      try {
        const parsedDate = parse(formatted, "dd/MM/yyyy", new Date());
        if (!isNaN(parsedDate.getTime())) {
          setDataMovimentacao(parsedDate);
        }
      } catch (error) {
        // Invalid date format
      }
    }
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    let formatted = value;
    
    if (value.length >= 2) {
      formatted = value.slice(0, 2) + "/" + value.slice(2);
    }
    if (value.length >= 4) {
      formatted = value.slice(0, 2) + "/" + value.slice(2, 4) + "/" + value.slice(4, 8);
    }
    
    setDataValidadeInput(formatted);
    
    if (value.length === 8) {
      try {
        const parsedDate = parse(formatted, "dd/MM/yyyy", new Date());
        if (!isNaN(parsedDate.getTime())) {
          setDataValidade(parsedDate);
        }
      } catch (error) {
        // Invalid date format
      }
    }
  };

  const handleDataMovimentacaoSelect = (date: Date | undefined) => {
    if (date) {
      setDataMovimentacao(date);
      setDataMovimentacaoInput(format(date, "dd/MM/yyyy"));
    }
    setPopoverMovimentacaoOpen(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setDataValidade(date);
    if (date) {
      setDataValidadeInput(format(date, "dd/MM/yyyy"));
    } else {
      setDataValidadeInput("");
    }
    setPopoverOpen(false);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Atualizar Estoque - {item.nome}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Estoque Atual</Label>
            <Input 
              value={`${item.estoque?.saldo || 0} ${item.unidade_base}`} 
              disabled 
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label>Data de Movimentação</Label>
            <Popover open={popoverMovimentacaoOpen} onOpenChange={setPopoverMovimentacaoOpen}>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="DD/MM/AAAA"
                    value={dataMovimentacaoInput}
                    onChange={handleDataMovimentacaoInputChange}
                    maxLength={10}
                    className="pr-10"
                    required
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataMovimentacao}
                  onSelect={handleDataMovimentacaoSelect}
                  initialFocus
                  className="pointer-events-auto p-2"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Tipo de Movimentação</Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTipoMovimento("entrada")}
                className={cn(
                  "flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 font-semibold",
                  tipoMovimento === "entrada"
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_2px_4px_rgba(216,155,140,0.3)]"
                    : "border-border bg-background hover:bg-secondary"
                )}
              >
                <Checkbox 
                  checked={tipoMovimento === "entrada"} 
                  className="pointer-events-none"
                />
                <span>Entrada</span>
              </button>

              <button
                type="button"
                onClick={() => setTipoMovimento("saida")}
                className={cn(
                  "flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 font-semibold",
                  tipoMovimento === "saida"
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_2px_4px_rgba(216,155,140,0.3)]"
                    : "border-border bg-background hover:bg-secondary"
                )}
              >
                <Checkbox 
                  checked={tipoMovimento === "saida"} 
                  className="pointer-events-none"
                />
                <span>Saída</span>
              </button>

              <button
                type="button"
                onClick={() => setTipoMovimento("ajuste")}
                className={cn(
                  "flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 font-semibold",
                  tipoMovimento === "ajuste"
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_2px_4px_rgba(216,155,140,0.3)]"
                    : "border-border bg-background hover:bg-secondary"
                )}
              >
                <Checkbox 
                  checked={tipoMovimento === "ajuste"} 
                  className="pointer-events-none"
                />
                <span>Ajuste</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade</Label>
              <div className="flex gap-2">
                <Input
                  id="quantidade"
                  type="number"
                  step="0.01"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  placeholder="0.00"
                  required
                  className="flex-1"
                />
                <Input 
                  value={item.unidade_base} 
                  disabled 
                  className="w-20 bg-muted"
                />
              </div>
            </div>

            {tipoMovimento !== "saida" && (
              <div className="space-y-2">
                <Label htmlFor="valor">Valor</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="R$ 0,00"
                />
              </div>
            )}
          </div>

          {tipoMovimento !== "saida" && (
            <div className="space-y-2">
              <Label>Data de Validade (opcional)</Label>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="DD/MM/AAAA"
                      value={dataValidadeInput}
                      onChange={handleDateInputChange}
                      maxLength={10}
                      className="pr-10"
                    />
                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataValidade}
                    onSelect={handleDateSelect}
                    initialFocus
                    className="pointer-events-auto p-2"
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-3",
                      caption: "flex justify-center pt-1 relative items-center px-1",
                      caption_label: "text-sm font-medium",
                      nav: "space-x-1 flex items-center",
                      nav_button: cn(
                        "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100"
                      ),
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
                      row: "flex w-full mt-1",
                      cell: cn(
                        "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
                        "h-8 w-8"
                      ),
                      day: cn(
                        "h-8 w-8 p-0 font-normal aria-selected:opacity-100"
                      ),
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      day_today: "bg-accent text-accent-foreground",
                      day_outside: "text-muted-foreground opacity-50",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      day_hidden: "invisible",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <Collapsible open={observacaoAberta} onOpenChange={setObservacaoAberta}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-between p-2 h-auto"
              >
                <span className="text-sm font-medium">Observação (opcional)</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    observacaoAberta && "transform rotate-180"
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <Textarea
                id="observacao"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Motivo da movimentação..."
                rows={3}
              />
            </CollapsibleContent>
          </Collapsible>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
