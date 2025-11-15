import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, CookingPot, Copy, AlertTriangle } from "lucide-react";
import { useReceitas } from "@/hooks/useReceitas";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Ingrediente {
  id: string;
  nome: string;
  marca: string;
  quantidade: number;
  unidadeMedida: string;
  preco: number;
  dataAtualizacao: string;
}

interface IngredienteReceita {
  id: string;
  ingredienteId: string;
  ingrediente: string;
  marca: string;
  qtdeEmbalagem: number;
  unidadeMedida: string;
  precoEmbalagem: number;
  quantidadeUtilizada: number;
  custoUnitario: number;
  custoReceita: number;
}

interface EmbalagemReceita {
  id: string;
  embalagemId: string;
  embalagem: string;
  marca: string;
  qtdeEmbalagem: number;
  unidadeMedida: string;
  precoEmbalagem: number;
  quantidadeUtilizada: number;
  custoUnitario: number;
  custoReceita: number;
}

interface Receita {
  id: string;
  nome: string;
  categoria?: string;
  tipo?: "produto_avulso" | "produto_combo";
  cardapio?: "ativo" | "fora";
  tempoPreparo: number;
  unidadeTempo: "minutos" | "horas";
  rendimento: number;
  unidadeRendimento: string;
  ingredientes: IngredienteReceita[];
  embalagens?: EmbalagemReceita[];
  custoTotal: number;
  valorVenda?: number;
  despesasVenda?: Array<{ id: string; nome: string; percentual: number; valor: number }>;
}

