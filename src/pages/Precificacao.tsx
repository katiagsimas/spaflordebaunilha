import { PageHeader } from "@/components/PageHeader";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Users, ChefHat, CookingPot, DollarSign, Boxes, Package, Pencil } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

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
    url: "/cadastros/custos-fixos",
    color: "text-red-600 bg-red-50 dark:bg-red-950",
  },
  {
    title: "Ingredientes",
    description: "Cadastro de Insumos",
    icon: Boxes,
    url: "/cadastros/ingredientes",
    color: "text-orange-600 bg-orange-50 dark:bg-orange-950",
  },
  {
    title: "Embalagens",
    description: "Cadastro de embalagens",
    icon: Package,
    url: "/cadastros/embalagens",
    color: "text-pink-600 bg-pink-50 dark:bg-pink-950",
  },
  {
    title: "Pré-Preparo",
    description: "Gerencie suas sub-receitas",
    icon: ChefHat,
    url: "/sub-receitas",
    color: "text-purple-600 bg-purple-50 dark:bg-purple-950",
  },
  {
    title: "Ficha Técnica",
    description: "Calcule Custos e Preços de Venda",
    icon: CookingPot,
    url: "/receitas",
    color: "text-orange-600 bg-orange-50 dark:bg-orange-950",
  },
];

export default function Precificacao() {
  const navigate = useNavigate();
  const [receitas] = useLocalStorage<Receita[]>("receitas", []);

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

  const handleEdit = (id: string) => {
    navigate(`/receitas/editar/${id}`);
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
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receitasAtivasOrdenadas.map((receita) => {
                  const custosProducao = calcularCustosProducao(receita);
                  const despesasVenda = calcularDespesasVenda(receita);

                  return (
                    <TableRow key={receita.id}>
                      <TableCell className="font-medium">{receita.nome}</TableCell>
                      <TableCell className="text-center">{receita.categoria || "-"}</TableCell>
                      <TableCell className="text-center">{receita.unidadeRendimento}</TableCell>
                      <TableCell className="text-right">
                        R$ {custosProducao.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {despesasVenda.toFixed(2)}
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
