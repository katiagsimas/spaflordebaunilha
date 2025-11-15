import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Settings, DollarSign, Target, Calendar, AlertTriangle, Calculator, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useCustosFixos } from "@/hooks/useCustosFixos";
import { useEncomendas } from "@/hooks/useEncomendas";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const configuracaoSchema = z.object({
  metaFaturamentoMensal: z.number().min(0, "Meta deve ser maior ou igual a zero"),
  metaFaturamentoAnual: z.number().min(0, "Meta anual deve ser maior ou igual a zero"),
  margemLucroAlvo: z.number().min(20, "Margem mínima: 20%").max(200, "Margem máxima: 200%"),
  metaEncomendas: z.number().min(0, "Meta de encomendas deve ser maior ou igual a zero"),
  diasUteisPorMes: z.number().min(1, "Mínimo 1 dia").max(31, "Máximo 31 dias"),
  incluirCustosFixos: z.boolean(),
  custoFixoMensal: z.number().min(0, "Custo fixo deve ser maior ou igual a zero"),
});

type ConfiguracaoFormData = z.infer<typeof configuracaoSchema>;

interface ConfigurarMetasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConfigurarMetasModal({ open, onOpenChange }: ConfigurarMetasModalProps) {
  const navigate = useNavigate();
  const { custosFixos } = useCustosFixos();
  const { encomendas = [] } = useEncomendas();
  const { profile, updateProfile } = useUserProfile();
  
  const config = {
    metaFaturamentoMensal: profile?.meta_faturamento_mensal || 10000,
    metaFaturamentoAnual: profile?.meta_faturamento_anual || 120000,
    margemLucroAlvo: 60,
    metaEncomendas: 30,
    diasUteisPorMes: 22,
    incluirCustosFixos: true,
    custoFixoMensal: profile?.custo_fixo_mensal || 2000,
  };

  // Mapear encomendas para formato esperado
  const orders = encomendas.map(e => ({
    id: e.id,
    total: Number(e.valor),
    status: e.status === 'entregue' ? 'Entregue' : 'Pendente',
    deliveryDate: e.data_entrega || '',
  }));

  // Calcular sugestões baseadas no histórico
  const calcularSugestaoFaturamento = () => {
    const hoje = new Date();
    const ultimosTresMeses = [];

    for (let i = 1; i <= 3; i++) {
      const mes = hoje.getMonth() - i;
      const ano = hoje.getFullYear();
      
      const faturamento = orders
        .filter(order => {
          if (order.status !== "Entregue") return false;
          const deliveryDate = new Date(order.deliveryDate);
          return deliveryDate.getMonth() === mes && deliveryDate.getFullYear() === ano;
        })
        .reduce((acc, o) => acc + o.total, 0);

      ultimosTresMeses.push(faturamento);
    }

    const media = ultimosTresMeses.reduce((a, b) => a + b, 0) / 3;
    return Math.round(media * 1.1); // 10% de crescimento
  };

  const calcularMediaEncomendas = () => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    
    const encomendasMesAtual = orders.filter(order => {
      const deliveryDate = new Date(order.deliveryDate);
      return deliveryDate.getMonth() === mesAtual;
    }).length;

