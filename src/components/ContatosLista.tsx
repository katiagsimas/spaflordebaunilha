import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2, Phone, Mail, Cake } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatPhone } from '@/lib/utils';

interface Contato {
  id: string;
  nome: string;
  cargo?: string;
  data_aniversario?: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
}

interface ContatosListaProps {
  contatos: Contato[];
  onEdit: (contato: Contato) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export function ContatosLista({ contatos, onEdit, onDelete, loading }: ContatosListaProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contatos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <LoadingMascote size={48} label="Carregando contatos..." />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (contatos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contatos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhum contato cadastrado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contatos ({contatos.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Aniversário</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contatos.map((contato) => (
                <TableRow key={contato.id}>
                  <TableCell className="font-medium">{contato.nome}</TableCell>
                  <TableCell>{contato.cargo || '-'}</TableCell>
                  <TableCell>
                    {contato.data_aniversario ? (
                      <div className="flex items-center gap-1">
                        <Cake className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(contato.data_aniversario), 'dd/MM', { locale: ptBR })}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {contato.telefone ? (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {formatPhone(contato.telefone)}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(contato)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(contato.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
