import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, CookingPot, Copy, AlertTriangle } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
  unidadeRendimento: "gramas" | "unidades";
  ingredientes: IngredienteReceita[];
  embalagens?: EmbalagemReceita[];
  custoTotal: number;
  valorVenda?: number;
  despesasVenda?: Array<{ id: string; nome: string; percentual: number; valor: number }>;
}

export default function Receitas() {
  const navigate = useNavigate();
  const [receitas, setReceitas] = useLocalStorage<Receita[]>("receitas", []);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filtroAtivo, setFiltroAtivo] = useState<"todos" | "ativos" | "combos" | "fora">("todos");

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

  // Função para calcular CMV
  const calcularCMV = (receita: Receita) => {
    const custoInsumosEmbalagens = calcularCustoInsumosEmbalagens(receita);
    const despesasVenda = calcularDespesasVenda(receita);
    return custoInsumosEmbalagens + despesasVenda;
  };

  // Função para calcular percentual CMV
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
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingId) {
      setReceitas(receitas.filter((item) => item.id !== deletingId));
      toast.success("Receita excluída com sucesso!");
    }
    setIsDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const handleCreateNew = () => {
    navigate("/precificacao/ficha-tecnica/nova");
  };

  const handleEdit = (id: string) => {
    navigate(`/precificacao/ficha-tecnica/editar/${id}`);
  };

  const handleDuplicate = (id: string) => {
    const receitaOriginal = receitas.find(r => r.id === id);
    if (!receitaOriginal) return;

    const novaReceita: Receita = {
      ...receitaOriginal,
      id: `${Date.now()}`,
      nome: `Cópia de ${receitaOriginal.nome}`,
      ingredientes: receitaOriginal.ingredientes.map(ing => ({
        ...ing,
        id: `${Date.now()}-${Math.random()}`
      })),
      embalagens: (receitaOriginal.embalagens || []).map(emb => ({
        ...emb,
        id: `${Date.now()}-${Math.random()}`
      })),
      despesasVenda: (receitaOriginal.despesasVenda || []).map(desp => ({
        ...desp,
        id: `${Date.now()}-${Math.random()}`
      }))
    };

    setReceitas([...receitas, novaReceita]);
    toast.success("Receita duplicada com sucesso!");
    
    // Navega para edição da cópia
    navigate(`/precificacao/ficha-tecnica/editar/${novaReceita.id}`);
  };

  // Verificar alertas de CMV e Margem
  const verificarAlertas = (receita: Receita) => {
    const percentualCMV = calcularPercentualCMV(receita);
    const percentualMargem = calcularPercentualMargem(receita);
    const alertas: string[] = [];

    if (percentualCMV > 35) {
      alertas.push("CMV muito alto");
    }
    if (percentualMargem < 30) {
      alertas.push("Margem muito baixa");
    }

    return alertas;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton to="/precificacao" />
        <div className="flex-1">
          <PageHeader
            title="Ficha Técnica"
            description="Calcule Custos e Preços de Venda"
          />
        </div>
      </div>

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
                <TableHead className="text-center">% CMV</TableHead>
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
                      temAlerta && "bg-red-50/50 dark:bg-red-950/20 animate-pulse"
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
                      percentualCMV > 35 && "font-bold text-red-600 dark:text-red-400"
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
                      {temAlerta && (
                        <div className="flex flex-col gap-1">
                          {alertas.map((alerta, index) => (
                            <Badge 
                              key={index}
                              variant="outline" 
                              className="bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-400 dark:border-red-800"
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {alerta}
                            </Badge>
                          ))}
                        </div>
                      )}
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
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Excluir receita"
        description="Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
      />
    </div>
  );
}
