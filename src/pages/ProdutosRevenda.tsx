import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Leaf, Sparkles, Home, Plus, Edit2, ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProdutoRevendaForm } from "@/components/ProdutoRevendaForm";
import { useProdutosRevenda, type ProdutoRevenda } from "@/hooks/useProdutosRevenda";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ProdutosRevenda() {
  const navigate = useNavigate();
  const { produtos, loading: loadingProdutos } = useProdutosRevenda();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMarca, setSelectedMarca] = useState<'natura' | 'avon' | 'casa_estilo' | null>(null);
  const [editingProduto, setEditingProduto] = useState<ProdutoRevenda | undefined>(undefined);

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

  const marcas = [
    { id: 'natura', label: 'Natura', icon: Leaf, desc: 'Gestão de produtos e pedidos Natura' },
    { id: 'avon', label: 'Avon', icon: Sparkles, desc: 'Gestão de produtos e pedidos Avon' },
    { id: 'casa_estilo', label: 'Casa & Estilo', icon: Home, desc: 'Itens de decoração e utilidades domésticas' }
  ];

  return (
    <div className="min-h-screen bg-sfb-baunilha pb-24">
      <PageHeader
        title="Produtos para Revenda"
        description="Gerencie aqui seus itens de marcas parceiras como Natura, Avon e Casa & Estilo."
      />

      <div className="container mx-auto px-6 pt-4 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {marcas.map((m) => (
            <div key={m.id} className="bg-white border-2 border-sfb-areia/60 rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-[52px] h-[52px] rounded-full bg-sfb-baunilha flex items-center justify-center shrink-0">
                  <m.icon className="h-6 w-6 text-sfb-cacau" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[15px] font-semibold text-sfb-cacau leading-tight">
                    {m.label}
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    {m.desc}
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => handleOpenForm(m.id as any)}
                className="w-full bg-sfb-salvia hover:bg-sfb-salvia/90 text-white gap-2"
              >
                <Plus className="h-4 w-4" /> Novo Produto {m.label}
              </Button>
            </div>
          ))}
        </div>

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
                          onClick={() => handleOpenForm(produto.marca as any, produto)}
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
