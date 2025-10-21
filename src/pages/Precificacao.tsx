import { PageHeader } from "@/components/PageHeader";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ChefHat, CookingPot, DollarSign, Pencil, Package, AlertTriangle } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useUnidadesMedida } from "@/hooks/useUnidadesMedida";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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

const opcoes = [
  {
    title: "Custos Fixos",
    description: "Despesas mensais fixas",
    icon: DollarSign,
    url: "/precificacao/custos-fixos",
    color: "text-red-600 bg-red-50 dark:bg-red-950",
  },
  {
    title: "Ingredientes",
    description: "Ingredientes com marca e preço",
    icon: ChefHat,
    url: "/precificacao/ingredientes",
    color: "text-green-600 bg-green-50 dark:bg-green-950",
  },
  {
    title: "Embalagens",
    description: "Embalagens com marca e preço",
    icon: Package,
    url: "/precificacao/embalagens",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950",
  },
  {
    title: "Pré-Preparos",
    description: "Preparos intermediários para receitas",
    icon: ChefHat,
    url: "/precificacao/pre-preparos",
    color: "text-purple-600 bg-purple-50 dark:bg-purple-950",
  },
  {
    title: "Ficha Técnica",
    description: "Calcule Custos e Preços de Venda",
    icon: CookingPot,
    url: "/precificacao/ficha-tecnica",
    color: "text-orange-600 bg-orange-50 dark:bg-orange-950",
  },
];

export default function Precificacao() {
  const navigate = useNavigate();
  const [receitas] = useLocalStorage<Receita[]>("receitas", []);
  const { unidades } = useUnidadesMedida();

  // Filtrar apenas receitas ativas
  const receitasAtivas = receitas.filter(receita => receita.cardapio === "ativo");

  // Ordenar alfabeticamente
  const receitasAtivasOrdenadas = [...receitasAtivas].sort((a, b) => 
    a.nome.localeCompare(b.nome, 'pt-BR')
  );

  // Calcular custos de produção (insumos + embalagens)
  const calcularCustosProducao = (receita: Receita) => {
    const custoIngredientes = receita.ingredientes.reduce((total, ing) => total + ing.custoReceita, 0);
    const custoEmbalagens = (receita.embalagens || []).reduce((total, emb) => total + emb.custoReceita, 0);
    return custoIngredientes + custoEmbalagens;
  };

  // Calcular despesas com vendas
  const calcularDespesasVenda = (receita: Receita) => {
    return (receita.despesasVenda || []).reduce((acc, despesa) => acc + despesa.valor, 0);
  };

  // Calcular CMV Real
  const calcularCMV = (receita: Receita) => {
    const custoTotal = receita.custoTotal || 0;
    const despesasVenda = calcularDespesasVenda(receita);
    return custoTotal + despesasVenda;
  };

  // Calcular percentual CMV Real
  const calcularPercentualCMV = (receita: Receita) => {
    const valorVenda = receita.valorVenda || 0;
    if (valorVenda === 0) return 0;
    const cmv = calcularCMV(receita);
    return (cmv / valorVenda) * 100;
  };

  // Verificar alertas
  const verificarAlertas = (receita: Receita) => {
    const percentualCMV = calcularPercentualCMV(receita);
    const alertas: string[] = [];

    if (percentualCMV > 45) {
      alertas.push("CMV muito alto");
    }

    return alertas;
  };

  const getUnidadeMedidaNome = (unidadeId: string) => {
    const unidade = unidades.find(u => u.id === unidadeId);
    return unidade ? unidade.nome : unidadeId;
  };

  const handleEdit = (id: string) => {
    navigate(`/precificacao/ficha-tecnica/editar/${id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Precificação"
        description="Gerencie a Precificação dos seus Produtos iniciando pelo Cadastro de Ingredientes e Embalagens; na sequência crie suas sub-receitas e Ficha Técnica dos Produtos Finalizados"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {opcoes.map((opcao, index) => {
          const Icon = opcao.icon;
          return (
            <Card
              key={opcao.url}
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-4 border-l-[#D89B8C] group"
              onClick={() => navigate(opcao.url)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="p-3">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className={`w-8 h-8 rounded-lg ${opcao.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm mb-0.5">{opcao.title}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">{opcao.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Lista de Produtos à Venda */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Produtos à Venda</h2>
        
        {receitasAtivas.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhum produto ativo no cardápio ainda.</p>
          </Card>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Receita</TableHead>
                  <TableHead className="text-center">Categoria</TableHead>
                  <TableHead className="text-center">Medida</TableHead>
                  <TableHead className="text-right">Custos de Produção</TableHead>
                  <TableHead className="text-right">Despesas com Vendas</TableHead>
                  <TableHead className="text-center">Alertas</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receitasAtivasOrdenadas.map((receita) => {
                  const custosProducao = calcularCustosProducao(receita);
                  const despesasVenda = calcularDespesasVenda(receita);
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
                        {getUnidadeMedidaNome(receita.unidadeRendimento)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right",
                        temAlerta && "text-red-700 dark:text-red-400"
                      )}>
                        R$ {custosProducao.toFixed(2)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right",
                        temAlerta && "text-red-700 dark:text-red-400"
                      )}>
                        R$ {despesasVenda.toFixed(2)}
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
                        <div className="flex justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEdit(receita.id)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
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
      </div>
    </div>
  );
}
