import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calculator } from "lucide-react";

export default function MaoDeObra() {
  const { profile, loading: profileLoading } = useUserProfile();
  const [valorHora, setValorHora] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.valor_hora) {
      setValorHora(profile.valor_hora.toFixed(2));
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile?.id) {
      toast.error("Perfil não encontrado");
      return;
    }

    const valor = parseFloat(valorHora);
    
    if (isNaN(valor) || valor < 0) {
      toast.error("Valor inválido");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ valor_hora: valor })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("Valor de mão de obra salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar valor de mão de obra:", error);
      toast.error("Erro ao salvar valor de mão de obra");
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Valores de Mão de Obra"
        description="Configure o valor/hora para cálculo automático nas receitas"
        backButton={<BackButton to="/configuracoes/precificacao" />}
      />
      
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        {/* Card Informativo */}
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-base">Como funciona?</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure aqui o valor/hora da mão de obra. Este valor será usado automaticamente 
              nas fichas técnicas, multiplicando pelo tempo de preparo de cada receita para calcular 
              o custo de mão de obra.
            </p>
          </CardContent>
        </Card>

        {/* Card Principal */}
        <Card>
          <CardHeader>
            <CardTitle>Configuração do Valor/Hora</CardTitle>
            <CardDescription>
              Defina o valor da hora de trabalho para cálculo nas receitas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="valor-hora">Valor por Hora (R$)</Label>
              <Input
                id="valor-hora"
                type="number"
                min="0"
                step="0.01"
                value={valorHora}
                onChange={(e) => setValorHora(e.target.value)}
                placeholder="0.00"
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">
                Este valor será multiplicado pelo tempo de preparo de cada receita
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Configuração"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card com Exemplo */}
        {valorHora && parseFloat(valorHora) > 0 && (
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
            <CardHeader>
              <CardTitle className="text-base">Exemplo de Cálculo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Valor/Hora:</span> R$ {parseFloat(valorHora).toFixed(2)}
                </p>
                <p>
                  <span className="font-medium">Receita com 2 horas de preparo:</span> R$ {(parseFloat(valorHora) * 2).toFixed(2)}
                </p>
                <p>
                  <span className="font-medium">Receita com 30 minutos (0,5h):</span> R$ {(parseFloat(valorHora) * 0.5).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
