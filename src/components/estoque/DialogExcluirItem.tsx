import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import type { ItemComEstoque } from '@/types/estoque';

interface DialogExcluirItemProps {
  item: ItemComEstoque;
  aberto: boolean;
  onFechar: () => void;
  onExcluir: () => void;
}

export function DialogExcluirItem({ item, aberto, onFechar, onExcluir }: DialogExcluirItemProps) {
  const [loading, setLoading] = useState(false);
  const [validacoes, setValidacoes] = useState({
    temMovimentos: false,
    temPrecos: false,
    totalMovimentos: 0,
    totalPrecos: 0
  });

  useEffect(() => {
    if (aberto) {
      verificarUso();
    }
  }, [aberto, item.id]);

  const verificarUso = async () => {
    try {
      // Verificar movimentos de estoque
      const { count: countMov } = await supabase
        .from('movimentacoes_estoque')
        .select('*', { count: 'exact', head: true })
        .eq('item_id', item.id);

      // Verificar preços cadastrados
      const { count: countPreco } = await supabase
        .from('precos')
        .select('*', { count: 'exact', head: true })
        .eq('item_id', item.id);

      setValidacoes({
        temMovimentos: (countMov || 0) > 0,
        temPrecos: (countPreco || 0) > 0,
        totalMovimentos: countMov || 0,
        totalPrecos: countPreco || 0
      });
    } catch (error) {
      console.error('Erro ao verificar uso do item:', error);
    }
  };

  const handleExcluir = async () => {
    try {
      setLoading(true);

      // Deletar em cascata
      const { error } = await supabase
        .from('itens')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      onExcluir();
      onFechar();
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      alert('Erro ao excluir item. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const temAlgumUso = validacoes.temMovimentos || validacoes.temPrecos;

  return (
    <AlertDialog open={aberto} onOpenChange={onFechar}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <div>Você está prestes a excluir o item:</div>
            <div className="font-semibold text-foreground text-base">
              {item.nome}
              {item.marca && (
                <span className="text-sm text-muted-foreground ml-2">
                  ({item.marca})
                </span>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Avisos de uso */}
        {temAlgumUso && (
          <Alert variant="destructive">
            <div className="space-y-3">
              <AlertDescription className="font-semibold">
                <AlertTriangle className="h-4 w-4 inline mr-2" />
                Atenção! Este item está sendo usado:
              </AlertDescription>

              <ul className="space-y-1 text-sm">
                {validacoes.temPrecos && (
                  <li className="flex items-center gap-2">
                    <X className="h-3 w-3" />
                    <span>
                      {validacoes.totalPrecos} {validacoes.totalPrecos === 1 ? 'preço cadastrado' : 'preços cadastrados'}
                    </span>
                  </li>
                )}

                {validacoes.temMovimentos && (
                  <li className="flex items-center gap-2">
                    <X className="h-3 w-3" />
                    <span>
                      {validacoes.totalMovimentos} {validacoes.totalMovimentos === 1 ? 'movimentação de estoque' : 'movimentações de estoque'}
                    </span>
                  </li>
                )}
              </ul>

              <AlertDescription className="text-xs pt-2 border-t border-destructive/20">
                <strong>Atenção:</strong> Ao confirmar, todo o histórico será permanentemente deletado e não poderá ser recuperado.
              </AlertDescription>
            </div>
          </Alert>
        )}

        <AlertDialogFooter>
          <Button variant="outline" onClick={onFechar} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleExcluir} disabled={loading}>
            {loading ? 'Excluindo...' : 'Sim, Excluir Permanentemente'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
