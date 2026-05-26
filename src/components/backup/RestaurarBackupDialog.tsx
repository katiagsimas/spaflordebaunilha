import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export interface RestaurarBackupAlvo {
  /** Identificação visível do snapshot: data + módulos. */
  nome: string;
  dataCriacao?: string;
  modulos?: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alvo: RestaurarBackupAlvo | null;
  /** Função que executa a restauração de fato; recebe a palavra-chave digitada. */
  onConfirm: (confirmacao: string) => Promise<void>;
  restaurando: boolean;
}

export function RestaurarBackupDialog({ open, onOpenChange, alvo, onConfirm, restaurando }: Props) {
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [aceito, setAceito] = useState(false);
  const [confirmTexto, setConfirmTexto] = useState("");

  useEffect(() => {
    if (open) {
      setEtapa(1);
      setAceito(false);
      setConfirmTexto("");
    }
  }, [open]);

  if (!alvo) return null;

  const palavraChave = `RESTAURAR ${alvo.nome}`;
  const podeConfirmar = confirmTexto.trim() === palavraChave;

  return (
    <Dialog open={open} onOpenChange={(v) => (!restaurando ? onOpenChange(v) : null)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-cda-vinho">
            <ShieldAlert className="h-5 w-5 text-cda-coral" />
            Restaurar backup
          </DialogTitle>
          <DialogDescription>
            Esta operação é irreversível. Leia com atenção antes de prosseguir.
          </DialogDescription>
        </DialogHeader>

        {etapa === 1 ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-cda-dourado/40 bg-cda-dourado/10 p-4 space-y-2">
              <div className="text-sm">
                <span className="font-semibold text-cda-preto">Backup: </span>
                <code className="text-xs">{alvo.nome}</code>
              </div>
              {alvo.dataCriacao && (
                <div className="text-sm text-cda-preto/80">
                  <span className="font-semibold">Data do snapshot: </span>
                  {alvo.dataCriacao}
                </div>
              )}
              {alvo.modulos && alvo.modulos.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {alvo.modulos.map((m) => (
                    <Badge key={m} variant="secondary" className="text-[10px]">{m}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-cda-coral/40 bg-cda-coral/10 p-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-cda-coral shrink-0 mt-0.5" />
              <p className="text-sm text-cda-preto">
                <strong>Todos os dados criados ou alterados</strong> depois desse backup serão{" "}
                <strong>perdidos e não poderão ser recuperados</strong>. Os módulos do snapshot
                serão sobrescritos com os dados desta cópia.
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={aceito} onCheckedChange={(v) => setAceito(!!v)} className="mt-0.5" />
              <span className="text-sm text-cda-preto">
                Entendo que esta ação é <strong>irreversível</strong> e os dados atuais serão
                permanentemente substituídos.
              </span>
            </label>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button
                onClick={() => setEtapa(2)}
                disabled={!aceito}
                className="bg-cda-vinho hover:bg-cda-vinho-escuro text-cda-branco"
              >
                Continuar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-cda-preto">
              Para confirmar, digite a frase exata abaixo:
            </p>
            <div className="rounded-md bg-muted px-3 py-2 font-mono text-sm select-all">
              {palavraChave}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-restore" className="text-xs text-muted-foreground">
                Digite aqui para confirmar
              </Label>
              <Input
                id="confirm-restore"
                value={confirmTexto}
                onChange={(e) => setConfirmTexto(e.target.value)}
                placeholder={palavraChave}
                autoComplete="off"
                disabled={restaurando}
              />
            </div>
            {restaurando && (
              <div className="rounded-md border bg-cda-creme p-3 text-sm text-cda-preto flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Restaurando… não feche esta janela.
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setEtapa(1)} disabled={restaurando}>
                Voltar
              </Button>
              <Button
                onClick={() => onConfirm(confirmTexto.trim())}
                disabled={!podeConfirmar || restaurando}
                className="bg-cda-coral hover:bg-cda-coral/90 text-cda-branco"
              >
                {restaurando ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Restaurando…</>
                ) : (
                  "Restaurar definitivamente"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
