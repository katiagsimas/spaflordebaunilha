import { Settings, Tag, UserCircle, Ruler, Lock, Package, Layers, BookOpen, Building2, FileText } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { useConfigStatus } from "@/hooks/useConfigStatus";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const opcoes = [
  {
    title: "Dados da Confeitaria",
    description: "Informações básicas do negócio",
    icon: UserCircle,
    url: "/configuracoes/dados-confeitaria",
    color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950",
    statusKey: "seusDados" as const,
    requiresAdmin: false,
  },
  {
    title: "Tipos de Insumos e Embalagens",
    description: "Cadastre os tipos base de ingredientes e embalagens",
    icon: Package,
    url: "/configuracoes/tipos-insumos",
    color: "text-green-600 bg-green-50 dark:bg-green-950",
    statusKey: null,
    requiresAdmin: false,
  },
  {
    title: "Categorias Plano de Contas",
    description: "Categorias para classificação de receitas e despesas no DRE",
    icon: Layers,
    url: "/configuracoes/categorias-plano-contas",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950",
    statusKey: null,
    requiresAdmin: false,
  },
  {
    title: "Plano de Contas",
    description: "Contas detalhadas para lançamentos financeiros",
    icon: BookOpen,
    url: "/configuracoes/plano-contas",
    color: "text-orange-600 bg-orange-50 dark:bg-orange-950",
    statusKey: null,
    requiresAdmin: false,
  },
  {
    title: "Bancos",
    description: "Cadastre os bancos que você utiliza",
    icon: Building2,
    url: "/configuracoes/bancos",
    color: "text-teal-600 bg-teal-50 dark:bg-teal-950",
    statusKey: null,
    requiresAdmin: false,
  },
  {
    title: "Tipos de Documentos",
    description: "Tipos de documentos para lançamentos financeiros",
    icon: FileText,
    url: "/configuracoes/tipos-documentos",
    color: "text-pink-600 bg-pink-50 dark:bg-pink-950",
    statusKey: null,
    requiresAdmin: false,
  },
  {
    title: "Unidades de Medidas",
    description: "Configure unidades de medida",
    icon: Ruler,
    url: "/configuracoes/unidades-medida",
    color: "text-purple-600 bg-purple-50 dark:bg-purple-950",
    statusKey: "unidadesMedida" as const,
    requiresAdmin: false,
  },
  {
    title: "Categorias de Receitas",
    description: "Organize suas receitas por categorias",
    icon: Tag,
    url: "/configuracoes/categorias-receitas",
    color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950",
    statusKey: "categorias" as const,
    requiresAdmin: false,
  },
];

export default function Configuracoes() {
  const navigate = useNavigate();
  const { status, isLoading } = useConfigStatus();
  const { isAdmin, isLoading: isLoadingAdmin } = useIsAdmin();

  const getStatusBadge = (opcao: typeof opcoes[0]) => {
    if (!opcao.statusKey || !status) return null;
    
    const isCompleted = status[opcao.statusKey];
    
    if (isCompleted) {
      return (
        <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
          ✓ Concluído
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
        ⏱ Pendente
      </Badge>
    );
  };

  const handleCardClick = (opcao: typeof opcoes[0]) => {
    // Se requer admin e não é admin, bloqueia navegação
    if (opcao.requiresAdmin && !isAdmin) {
      return; // Não navega
    }
    navigate(opcao.url);
  };

  if (isLoading || isLoadingAdmin) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <PageHeader
        title="Configurações"
        description="Configure categorias, planos de contas e formas de pagamento"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {opcoes.map((opcao, index) => {
          const Icon = opcao.icon;
          const isRestricted = opcao.requiresAdmin && !isAdmin;
          
          return (
            <Card
              key={opcao.title}
              className={`group transition-all duration-200 animate-fade-in border-l-4 ${
                isRestricted 
                  ? 'opacity-75 cursor-not-allowed' 
                  : 'cursor-pointer hover:shadow-lg hover:scale-[1.02]'
              }`}
              style={{ 
                animationDelay: `${index * 0.05}s`,
                borderLeftColor: opcao.color.includes('indigo') ? 'hsl(var(--primary))' :
                                opcao.color.includes('cyan') ? 'hsl(var(--accent))' :
                                opcao.color.includes('purple') ? 'hsl(var(--secondary))' :
                                'hsl(var(--muted-foreground))'
              }}
              onClick={() => handleCardClick(opcao)}
            >
              <CardHeader className="p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${opcao.color} flex items-center justify-center shrink-0 ${
                      !isRestricted ? 'group-hover:scale-110' : ''
                    } transition-transform`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base font-semibold leading-tight line-clamp-2 flex items-center gap-2">
                      {opcao.title}
                      {isRestricted && <Lock className="h-3 w-3 text-muted-foreground" />}
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className="text-xs line-clamp-2">
                  {opcao.description}
                </CardDescription>
                <div className="pt-1">
                  {isRestricted ? (
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      👁️ Somente Visualização
                    </Badge>
                  ) : (
                    getStatusBadge(opcao)
                  )}
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