    return encomendasMesAtual;
  };

  const totalCustosFixos = custosFixos.reduce((acc, c) => acc + c.valor, 0);
  const sugestaoFaturamento = calcularSugestaoFaturamento();
  const mediaEncomendas = calcularMediaEncomendas();

  const form = useForm<ConfiguracaoFormData>({
    resolver: zodResolver(configuracaoSchema),
    defaultValues: config,
  });

  const margemLucroAtual = form.watch("margemLucroAlvo");

  const onSubmit = (data: ConfiguracaoFormData) => {
    try {
      updateProfile({
        meta_faturamento_mensal: data.metaFaturamentoMensal,
        meta_faturamento_anual: data.metaFaturamentoAnual,
        custo_fixo_mensal: data.custoFixoMensal,
      });

      toast.success("✓ Configurações salvas com sucesso!");
      onOpenChange(false);
      
      // Recarregar a página para atualizar os cards
      window.location.reload();
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-6 w-6 text-primary" />
            Configurações de Planejamento
          </DialogTitle>
          <DialogDescription>
            Defina suas metas e objetivos para o negócio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
          {/* Meta de Faturamento Mensal */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <Label htmlFor="metaFaturamentoMensal" className="text-base font-semibold">
                Meta de Faturamento Mensal
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Quanto você deseja faturar por mês?
            </p>
            <Input
              id="metaFaturamentoMensal"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...form.register("metaFaturamentoMensal", { valueAsNumber: true })}
              className="text-lg"
            />
            {sugestaoFaturamento > 0 && (
              <p className="text-sm text-muted-foreground">
                💡 Sugestão: R$ {sugestaoFaturamento.toFixed(2)} (baseado no seu histórico)
              </p>
            )}
            {form.formState.errors.metaFaturamentoMensal && (
              <p className="text-sm text-error">{form.formState.errors.metaFaturamentoMensal.message}</p>
            )}
          </div>

          {/* Meta de Faturamento Anual */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <Label htmlFor="metaFaturamentoAnual" className="text-base font-semibold">
                Meta de Faturamento Anual
              </Label>
            </div>
            <Input
              id="metaFaturamentoAnual"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...form.register("metaFaturamentoAnual", { valueAsNumber: true })}
              className="text-lg"
            />
            {form.formState.errors.metaFaturamentoAnual && (
              <p className="text-sm text-error">{form.formState.errors.metaFaturamentoAnual.message}</p>
            )}
          </div>

          {/* Margem de Lucro Alvo */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <Label htmlFor="margemLucroAlvo" className="text-base font-semibold">
                Margem de Lucro Alvo
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Qual margem ideal para seus produtos?
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">20%</span>
                <span className="text-2xl font-bold text-primary">{margemLucroAtual}%</span>
                <span className="text-sm text-muted-foreground">200%</span>
              </div>
              <Slider
                value={[margemLucroAtual]}
                onValueChange={(value) => form.setValue("margemLucroAlvo", value[0])}
                min={20}
                max={200}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground text-center">
                Padrão para confeitaria: 50-70%
              </p>
            </div>
            {form.formState.errors.margemLucroAlvo && (
              <p className="text-sm text-error">{form.formState.errors.margemLucroAlvo.message}</p>
            )}
          </div>

          {/* Meta de Encomendas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <Label htmlFor="metaEncomendas" className="text-base font-semibold">
                Meta de Encomendas por Mês
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Quantos pedidos quer fazer por mês?
            </p>
            <Input
              id="metaEncomendas"
              type="number"
              placeholder="0"
              {...form.register("metaEncomendas", { valueAsNumber: true })}
            />
            {mediaEncomendas > 0 && (
              <p className="text-sm text-muted-foreground">
                Média atual: {mediaEncomendas} pedidos/mês
              </p>
            )}
            {form.formState.errors.metaEncomendas && (
              <p className="text-sm text-error">{form.formState.errors.metaEncomendas.message}</p>
            )}
          </div>

          {/* Dias Úteis por Mês */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <Label htmlFor="diasUteisPorMes" className="text-base font-semibold">
                Dias Úteis por Mês
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Em quantos dias você trabalha?
            </p>
            <Input
              id="diasUteisPorMes"
              type="number"
              placeholder="22"
              {...form.register("diasUteisPorMes", { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">
              Padrão: 22 dias (seg-sex). Usado para calcular médias diárias.
            </p>
            {form.formState.errors.diasUteisPorMes && (
              <p className="text-sm text-error">{form.formState.errors.diasUteisPorMes.message}</p>
            )}
          </div>

          {/* Custos Fixos */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">
                Custos Fixos
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="incluirCustosFixos"
                checked={form.watch("incluirCustosFixos")}
                onCheckedChange={(checked) => 
                  form.setValue("incluirCustosFixos", checked as boolean)
                }
              />
              <label
                htmlFor="incluirCustosFixos"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Incluir custos fixos no CMV
              </label>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-muted-foreground">
                Total de custos fixos:
              </span>
              <span className="text-lg font-bold">
                R$ {totalCustosFixos.toFixed(2)}
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate("/cadastros/custos-fixos")}
              className="w-full"
            >
              Gerenciar custos fixos
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary">
              Salvar Metas
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
