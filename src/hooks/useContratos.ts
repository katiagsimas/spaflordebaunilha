import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { contratoService } from "@/services/contratoService";
import { useGroup } from "@/contexts/GroupContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Contrato } from "@/types/contrato";
import { toast } from "sonner";

export function useContratoTemplates() {
  return useQuery({
    queryKey: ["contratos-templates"],
    queryFn: () => contratoService.listTemplates(),
  });
}

export function useContratos() {
  const { activeGroup } = useGroup();
  const { user } = useAuth();
  const qc = useQueryClient();
  const groupId = activeGroup?.id;

  const contratos = useQuery({
    queryKey: ["contratos", groupId],
    queryFn: () => contratoService.list(groupId!),
    enabled: !!groupId,
  });

  const stats = useQuery({
    queryKey: ["contratos-stats", groupId],
    queryFn: () => contratoService.stats(groupId!),
    enabled: !!groupId,
  });

  const create = useMutation({
    mutationFn: (input: Parameters<typeof contratoService.create>[0]) =>
      contratoService.create({ ...input, owner_group_id: groupId!, created_by: user!.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contratos", groupId] });
      qc.invalidateQueries({ queryKey: ["contratos-stats", groupId] });
      toast.success("Contrato criado!");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Contrato> }) =>
      contratoService.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contratos", groupId] });
      qc.invalidateQueries({ queryKey: ["contratos-stats", groupId] });
      toast.success("Contrato atualizado");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  const remove = useMutation({
    mutationFn: (id: string) => contratoService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contratos", groupId] });
      qc.invalidateQueries({ queryKey: ["contratos-stats", groupId] });
      toast.success("Contrato excluído");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  return { contratos, stats, create, update, remove };
}
