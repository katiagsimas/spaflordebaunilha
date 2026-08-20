import { useNavigate } from "react-router-dom";
import { Scale, FlaskConical, Cake, ChevronLeft, ShoppingBag } from "lucide-react";

import { HeroBanner } from "@/components/HeroBanner";
import { useUserProfile } from "@/hooks/useUserProfile";



export default function Cadastros() {
  const { profile: userProfile } = useUserProfile();
  const [showRevendaOptions, setShowRevendaOptions] = useState(false);
  const { produtos, loading: loadingProdutos } = useProdutosRevenda();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMarca, setSelectedMarca] = useState<'natura' | 'avon' | 'casa_estilo' | null>(null);
  const [editingProduto, setEditingProduto] = useState<ProdutoRevenda | undefined>(undefined);
  

  const navigate = useNavigate();

  const handleOpenForm = (marca: 'natura' | 'avon' | 'casa_estilo', produto?: ProdutoRevenda) => {
    setSelectedMarca(marca);
    setEditingProduto(produto);
    setIsFormOpen(true);
  };

  const getMarcaLabel = (marca: string) => {
    switch(marca) {
      case 'natura': return 'Natura';
      case 'avon': return 'Avon';
      case 'casa_estilo': return 'Casa & Estilo';
      default: return marca;
    }
  };


  return (
    <div className="min-h-screen bg-sfb-baunilha pb-24">
      <div className="container mx-auto px-6 pt-1 pb-6 space-y-6">
        {/* HERO BANNER padronizado - Imagem removida conforme solicitação */}
        <HeroBanner
          title="Cadastros"
          subtitle="Centralize aqui os cadastros base do seu negócio: mão de obra, unidades de medida e categorias."
        />

        {/* CARDS DE NAVEGAÇÃO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1 — Mão de Obra */}
          <button
            onClick={() => {
              navigate("/configuracoes/precificacao/mao-de-obra");
            }}

            className="group text-left bg-white border-2 border-sfb-areia/60 rounded-xl p-5 transition-all duration-200 hover:border-sfb-terracota hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="w-[52px] h-[52px] rounded-full bg-sfb-baunilha flex items-center justify-center shrink-0">
                <Scale className="h-6 w-6 text-sfb-cacau" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-semibold text-sfb-cacau leading-tight">
                  Valores de Mão de Obra
                </p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Configure valor/hora e tempo de preparo dos itens
                </p>
              </div>
            </div>
          </button>

          {/* Card 2 — Unidades de Medidas */}
          <button
            onClick={() => {
              navigate("/configuracoes/unidades-medida");
            }}

            className="group text-left bg-white border-2 border-sfb-areia/60 rounded-xl p-5 transition-all duration-200 hover:border-sfb-terracota hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="w-[52px] h-[52px] rounded-full bg-sfb-baunilha flex items-center justify-center shrink-0">
                <FlaskConical className="h-6 w-6 text-sfb-cacau" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-semibold text-sfb-cacau leading-tight">
                  Unidades de Medidas
                </p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Kg, litros, unidades e outras medidas usadas nos itens
                </p>
              </div>
            </div>
          </button>

          {/* Card 3 — Categorias */}
          <button
            onClick={() => {
              navigate("/configuracoes/categorias");
            }}

            className="group text-left bg-white border-2 border-sfb-areia/60 rounded-xl p-5 transition-all duration-200 hover:border-sfb-terracota hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="w-[52px] h-[52px] rounded-full bg-sfb-baunilha flex items-center justify-center shrink-0">
                <Cake className="h-6 w-6 text-sfb-cacau" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-semibold text-sfb-cacau leading-tight">
                  Categorias
                </p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Organize seus produtos por categorias
                </p>
              </div>
            </div>
          </button>

          {/* Card 4 — Produtos para Revenda */}
          <button
            onClick={() => {
              setShowRevendaOptions(!showRevendaOptions);
            }}
            className={`group text-left bg-white border-2 rounded-xl p-5 transition-all duration-200 hover:shadow-md ${showRevendaOptions ? 'border-sfb-terracota bg-sfb-baunilha/30' : 'border-sfb-areia/60 hover:border-sfb-terracota'}`}
          >
            <div className="flex items-start gap-3">
              <div className="w-[52px] h-[52px] rounded-full bg-sfb-baunilha flex items-center justify-center shrink-0">
                <ShoppingBag className="h-6 w-6 text-sfb-cacau" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-semibold text-sfb-cacau leading-tight">
                  Produtos para Revenda
                </p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Gerencie itens adquiridos para revenda direta
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* SUB-CARDS DE REVENDA (Condicionais) */}
        {showRevendaOptions && (
          <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card Natura */}
              <div className="bg-white border-2 border-sfb-areia/60 rounded-xl p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-[52px] h-[52px] rounded-full bg-sfb-baunilha flex items-center justify-center shrink-0">
                    <Leaf className="h-6 w-6 text-sfb-cacau" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[15px] font-semibold text-sfb-cacau leading-tight">
                      Natura
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      Gestão de produtos e pedidos Natura
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => handleOpenForm('natura')}
                  className="w-full bg-sfb-salvia hover:bg-sfb-salvia/90 text-white gap-2"
                >
                  <Plus className="h-4 w-4" /> Novo Produto Natura
                </Button>
              </div>

              {/* Card Avon */}
              <div className="bg-white border-2 border-sfb-areia/60 rounded-xl p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-[52px] h-[52px] rounded-full bg-sfb-baunilha flex items-center justify-center shrink-0">
                    <Sparkles className="h-6 w-6 text-sfb-cacau" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[15px] font-semibold text-sfb-cacau leading-tight">
                      Avon
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      Gestão de produtos e pedidos Avon
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => handleOpenForm('avon')}
                  className="w-full bg-sfb-salvia hover:bg-sfb-salvia/90 text-white gap-2"
                >
                  <Plus className="h-4 w-4" /> Novo Produto Avon
                </Button>
              </div>

              {/* Card Casa & Estilo */}
              <div className="bg-white border-2 border-sfb-areia/60 rounded-xl p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-[52px] h-[52px] rounded-full bg-sfb-baunilha flex items-center justify-center shrink-0">
                    <Home className="h-6 w-6 text-sfb-cacau" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[15px] font-semibold text-sfb-cacau leading-tight">
                      Casa & Estilo
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      Itens de decoração e utilidades domésticas
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => handleOpenForm('casa_estilo')}
                  className="w-full bg-sfb-salvia hover:bg-sfb-salvia/90 text-white gap-2"
                >
                  <Plus className="h-4 w-4" /> Novo Produto Casa & Estilo
                </Button>
              </div>
            </div>

            {/* Listagem Simplificada de Produtos */}
            {produtos.length > 0 && (
              <div className="bg-white border-2 border-sfb-areia/60 rounded-xl overflow-hidden">
                <div className="p-4 border-b bg-sfb-baunilha/10">
                  <h3 className="font-display font-semibold text-sfb-cacau">Produtos Cadastrados</h3>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Marca</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Linha</TableHead>
                        <TableHead>Qtd/ml</TableHead>
                        <TableHead>Pontos</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtos.map((produto) => (
                        <TableRow key={produto.id}>
                          <TableCell className="capitalize">{getMarcaLabel(produto.marca)}</TableCell>
                          <TableCell>{produto.codigo || '-'}</TableCell>
                          <TableCell className="font-medium">{produto.descricao}</TableCell>
                          <TableCell>{produto.linha || '-'}</TableCell>
                          <TableCell>{produto.quantidade_ml || '-'}</TableCell>
                          <TableCell>{produto.quantidade_pontos}</TableCell>
                          <TableCell>
                            <Badge variant={produto.status === 'Ativo' ? 'default' : 'secondary'}>
                              {produto.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleOpenForm(produto.marca, produto)}
                            >
                              <Edit2 className="h-4 w-4 text-sfb-terracota" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingProduto ? 'Editar Produto' : 'Novo Produto'} - {selectedMarca ? getMarcaLabel(selectedMarca) : ''}
            </DialogTitle>
          </DialogHeader>
          {selectedMarca && (
            <ProdutoRevendaForm 
              marca={selectedMarca}
              produto={editingProduto}
              onSuccess={() => {
                setIsFormOpen(false);
                setEditingProduto(undefined);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Botão flutuante voltar */}
      <button
        onClick={() => navigate(-1)}
        className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-sfb-cacau text-sfb-baunilha flex items-center justify-center shadow-lg hover:opacity-90 transition"
        aria-label="Voltar"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    </div>
  );
}
