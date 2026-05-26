import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { propostaService } from "@/services/propostaService";
import { useGroup } from "@/contexts/GroupContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Proposta } from "@/types/proposta";
import { toast } from "sonner";

export function usePropostas() {
  const { activeGroup } = useGroup();
  const { user } = useAuth();
  const qc = useQueryClient();
  const groupId = activeGroup?.id;

  const propostas = useQuery({
    queryKey: ["propostas", groupId],
    queryFn: () => propostaService.list(groupId!),
    enabled: !!groupId,
  });

  const stats = useQuery({
    queryKey: ["propostas-stats", groupId],
    queryFn: () => propostaService.stats(groupId!),
    enabled: !!groupId,
  });

  const create = useMutation({
    mutationFn: (input: Partial<Proposta> & { cliente_nome: string }) =>
      propostaService.create({
        ...input,
        owner_group_id: groupId!,
        created_by: user!.id,
        cliente_nome: input.cliente_nome,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["propostas", groupId] });
      qc.invalidateQueries({ queryKey: ["propostas-stats", groupId] });
      toast.success("Proposta criada!");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Proposta> }) =>
      propostaService.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["propostas", groupId] });
      qc.invalidateQueries({ queryKey: ["propostas-stats", groupId] });
      toast.success("Proposta atualizada");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  const remove = useMutation({
    mutationFn: (id: string) => propostaService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["propostas", groupId] });
      qc.invalidateQueries({ queryKey: ["propostas-stats", groupId] });
      toast.success("Proposta excluída");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  return { propostas, stats, create, update, remove };
}
