import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, CookingPot } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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

  // Ordenar receitas alfabeticamente
  const receitasOrdenadas = [...receitas].sort((a, b) => 
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
    navigate("/receitas/nova");
  };

  const handleEdit = (id: string) => {
    navigate(`/receitas/editar/${id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="FT - Fichas Técnicas"
        description="Calcule Custos e Preços de Venda"
      />

      <div className="flex justify-end">
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Criar nova receita
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
                <TableHead>Nome da Receita</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor de Venda</TableHead>
                <TableHead className="text-right">Custo Insumos + Embalagens</TableHead>
                <TableHead className="text-right">% CMV</TableHead>
                <TableHead className="text-right">Margem R$</TableHead>
                <TableHead className="text-right">Margem %</TableHead>
                <TableHead className="text-right">Custos c/ Vendas</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
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

                return (
                  <TableRow key={receita.id}>
                    <TableCell className="font-medium">{receita.nome}</TableCell>
                    <TableCell>{receita.categoria || "-"}</TableCell>
                    <TableCell className="text-right">
                      R$ {(receita.valorVenda || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {custoInsumosEmbalagens.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {percentualCMV.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {margemContribuicao.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {percentualMargem.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {despesasVenda.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      R$ {lucro.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(receita.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(receita.id)}
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
