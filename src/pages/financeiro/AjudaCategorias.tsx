import { useState } from 'react';
import { ArrowLeft, BookOpen, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Building, CreditCard, CheckCircle, XCircle, Lightbulb, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useNavigate } from 'react-router-dom';

export default function AjudaCategorias() {
  const navigate = useNavigate();
  const [expandedExamples, setExpandedExamples] = useState<string[]>([]);

  const toggleExample = (id: string) => {
    setExpandedExamples(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          <div className="flex items-start gap-4">
            <div className="bg-[#D89B8C] p-4 rounded-2xl">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-[#6B5047] mb-2">
                Como usar Categorias de Planos de Contas
              </h1>
              <p className="text-lg text-[#9C8B82]">
                Guia completo para organizar suas finanças de forma profissional
              </p>
            </div>
          </div>
        </div>

        {/* O que são? */}
        <Card className="mb-6 border-2 border-[#D89B8C]">
          <CardHeader className="bg-[#F5E6E0]">
            <CardTitle className="text-2xl text-[#6B5047] flex items-center gap-2">
              <AlertCircle className="h-6 w-6" />
              O que são?
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-base text-[#6B5047] leading-relaxed">
              Categorias organizam suas receitas e despesas de forma contábil, 
              permitindo gerar relatórios financeiros precisos (como o DRE - Demonstrativo de Resultado do Exercício).
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm text-blue-900">
                💡 <strong>Exemplo:</strong> Ao invés de ter apenas "Despesas", você terá "Despesas Administrativas" → "Aluguel", 
                permitindo análises detalhadas de onde seu dinheiro está indo.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Estrutura Hierárquica */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl text-[#6B5047]">Estrutura Hierárquica</CardTitle>
            <CardDescription>Como as categorias se organizam em níveis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-[#FAF7F5] rounded-lg border-l-4 border-[#6B5047]">
                <div className="bg-[#6B5047] text-white px-3 py-1 rounded font-mono font-bold min-w-[60px] text-center">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-[#6B5047] mb-1">Nível 1 - Grupos Principais</h4>
                  <p className="text-sm text-[#9C8B82]">
                    Categorias de topo (ex: RECEITAS, CUSTOS, DESPESAS)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-[#FAF7F5] rounded-lg border-l-4 border-[#8BA888] ml-8">
                <div className="bg-[#8BA888] text-white px-3 py-1 rounded font-mono font-bold min-w-[60px] text-center">
                  1.1
                </div>
                <div>
                  <h4 className="font-bold text-[#6B5047] mb-1">Nível 2 - Subgrupos</h4>
                  <p className="text-sm text-[#9C8B82]">
                    Divisões dos grupos (ex: Receita Bruta, Despesas Administrativas)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-[#FAF7F5] rounded-lg border-l-4 border-[#D89B8C] ml-16">
                <div className="bg-[#D89B8C] text-white px-3 py-1 rounded font-mono font-bold min-w-[80px] text-center">
                  1.1.1
                </div>
                <div>
                  <h4 className="font-bold text-[#6B5047] mb-1">Nível 3 - Categorias Específicas</h4>
                  <p className="text-sm text-[#9C8B82]">
                    Categorias detalhadas para uso diário (ex: Vendas de Produtos, Aluguel)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-[#FAF7F5] rounded-lg border-l-4 border-[#E5C89F] ml-24">
                <div className="bg-[#E5C89F] text-white px-3 py-1 rounded font-mono font-bold min-w-[100px] text-center">
                  1.1.1.1
                </div>
                <div>
                  <h4 className="font-bold text-[#6B5047] mb-1">Nível 4 - Subcategorias Detalhadas</h4>
                  <p className="text-sm text-[#9C8B82]">
                    Máximo detalhamento (opcional, para casos específicos)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Indicadores */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl text-[#6B5047]">Indicadores</CardTitle>
            <CardDescription>Tipos de categoria disponíveis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-500">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <Badge className="bg-green-600">Receita</Badge>
                </div>
                <h4 className="font-bold text-green-900 mb-1">Receita</h4>
                <p className="text-sm text-green-800">
                  Entradas de dinheiro: vendas, serviços prestados, receitas financeiras
                </p>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border-2 border-red-500">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <Badge className="bg-red-600">Despesa</Badge>
                </div>
                <h4 className="font-bold text-red-900 mb-1">Despesa</h4>
                <p className="text-sm text-red-800">
                  Saídas de dinheiro: custos, despesas operacionais, contas a pagar
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-500">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  <Badge className="bg-blue-600">Ativo</Badge>
                </div>
                <h4 className="font-bold text-blue-900 mb-1">Ativo</h4>
                <p className="text-sm text-blue-800">
                  Bens e direitos (raramente usado em confeitarias)
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-500">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  <Badge className="bg-purple-600">Passivo</Badge>
                </div>
                <h4 className="font-bold text-purple-900 mb-1">Passivo</h4>
                <p className="text-sm text-purple-800">
                  Obrigações e dívidas (raramente usado em confeitarias)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Faixas no DRE */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl text-[#6B5047]">Faixas no DRE</CardTitle>
            <CardDescription>Onde cada categoria aparece no relatório financeiro</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600">Receita</Badge>
                    <span className="font-semibold">Receita Bruta</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-[#9C8B82] mb-2">
                    Total de vendas antes de descontar impostos e deduções
                  </p>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-sm text-green-900">
                      <strong>Exemplo:</strong> Vendas de Bolos: R$ 5.000,00
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-600">Despesa</Badge>
                    <span className="font-semibold">Deduções</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-[#9C8B82] mb-2">
                    Impostos, devoluções e descontos concedidos
                  </p>
                  <div className="bg-orange-50 p-3 rounded">
                    <p className="text-sm text-orange-900">
                      <strong>Exemplo:</strong> Impostos sobre Vendas: R$ 500,00
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-600">Despesa</Badge>
                    <span className="font-semibold">CMV (Custo da Mercadoria Vendida)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-[#9C8B82] mb-2">
                    Custos diretos para produzir/comprar o que foi vendido
                  </p>
                  <div className="bg-red-50 p-3 rounded">
                    <p className="text-sm text-red-900">
                      <strong>Exemplo:</strong> Farinha, açúcar, chocolate, embalagens
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-600">Despesa</Badge>
                    <span className="font-semibold">Despesas Administrativas</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-[#9C8B82] mb-2">
                    Gastos para manter o negócio funcionando
                  </p>
                  <div className="bg-yellow-50 p-3 rounded">
                    <p className="text-sm text-yellow-900">
                      <strong>Exemplo:</strong> Aluguel, salários, água, luz, internet
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-600">Despesa</Badge>
                    <span className="font-semibold">Despesas com Vendas</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-[#9C8B82] mb-2">
                    Gastos para vender e entregar produtos
                  </p>
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="text-sm text-purple-900">
                      <strong>Exemplo:</strong> Marketing, comissões, fretes, taxas de plataformas
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-pink-600">Despesa</Badge>
                    <span className="font-semibold">Despesas Financeiras</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-[#9C8B82] mb-2">
                    Custos com bancos e empréstimos
                  </p>
                  <div className="bg-pink-50 p-3 rounded">
                    <p className="text-sm text-pink-900">
                      <strong>Exemplo:</strong> Juros, tarifas bancárias, IOF
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Dicas */}
        <Card className="mb-6 border-2 border-[#8BA888]">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-2xl text-[#6B5047] flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-[#8BA888]" />
              Dicas e Boas Práticas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-[#6B5047]">
                  <strong>Use as categorias pré-configuradas</strong> quando possível - 
                  o sistema já vem com 37 categorias prontas para confeitarias
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-[#6B5047]">
                  <strong>Crie subcategorias para detalhamento</strong> - 
                  quebre categorias genéricas em específicas para análises melhores
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-[#6B5047]">
                  <strong>Não exclua categorias com lançamentos</strong> - 
                  desative ao invés de excluir para manter histórico
                </p>
              </div>

              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-[#6B5047]">
                  <strong>Evite criar muitas categorias no nível 1</strong> - 
                  mantenha a estrutura organizada e simples
                </p>
              </div>

              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-[#6B5047]">
                  <strong>Não altere categorias "Sistema"</strong> - 
                  elas são protegidas e garantem o funcionamento correto do DRE
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exemplos Práticos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl text-[#6B5047]">Exemplos Práticos</CardTitle>
            <CardDescription>Casos reais de uso em confeitarias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Receitas */}
              <div>
                <button
                  onClick={() => toggleExample('receitas')}
                  className="w-full flex items-center justify-between p-4 bg-green-50 rounded-lg border-2 border-green-500 hover:bg-green-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <h3 className="font-bold text-green-900">Para Receitas</h3>
                  </div>
                  {expandedExamples.includes('receitas') ? 
                    <ChevronDown className="h-5 w-5 text-green-600" /> : 
                    <ChevronRight className="h-5 w-5 text-green-600" />
                  }
                </button>
                {expandedExamples.includes('receitas') && (
                  <div className="mt-3 ml-6 space-y-2">
                    <div className="p-3 bg-white rounded border-l-4 border-green-500">
                      <p className="font-mono text-sm font-bold text-green-900 mb-1">1.1.1 - Vendas de Produtos</p>
                      <p className="text-sm text-[#9C8B82]">Bolos, doces, tortas, salgados</p>
                    </div>
                    <div className="p-3 bg-white rounded border-l-4 border-green-500">
                      <p className="font-mono text-sm font-bold text-green-900 mb-1">1.1.2 - Prestação de Serviços</p>
                      <p className="text-sm text-[#9C8B82]">Aulas de confeitaria, consultorias, eventos</p>
                    </div>
                    <div className="p-3 bg-white rounded border-l-4 border-green-500">
                      <p className="font-mono text-sm font-bold text-green-900 mb-1">1.3.1 - Receitas Financeiras</p>
                      <p className="text-sm text-[#9C8B82]">Rendimentos de aplicações, cashback</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Custos */}
              <div>
                <button
                  onClick={() => toggleExample('custos')}
                  className="w-full flex items-center justify-between p-4 bg-red-50 rounded-lg border-2 border-red-500 hover:bg-red-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <h3 className="font-bold text-red-900">Para Custos (CMV)</h3>
                  </div>
                  {expandedExamples.includes('custos') ? 
                    <ChevronDown className="h-5 w-5 text-red-600" /> : 
                    <ChevronRight className="h-5 w-5 text-red-600" />
                  }
                </button>
                {expandedExamples.includes('custos') && (
                  <div className="mt-3 ml-6 space-y-2">
                    <div className="p-3 bg-white rounded border-l-4 border-red-500">
                      <p className="font-mono text-sm font-bold text-red-900 mb-1">2.1.1 - Matéria-Prima</p>
                      <p className="text-sm text-[#9C8B82]">Farinha, açúcar, chocolate, ovos, leite</p>
                    </div>
                    <div className="p-3 bg-white rounded border-l-4 border-red-500">
                      <p className="font-mono text-sm font-bold text-red-900 mb-1">2.1.2 - Embalagens</p>
                      <p className="text-sm text-[#9C8B82]">Caixas, sacos, fitas, etiquetas</p>
                    </div>
                    <div className="p-3 bg-white rounded border-l-4 border-red-500">
                      <p className="font-mono text-sm font-bold text-red-900 mb-1">2.1.4 - Insumos de Produção</p>
                      <p className="text-sm text-[#9C8B82]">Gás, energia elétrica da cozinha</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Despesas */}
              <div>
                <button
                  onClick={() => toggleExample('despesas')}
                  className="w-full flex items-center justify-between p-4 bg-yellow-50 rounded-lg border-2 border-yellow-500 hover:bg-yellow-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-bold text-yellow-900">Para Despesas Operacionais</h3>
                  </div>
                  {expandedExamples.includes('despesas') ? 
                    <ChevronDown className="h-5 w-5 text-yellow-600" /> : 
                    <ChevronRight className="h-5 w-5 text-yellow-600" />
                  }
                </button>
                {expandedExamples.includes('despesas') && (
                  <div className="mt-3 ml-6 space-y-2">
                    <div className="p-3 bg-white rounded border-l-4 border-yellow-500">
                      <p className="font-mono text-sm font-bold text-yellow-900 mb-1">3.1.2 - Aluguel</p>
                      <p className="text-sm text-[#9C8B82]">Espaço comercial, cozinha industrial</p>
                    </div>
                    <div className="p-3 bg-white rounded border-l-4 border-yellow-500">
                      <p className="font-mono text-sm font-bold text-yellow-900 mb-1">3.2.1 - Marketing e Publicidade</p>
                      <p className="text-sm text-[#9C8B82]">Instagram Ads, Google Ads, impressos</p>
                    </div>
                    <div className="p-3 bg-white rounded border-l-4 border-yellow-500">
                      <p className="font-mono text-sm font-bold text-yellow-900 mb-1">3.2.4 - Taxas de Plataformas</p>
                      <p className="text-sm text-[#9C8B82]">iFood, Rappi, Uber Eats</p>
                    </div>
                    <div className="p-3 bg-white rounded border-l-4 border-yellow-500">
                      <p className="font-mono text-sm font-bold text-yellow-900 mb-1">3.3.2 - Tarifas Bancárias</p>
                      <p className="text-sm text-[#9C8B82]">TEF, maquininha de cartão, PIX</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Final */}
        <div className="bg-gradient-to-r from-[#D89B8C] to-[#B87C6D] rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3">Pronto para começar?</h2>
          <p className="mb-6 text-white/90">
            Organize suas finanças de forma profissional e tome decisões baseadas em dados reais!
          </p>
          <Button
            onClick={() => navigate('/financeiro/categorias-plano-contas')}
            className="bg-white text-[#D89B8C] hover:bg-gray-100"
            size="lg"
          >
            Ir para Categorias de Planos de Contas
          </Button>
        </div>
      </div>
    </div>
  );
}
