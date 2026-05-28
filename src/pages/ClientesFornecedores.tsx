import { useMemo, useState } from "react";
import { Users, Truck, Search, X, Plus, Eye, Phone, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AniversariantesPremiumCard } from "@/components/AniversariantesPremiumCard";
import { useClientes } from "@/hooks/useClientes";
import { useFornecedores } from "@/hooks/useFornecedores";
import { useFamiliares } from "@/hooks/useFamiliares";
import { parseISOToDate } from "@/lib/dateUtils";
import clientesFornecedoresHero from "@/assets/clientes-fornecedores-hero-banner.png";
import { HeroBanner } from "@/components/HeroBanner";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

function formatDateBR(iso?: string | null) {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function ClientesFornecedores() {
  const navigate = useNavigate();
  const { clientes } = useClientes();
  const { fornecedores } = useFornecedores();
  const { familiares: allFamiliares } = useFamiliares();

  const aniversariantesDoMes = useMemo(() => {
    const mesAtual = new Date().getMonth();

    const clientesAniversariantes = clientes
      .filter((cliente) => {
        if (!cliente.data_aniversario) return false;
        const data = parseISOToDate(cliente.data_aniversario);
        return data.getMonth() === mesAtual;
      })
      .map((cliente) => ({
        ...cliente,
        tipo_aniversariante: "cliente" as const,
      }));

    const familiaresAniversariantes = allFamiliares
      .filter((familiar: any) => {
        if (!familiar.data_nascimento) return false;
        const data = parseISOToDate(familiar.data_nascimento);
        return data.getMonth() === mesAtual;
      })
      .map((familiar: any) => {
        const cliente = clientes.find((c) => c.id === familiar.cliente_id);
        return {
          id: familiar.id,
          nome: familiar.nome,
          data_aniversario: familiar.data_nascimento,
          telefone: cliente?.telefone,
          tipo_aniversariante: "familiar" as const,
          parentesco: familiar.parentesco,
          cliente_nome: cliente?.nome,
          cliente_id: familiar.cliente_id,
        };
      });

    const todos = [...clientesAniversariantes, ...familiaresAniversariantes];

    return todos.sort((a, b) => {
      const dataA = parseISOToDate(a.data_aniversario)?.getDate() ?? 0;
      const dataB = parseISOToDate(b.data_aniversario)?.getDate() ?? 0;
      return dataA - dataB;
    });
  }, [clientes, allFamiliares]);

  // ---- Filtros compartilhados ----
  const [tab, setTab] = useState<"clientes" | "fornecedores">("clientes");
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");

  const limparFiltros = () => {
    setBusca("");
    setTipoFiltro("todos");
  };

  const tiposClientes = useMemo(
    () => Array.from(new Set(clientes.map((c) => c.tipo).filter(Boolean))) as string[],
    [clientes],
  );
  const tiposFornecedores = useMemo(
    () => Array.from(new Set(fornecedores.map((f) => f.tipo).filter(Boolean))) as string[],
    [fornecedores],
  );

  const clientesFiltrados = useMemo(() => {
    return clientes.filter((c) => {
      if (busca) {
        const q = busca.toLowerCase();
        const hit =
          c.nome?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.telefone?.toLowerCase().includes(q) ||
          c.cpf_cnpj?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (tipoFiltro !== "todos" && c.tipo !== tipoFiltro) return false;
      return true;
    });
  }, [clientes, busca, tipoFiltro]);

  const fornecedoresFiltrados = useMemo(() => {
    return fornecedores.filter((f) => {
      if (busca) {
        const q = busca.toLowerCase();
        const hit =
          f.nome?.toLowerCase().includes(q) ||
          f.email?.toLowerCase().includes(q) ||
          f.telefone?.toLowerCase().includes(q) ||
          f.cpf_cnpj?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (tipoFiltro !== "todos" && f.tipo !== tipoFiltro) return false;
      return true;
    });
  }, [fornecedores, busca, tipoFiltro]);

  const tiposOptions = tab === "clientes" ? tiposClientes : tiposFornecedores;

  return (
    <div className="min-h-screen bg-[#FFF9F5] pb-24">
      <div className="container mx-auto p-6 space-y-6">
        {/* HERO BANNER padronizado */}
        <HeroBanner
          image={clientesFornecedoresHero}
          title="Parceiros"
          subtitle="Cuide das pessoas que sustentam a sua confeitaria."
          imageAlt="Parceiros"
        />

        {aniversariantesDoMes.length > 0 && (
          <AniversariantesPremiumCard
            itens={aniversariantesDoMes.map((item: any) => ({
              id: item.id,
              nome: item.nome,
              data_aniversario: item.data_aniversario,
              telefone: item.telefone,
              legenda:
                "tipo_aniversariante" in item && item.tipo_aniversariante === "familiar"
                  ? `${item.parentesco ?? "Familiar"} de ${item.cliente_nome ?? ""}`.trim()
                  : undefined,
              onClick: () => navigate("/clientes"),
            }))}
          />
        )}

        {/* ===== TABS + FILTROS + TABELA ===== */}
        <Card className="rounded-2xl border-2 border-[#C9A14A]/60 bg-white shadow-[0_4px_18px_-10px_rgba(91,26,43,0.15)] overflow-hidden">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as "clientes" | "fornecedores");
              setTipoFiltro("todos");
            }}
          >
            {/* Header com tabs + ação */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#5B1A2B]/10 px-4 sm:px-6 pt-4">
              <TabsList className="bg-transparent p-0 h-auto gap-6 rounded-none justify-start">
                <TabsTrigger
                  value="clientes"
                  className="relative rounded-none border-0 bg-transparent px-1 pb-3 pt-1 font-display text-[15px] text-[#3D0F1C]/60 data-[state=active]:text-[#3D0F1C] data-[state=active]:font-semibold data-[state=active]:shadow-none after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:rounded-full after:bg-[#C9A14A] after:opacity-0 data-[state=active]:after:opacity-100 transition-all"
                >
                  <Users className="h-4 w-4 mr-2" /> Clientes
                </TabsTrigger>
                <TabsTrigger
                  value="fornecedores"
                  className="relative rounded-none border-0 bg-transparent px-1 pb-3 pt-1 font-display text-[15px] text-[#3D0F1C]/60 data-[state=active]:text-[#3D0F1C] data-[state=active]:font-semibold data-[state=active]:shadow-none after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:rounded-full after:bg-[#C9A14A] after:opacity-0 data-[state=active]:after:opacity-100 transition-all"
                >
                  <Truck className="h-4 w-4 mr-2" /> Fornecedores
                </TabsTrigger>
              </TabsList>

              <div className="pb-3 sm:pb-0">
                <Button
                  className="bg-cda-vinho hover:bg-cda-vinho-escuro text-white"
                  onClick={() => navigate(tab === "clientes" ? "/clientes" : "/fornecedores")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {tab === "clientes" ? "Novo cliente" : "Novo fornecedor"}
                </Button>
              </div>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 px-4 sm:px-6 py-4 bg-[#FDF6EE]/40 border-b border-[#5B1A2B]/10">
              <div className="md:col-span-8 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cda-vinho/50" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome, e-mail, telefone ou documento…"
                  className="pl-9 bg-white border-[#5B1A2B]/15"
                />
              </div>

              <div className="md:col-span-3">
                <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                  <SelectTrigger className="bg-white border-[#5B1A2B]/15">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    {tiposOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-1">
                <Button
                  variant="outline"
                  onClick={limparFiltros}
                  className="w-full border-[#5B1A2B]/20 text-cda-vinho hover:bg-cda-dourado hover:text-cda-preto hover:border-cda-dourado"
                >
                  <X className="h-4 w-4 mr-1" /> Limpar
                </Button>
              </div>
            </div>

            {/* Conteúdo das tabs */}
            <TabsContent value="clientes" className="m-0">
              {clientesFiltrados.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <Users className="h-12 w-12 mx-auto text-cda-dourado/60 mb-3" />
                  <p className="text-lg font-semibold text-cda-vinho-escuro">
                    Nenhum cliente encontrado
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ajuste os filtros ou cadastre um novo cliente.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#FDF6EE]/60">
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Cidade/UF</TableHead>
                      <TableHead>Aniversário</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientesFiltrados.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium text-cda-vinho-escuro">{c.nome}</TableCell>
                        <TableCell className="text-sm text-cda-vinho/80">{c.tipo || "-"}</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex flex-col gap-0.5">
                            {c.telefone && (
                              <span className="flex items-center gap-1 text-cda-vinho/80">
                                <Phone className="h-3 w-3" /> {c.telefone}
                              </span>
                            )}
                            {c.email && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-3 w-3" /> {c.email}
                              </span>
                            )}
                            {!c.telefone && !c.email && <span className="text-muted-foreground">-</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {[c.cidade, c.estado].filter(Boolean).join("/") || "-"}
                        </TableCell>
                        <TableCell className="text-sm">{formatDateBR(c.data_aniversario)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => navigate("/clientes")}
                            title="Ver"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="fornecedores" className="m-0">
              {fornecedoresFiltrados.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <Truck className="h-12 w-12 mx-auto text-cda-dourado/60 mb-3" />
                  <p className="text-lg font-semibold text-cda-vinho-escuro">
                    Nenhum fornecedor encontrado
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ajuste os filtros ou cadastre um novo fornecedor.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#FDF6EE]/60">
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fornecedoresFiltrados.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium text-cda-vinho-escuro">{f.nome}</TableCell>
                        <TableCell className="text-sm text-cda-vinho/80">{f.tipo || "-"}</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex flex-col gap-0.5">
                            {f.telefone && (
                              <span className="flex items-center gap-1 text-cda-vinho/80">
                                <Phone className="h-3 w-3" /> {f.telefone}
                              </span>
                            )}
                            {f.email && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-3 w-3" /> {f.email}
                              </span>
                            )}
                            {!f.telefone && !f.email && <span className="text-muted-foreground">-</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{f.cpf_cnpj || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => navigate("/fornecedores")}
                            title="Ver"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