export default function Receitas() {
  const navigate = useNavigate();
  const { todasReceitas: receitas, isLoading, refetch } = useReceitas();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [receitaParaDeletar, setReceitaParaDeletar] = useState<string | null>(null);
  const [filtroAtivo, setFiltroAtivo] = useState<"todos" | "ativos" | "combos" | "fora">("todos");

  // Recarregar dados ao montar o componente
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Filtrar receitas de acordo com o filtro ativo
  const receitasFiltradas = receitas.filter((receita) => {
    if (filtroAtivo === "todos") return true;
    if (filtroAtivo === "ativos") return receita.cardapio === "ativo";
    if (filtroAtivo === "combos") return receita.tipo === "produto_combo";
    if (filtroAtivo === "fora") return receita.cardapio === "fora";
    return true;
  });

  // Ordenar receitas alfabeticamente
  const receitasOrdenadas = [...receitasFiltradas].sort((a, b) => 
    a.nome.localeCompare(b.nome, 'pt-BR')
  );

  // Função para calcular custos de insumos e embalagens
  const calcularCustoInsumosEmbalagens = (receita: Receita) => {
    const custoIngredientes = receita.ingredientes.reduce((total, ing) => total + ing.custoReceita, 0);
    const custoEmbalagens = (receita.embalagens || []).reduce((total, emb) => total + emb.custoReceita, 0);
    return custoIngredientes + custoEmbalagens;
  };

  // Função para calcular total de despesas de venda
  const calcularDespesasVenda = (receita: Receita) => {
    return (receita.despesasVenda || []).reduce((acc, despesa) => acc + despesa.valor, 0);
  };

  // Função para calcular CMV Real (igual ao formulário)
  const calcularCMV = (receita: Receita) => {
    // CMV = Custo Total (já inclui ingredientes + embalagens + custos fixos + outros gastos) + Despesas de Venda
    const custoTotal = receita.custoTotal || 0;
    const despesasVenda = calcularDespesasVenda(receita);
    return custoTotal + despesasVenda;
  };

  // Função para calcular percentual CMV Real
  const calcularPercentualCMV = (receita: Receita) => {
    const valorVenda = receita.valorVenda || 0;
    if (valorVenda === 0) return 0;
    const cmv = calcularCMV(receita);
    return (cmv / valorVenda) * 100;
  };

  // Função para calcular margem de contribuição
  const calcularMargemContribuicao = (receita: Receita) => {
    const valorVenda = receita.valorVenda || 0;
    const cmv = calcularCMV(receita);
    return valorVenda - cmv;
  };

  // Função para calcular percentual de margem
  const calcularPercentualMargem = (receita: Receita) => {
    const valorVenda = receita.valorVenda || 0;
    if (valorVenda === 0) return 0;
    const margem = calcularMargemContribuicao(receita);
    return (margem / valorVenda) * 100;
  };

  // Função para calcular lucro (Valor de Venda - Custo Total)
  const calcularLucro = (receita: Receita) => {
    const valorVenda = receita.valorVenda || 0;
    return valorVenda - receita.custoTotal;
  };

  const handleDelete = (id: string) => {
    setReceitaParaDeletar(id);
    setDialogAberto(true);
  };

  const confirmDelete = async () => {
    if (receitaParaDeletar) {
      try {
        const { error } = await supabase
          .from('receitas')
          .delete()
          .eq('id', receitaParaDeletar);

        if (error) throw error;
        
        toast.success("Receita excluída com sucesso!");
        refetch();
      } catch (error) {
        console.error('Erro ao deletar receita:', error);
        toast.error('Erro ao excluir receita');
      }
    }
    setDialogAberto(false);
    setReceitaParaDeletar(null);
  };

  const handleCreateNew = () => {
    navigate("/precificacao/ficha-tecnica/nova");
  };

  const handleEdit = (id: string) => {
    navigate(`/precificacao/ficha-tecnica/editar/${id}`);
  };

  const handleDuplicate = async (id: string) => {
    const receitaOriginal = receitas.find(r => r.id === id);
    if (!receitaOriginal) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Criar nova receita no banco
      const { data: novaReceita, error: receitaError } = await supabase
        .from('receitas')
        .insert({
          usuario_id: user.id,
          nome: `Cópia de ${receitaOriginal.nome}`,
          categoria: receitaOriginal.categoria || null,
          tipo: receitaOriginal.tipo,
          cardapio: receitaOriginal.cardapio,
          tempo_preparo: receitaOriginal.tempoPreparo,
          unidade_tempo: receitaOriginal.unidadeTempo,
          rendimento: receitaOriginal.rendimento,
          unidade_rendimento: receitaOriginal.unidadeRendimento,
          custo_total: receitaOriginal.custoTotal,
          valor_venda: receitaOriginal.valorVenda || null,
          modo_preparo: null,
        })
        .select()
        .single();

      if (receitaError) throw receitaError;
      if (!novaReceita) throw new Error('Erro ao duplicar receita');

      // Duplicar ingredientes
      if (receitaOriginal.ingredientes.length > 0) {
        const ingredientesData = receitaOriginal.ingredientes.map(ing => ({
          receita_id: novaReceita.id,
          ingrediente_id: ing.ingredienteId,
          ingrediente: ing.ingrediente,
          marca: ing.marca || null,
          qtde_embalagem: ing.qtdeEmbalagem,
          unidade_medida: ing.unidadeMedida,
          preco_embalagem: ing.precoEmbalagem,
          quantidade_utilizada: ing.quantidadeUtilizada,
          custo_unitario: ing.custoUnitario,
          custo_receita: ing.custoReceita,
        }));

        await supabase.from('receitas_ingredientes').insert(ingredientesData);
      }

      // Duplicar embalagens
      if (receitaOriginal.embalagens && receitaOriginal.embalagens.length > 0) {
        const embalagensData = receitaOriginal.embalagens.map(emb => ({
          receita_id: novaReceita.id,
          embalagem_id: emb.embalagemId,
          embalagem: emb.embalagem,
          marca: emb.marca || null,
          qtde_embalagem: emb.qtdeEmbalagem,
          unidade_medida: emb.unidadeMedida,
          preco_embalagem: emb.precoEmbalagem,
          quantidade_utilizada: emb.quantidadeUtilizada,
          custo_unitario: emb.custoUnitario,
          custo_receita: emb.custoReceita,
        }));

        await supabase.from('receitas_embalagens').insert(embalagensData);
      }

      // Duplicar despesas de venda
      if (receitaOriginal.despesasVenda && receitaOriginal.despesasVenda.length > 0) {
        const despesasData = receitaOriginal.despesasVenda.map(desp => ({
          receita_id: novaReceita.id,
          despesa_id: desp.id,
          nome: desp.nome,
          percentual: desp.percentual,
          valor: desp.valor,
        }));

        await supabase.from('receitas_despesas_venda').insert(despesasData);
      }

      toast.success("Receita duplicada com sucesso!");
      refetch();
      
      // Navega para edição da cópia
      navigate(`/precificacao/ficha-tecnica/editar/${novaReceita.id}`);
    } catch (error: any) {
      console.error('Erro ao duplicar receita:', error);
      toast.error('Erro ao duplicar receita');
    }
  };

  // Verificar alertas de CMV e Margem com informações detalhadas
  const verificarAlertas = (receita: Receita) => {
    const percentualCMV = calcularPercentualCMV(receita);
    const percentualMargem = calcularPercentualMargem(receita);
    
    const alertas: Array<{
      texto: string;
      percentual: number;
      tipo: 'cmv' | 'margem';
      cor: string;
    }> = [];

    // Alerta de CMV (seguindo mesma lógica da ficha técnica)
    if (percentualCMV > 45) {
      alertas.push({
        texto: "CMV Crítico",
        percentual: percentualCMV,
        tipo: 'cmv',
        cor: "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-400 dark:border-red-800"
      });
    } else if (percentualCMV > 35) {
      alertas.push({
        texto: "CMV Atenção",
        percentual: percentualCMV,
        tipo: 'cmv',
        cor: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800"
      });
    } else if (percentualCMV > 25) {
      alertas.push({
        texto: "CMV Bom",
        percentual: percentualCMV,
        tipo: 'cmv',
        cor: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800"
      });
    } else {
      alertas.push({
        texto: "CMV Excelente",
        percentual: percentualCMV,
        tipo: 'cmv',
        cor: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
      });
    }

    // Alerta de Margem
    if (percentualMargem < 30) {
      alertas.push({
        texto: "Margem muito baixa",
        percentual: percentualMargem,
        tipo: 'margem',
        cor: "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-400 dark:border-red-800"
      });
    }

    return alertas;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ficha Técnica"
        description="Calcule Custos e Preços de Venda"
        backButton={<BackButton to="/precificacao" />}
      />

      <div className="flex justify-center">
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Criar nova receita
        </Button>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Button 
          onClick={() => setFiltroAtivo("todos")}
          variant={filtroAtivo === "todos" ? "secondary" : "outline"}
        >
          Todos
        </Button>
        <Button 
          onClick={() => setFiltroAtivo("ativos")}
          variant={filtroAtivo === "ativos" ? "secondary" : "outline"}
        >
          Ativos no Cardápio
        </Button>
        <Button 
          onClick={() => setFiltroAtivo("combos")}
          variant={filtroAtivo === "combos" ? "secondary" : "outline"}
        >
          Produtos para Combos
        </Button>
        <Button 
          onClick={() => setFiltroAtivo("fora")}
          variant={filtroAtivo === "fora" ? "secondary" : "outline"}
        >
          Produtos Fora do Cardápio
        </Button>
      </div>

      {receitas.length === 0 ? (
        <EmptyState
          icon={CookingPot}
          title="Nenhuma receita cadastrada"
          description="Comece criando sua primeira receita"
          actionLabel="Criar nova receita"
          onAction={handleCreateNew}
        />
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center w-[250px]">Nome da Receita</TableHead>
                <TableHead className="text-center">Categoria</TableHead>
                <TableHead className="text-center">Venda</TableHead>
                <TableHead className="text-center">Valor de Venda</TableHead>
                <TableHead className="text-center">Custos de Produção</TableHead>
                <TableHead className="text-center">% CMV Real</TableHead>
                <TableHead className="text-center">Margem R$</TableHead>
                <TableHead className="text-center">Margem %</TableHead>
                <TableHead className="text-center">Custos c/ Vendas</TableHead>
                <TableHead className="text-center">Lucro</TableHead>
                <TableHead className="text-center">Alertas</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receitasOrdenadas.map((receita) => {
                const custoInsumosEmbalagens = calcularCustoInsumosEmbalagens(receita);
                const percentualCMV = calcularPercentualCMV(receita);
                const margemContribuicao = calcularMargemContribuicao(receita);
                const percentualMargem = calcularPercentualMargem(receita);
                const despesasVenda = calcularDespesasVenda(receita);
                const lucro = calcularLucro(receita);
                const alertas = verificarAlertas(receita);
                const temAlerta = alertas.length > 0;

                return (
                  <TableRow 
                    key={receita.id}
                    className={cn(
                      temAlerta && "bg-red-50/50 dark:bg-red-950/20"
                    )}
                  >
                    <TableCell className={cn(
                      "font-medium",
                      temAlerta && "text-red-700 dark:text-red-400 font-semibold"
                    )}>
                      {receita.nome}
                    </TableCell>
                    <TableCell className={cn(
                      "text-center",
                      temAlerta && "text-red-700 dark:text-red-400"
                    )}>
                      {receita.categoria || "-"}
                    </TableCell>
                    <TableCell className={cn(
                      "text-center",
                      temAlerta && "text-red-700 dark:text-red-400"
                    )}>
                      {receita.cardapio === "ativo" ? "Ativo" : "Fora"}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right",
                      temAlerta && "text-red-700 dark:text-red-400"
                    )}>
                      R$ {(receita.valorVenda || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right",
                      temAlerta && "text-red-700 dark:text-red-400"
                    )}>
                      R$ {custoInsumosEmbalagens.toFixed(2)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right",
                      percentualCMV > 45 && "font-bold text-red-600 dark:text-red-400"
                    )}>
                      {percentualCMV.toFixed(1)}%
                    </TableCell>
                    <TableCell className={cn(
                      "text-right",
                      temAlerta && "text-red-700 dark:text-red-400"
                    )}>
                      R$ {margemContribuicao.toFixed(2)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right",
                      percentualMargem < 30 && "font-bold text-red-600 dark:text-red-400"
                    )}>
                      {percentualMargem.toFixed(1)}%
                    </TableCell>
                    <TableCell className={cn(
                      "text-right",
                      temAlerta && "text-red-700 dark:text-red-400"
                    )}>
                      R$ {despesasVenda.toFixed(2)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-semibold",
                      temAlerta && "text-red-700 dark:text-red-400"
                    )}>
                      R$ {lucro.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col gap-1">
                        {alertas.map((alerta, index) => (
                          <Badge 
                            key={index}
                            variant="outline" 
                            className={alerta.cor}
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {alerta.texto}: {alerta.percentual.toFixed(1)}%
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                     <TableCell>
                       <div className="flex gap-0 justify-center">
                         <Button
                           variant="ghost"
                           size="sm"
                           className="h-8 w-8 p-0"
                           onClick={() => handleEdit(receita.id)}
                           title="Editar"
                         >
                           <Pencil className="h-4 w-4" />
                         </Button>
                         <Button
                           variant="ghost"
                           size="sm"
                           className="h-8 w-8 p-0"
                           onClick={() => handleDuplicate(receita.id)}
                           title="Duplicar"
                         >
                           <Copy className="h-4 w-4" />
                         </Button>
                         <Button
                           variant="ghost"
                           size="sm"
                           className="h-8 w-8 p-0"
                           onClick={() => handleDelete(receita.id)}
                           title="Excluir"
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                     </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        onConfirm={confirmDelete}
        title="Excluir receita"
        description="Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
      />
    </div>
  );
}
