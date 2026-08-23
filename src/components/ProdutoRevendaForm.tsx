import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategorias } from "@/hooks/useCategorias";
import { useProdutosRevenda, type ProdutoRevenda } from "@/hooks/useProdutosRevenda";
import { toast } from "sonner";
import { DialogFooter } from "@/components/ui/dialog";
import { CategoryAutoComplete } from "@/components/CategoryAutoComplete";


interface ProdutoRevendaFormProps {
  produto?: ProdutoRevenda;
  marca: 'natura' | 'avon';
  onSuccess: () => void;
}

export function ProdutoRevendaForm({ produto, marca, onSuccess }: ProdutoRevendaFormProps) {
  const { categoriasAtivas } = useCategorias();
  const { createProduto, updateProduto } = useProdutosRevenda();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, reset } = useForm<Partial<ProdutoRevenda>>({
    defaultValues: produto || {
      marca,
      status: 'Ativo',
      quantidade_pontos: 0,
      preco: 0,
      preco_venda: 0
    }
  });

  const status = watch('status');
  const categoria_id = watch('categoria_id');

  useEffect(() => {
    if (produto) {
      reset(produto);
    }
  }, [produto, reset]);

  const onSubmit = async (data: Partial<ProdutoRevenda>) => {
    setLoading(true);
    try {
      console.log("Enviando dados do produto:", { ...data, marca });
      if (produto?.id && produto.id !== 'temp-id') {
        await updateProduto(produto.id, data);
      } else {
        // Garantir que a marca e o código estejam presentes
        const payload = { ...data, marca };
        await createProduto(payload as any);
      }
      onSuccess();
    } catch (error: any) {

      toast.error(error.message || "Erro ao salvar produto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="bg-sfb-baunilha p-3 rounded-lg border border-sfb-areia/50 mb-2">
        <p className="text-xs text-sfb-cacau leading-relaxed">
          Este produto será destinado ao catálogo da marca <strong>{marca.toUpperCase()}</strong>.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="codigo">Código</Label>
          <Input id="codigo" {...register('codigo')} placeholder="Ex: 12345" />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select 
            value={status} 
            onValueChange={(val) => setValue('status', val as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Pausado">Pausado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Input id="descricao" {...register('descricao', { required: true })} placeholder="Ex: Perfume Natura Ekos" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="linha">Linha</Label>
          <Input id="linha" {...register('linha')} placeholder="Ex: Ekos" />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="preco">Preço de Custo</Label>
          <Input
            id="preco"
            type="number"
            step="0.01"
            min="0"
            {...register('preco', { valueAsNumber: true })}
            placeholder="0,00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="preco_venda">Preço de Venda</Label>
          <Input
            id="preco_venda"
            type="number"
            step="0.01"
            min="0"
            {...register('preco_venda', { valueAsNumber: true })}
            placeholder="0,00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantidade_ml">Quantidade (ml ou outra)</Label>
          <Input id="quantidade_ml" {...register('quantidade_ml')} placeholder="Ex: 100ml" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantidade_pontos">Quantidade de Pontos</Label>
          <Input 
            id="quantidade_pontos" 
            type="number" 
            {...register('quantidade_pontos', { valueAsNumber: true })} 
            placeholder="0" 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="categoria_id">Categoria</Label>
          <CategoryAutoComplete
            categories={categoriasAtivas}
            value={categoria_id || undefined}
            onChange={(val) => setValue('categoria_id', val)}
            placeholder="Selecione a categoria"
            disabled={loading}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" className="bg-sfb-terracota hover:bg-sfb-terracota/90 text-sfb-baunilha" disabled={loading}>
          {loading ? "Salvando..." : produto?.id ? "Atualizar" : "Cadastrar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
