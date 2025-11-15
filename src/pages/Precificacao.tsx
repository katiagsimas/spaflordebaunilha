import { PageHeader } from "@/components/PageHeader";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ChefHat, CookingPot, Pencil, Package, AlertTriangle, Loader2 } from "lucide-react";
import { useCalculosReceita } from "@/hooks/useCalculosReceita";
import { useUnidadesMedida } from "@/hooks/useUnidadesMedida";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const opcoes = [
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
  const { resumos, isLoading } = useCalculosReceita();
  const { unidades } = useUnidadesMedida();

  const resumosAtivos = resumos.filter(resumo => resumo.cardapio === "ativo");
  const resumosAtivosOrdenados = [...resumosAtivos].sort((a, b) => 
    a.nome.localeCompare(b.nome, 'pt-BR')
  );

  const formatarUnidade = (unidadeId: string) => {
    const unidade = unidades.find(u => u.id === unidadeId);
    return unidade?.sigla || unidade?.nome || unidadeId;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Precificação"
        description="Gerencie a Precificação dos seus Produtos"
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
                    <CardTitle className="text-sm">{opcao.title}</CardTitle>
                    <CardDescription className="text-xs mt-1">{opcao.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <div>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : resumosAtivosOrdenados.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CookingPot className="h-5 w-5" />
                Produtos à Venda
              </CardTitle>
              <CardDescription>
                Produtos ativos no seu cardápio com análise de custos e margem
              </CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Receita</TableHead>
                    <TableHead className="text-right">Preço de Venda</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Quantidade Medida</TableHead>
                    <TableHead className="text-right">Custo Ingredientes</TableHead>
                    <TableHead className="text-right">Custo Embalagens</TableHead>
                    <TableHead className="text-right">Outros Custos</TableHead>
                    <TableHead className="text-right">Despesas Vendas</TableHead>
                    <TableHead className="text-right">CMV Real %</TableHead>
                    <TableHead className="text-right">Margem Lucro %</TableHead>
                    <TableHead>Alertas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resumosAtivosOrdenados.map((resumo) => (
                    <TableRow key={resumo.receitaId}>
                      <TableCell className="font-medium">{resumo.nome}</TableCell>
                      <TableCell className="text-right">R$ {resumo.valorVenda.toFixed(2)}</TableCell>
                      <TableCell>{resumo.categoria || "-"}</TableCell>
                      <TableCell>{resumo.rendimento} {formatarUnidade(resumo.unidadeRendimento)}</TableCell>
                      <TableCell className="text-right">R$ {resumo.custoIngredientes.toFixed(2)}</TableCell>
                      <TableCell className="text-right">R$ {resumo.custoEmbalagens.toFixed(2)}</TableCell>
                      <TableCell className="text-right">R$ {resumo.custoMaoObra.toFixed(2)}</TableCell>
                      <TableCell className="text-right">R$ {resumo.despesasVenda.toFixed(2)}</TableCell>
                      <TableCell className={cn("text-right font-medium", resumo.cmvRealPercent <= 35 && "text-green-600", resumo.cmvRealPercent > 35 && resumo.cmvRealPercent <= 45 && "text-blue-600", resumo.cmvRealPercent > 45 && resumo.cmvRealPercent <= 55 && "text-yellow-600", resumo.cmvRealPercent > 55 && "text-red-600")}>
                        {resumo.cmvRealPercent.toFixed(1)}%
                      </TableCell>
                      <TableCell className={cn("text-right font-medium", resumo.margemPercent >= 30 && "text-green-600", resumo.margemPercent < 30 && resumo.margemPercent >= 0 && "text-yellow-600", resumo.margemPercent < 0 && "text-red-600")}>
                        {resumo.margemPercent.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        {resumo.alertas.includes("Prejuízo") ? (
                          <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />{resumo.alertas}</Badge>
                        ) : resumo.alertas.includes("CMV Muito Alto") || resumo.alertas.includes("Margem Baixa") || resumo.alertas.includes("CMV em Atenção") ? (
                          <Badge className="gap-1 bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/30">{resumo.alertas}</Badge>
                        ) : resumo.alertas.includes("CMV Excelente") || resumo.alertas.includes("CMV Aceitável") ? (
                          <Badge className="gap-1 bg-green-500/10 text-green-700 border-green-500/20 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30">{resumo.alertas}</Badge>
                        ) : (
                          <Badge variant="outline">{resumo.alertas}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/precificacao/ficha-tecnica/editar/${resumo.receitaId}`)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
