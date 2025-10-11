import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Embalagem {
  id: string;
  nome: string;
  marca: string;
  quantidade: number;
  unidadeMedida: string;
  preco: number;
  dataAtualizacao: string;
}

interface Ingrediente {
  id: string;
  nome: string;
  marca: string;
  quantidade: number;
  unidadeMedida: string;
  preco: number;
  dataAtualizacao: string;
}

interface IngredienteReceita {
  id: string;
  ingredienteId: string;
  ingrediente: string;
  marca: string;
  qtdeEmbalagem: number;
  unidadeMedida: string;
  precoEmbalagem: number;
  quantidadeUtilizada: number;
  custoUnitario: number;
  custoReceita: number;
}

interface EmbalagemReceita {
  id: string;
  embalagemId: string;
  embalagem: string;
  marca: string;
  qtdeEmbalagem: number;
  unidadeMedida: string;
  precoEmbalagem: number;
  quantidadeUtilizada: number;
  custoUnitario: number;
  custoReceita: number;
}

interface Receita {
  id: string;
  nome: string;
  tempoPreparo: number;
  unidadeTempo: "minutos" | "horas";
  rendimento: number;
  unidadeRendimento: "gramas" | "unidades";
  ingredientes: IngredienteReceita[];
  embalagens: EmbalagemReceita[];
  custoTotal: number;
}

export default function ReceitaForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [receitas, setReceitas] = useLocalStorage<Receita[]>("receitas", []);
  const [ingredientesCadastrados] = useLocalStorage<Ingrediente[]>("ingredientes", []);
  const [embalagensCadastradas] = useLocalStorage<Embalagem[]>("embalagens", []);

  const [formData, setFormData] = useState({
    nome: "",
    tempoPreparo: "",
    unidadeTempo: "minutos" as "minutos" | "horas",
    rendimento: "",
    unidadeRendimento: "gramas" as "gramas" | "unidades",
  });

  const [ingredientes, setIngredientes] = useState<IngredienteReceita[]>([]);
  const [embalagens, setEmbalagens] = useState<EmbalagemReceita[]>([]);

  useEffect(() => {
    if (id) {
      const receita = receitas.find(r => r.id === id);
      if (receita) {
        setFormData({
          nome: receita.nome,
          tempoPreparo: receita.tempoPreparo.toString(),
          unidadeTempo: receita.unidadeTempo,
          rendimento: receita.rendimento.toString(),
          unidadeRendimento: receita.unidadeRendimento,
        });
        setIngredientes(receita.ingredientes);
        setEmbalagens(receita.embalagens || []);
      }
    }
  }, [id, receitas]);

  const calcularCustos = (ingrediente: IngredienteReceita): IngredienteReceita => {
    const custoUnitario = ingrediente.precoEmbalagem / ingrediente.qtdeEmbalagem;
    const custoReceita = custoUnitario * ingrediente.quantidadeUtilizada;
    return {
      ...ingrediente,
      custoUnitario,
      custoReceita,
    };
  };

  const handleAddIngrediente = () => {
    const novoIngrediente: IngredienteReceita = {
      id: Date.now().toString(),
      ingredienteId: "",
      ingrediente: "",
      marca: "",
      qtdeEmbalagem: 0,
      unidadeMedida: "",
      precoEmbalagem: 0,
      quantidadeUtilizada: 0,
      custoUnitario: 0,
      custoReceita: 0,
    };
    setIngredientes([...ingredientes, novoIngrediente]);
  };

  const handleSelectIngrediente = (index: number, ingredienteId: string) => {
    const ingredienteSelecionado = ingredientesCadastrados.find(i => i.id === ingredienteId);
    if (ingredienteSelecionado) {
      const novosIngredientes = [...ingredientes];
      novosIngredientes[index] = calcularCustos({
        ...novosIngredientes[index],
        ingredienteId: ingredienteSelecionado.id,
        ingrediente: ingredienteSelecionado.nome,
        marca: ingredienteSelecionado.marca,
        qtdeEmbalagem: ingredienteSelecionado.quantidade,
        unidadeMedida: ingredienteSelecionado.unidadeMedida,
        precoEmbalagem: ingredienteSelecionado.preco,
      });
      setIngredientes(novosIngredientes);
    }
  };

  const handleQuantidadeChange = (index: number, quantidade: number) => {
    const novosIngredientes = [...ingredientes];
    novosIngredientes[index] = calcularCustos({
      ...novosIngredientes[index],
      quantidadeUtilizada: quantidade,
    });
    setIngredientes(novosIngredientes);
  };

  const handleRemoveIngrediente = (index: number) => {
    setIngredientes(ingredientes.filter((_, i) => i !== index));
  };

  // Funções para Embalagens
  const calcularCustosEmbalagem = (embalagem: EmbalagemReceita): EmbalagemReceita => {
    const custoUnitario = embalagem.precoEmbalagem / embalagem.qtdeEmbalagem;
    const custoReceita = custoUnitario * embalagem.quantidadeUtilizada;
    return {
      ...embalagem,
      custoUnitario,
      custoReceita,
    };
  };

  const handleAddEmbalagem = () => {
    const novaEmbalagem: EmbalagemReceita = {
      id: Date.now().toString(),
      embalagemId: "",
      embalagem: "",
      marca: "",
      qtdeEmbalagem: 0,
      unidadeMedida: "",
      precoEmbalagem: 0,
      quantidadeUtilizada: 0,
      custoUnitario: 0,
      custoReceita: 0,
    };
    setEmbalagens([...embalagens, novaEmbalagem]);
  };

  const handleSelectEmbalagem = (index: number, embalagemId: string) => {
    const embalagemSelecionada = embalagensCadastradas.find(e => e.id === embalagemId);
    if (embalagemSelecionada) {
      const novasEmbalagens = [...embalagens];
      novasEmbalagens[index] = calcularCustosEmbalagem({
        ...novasEmbalagens[index],
        embalagemId: embalagemSelecionada.id,
        embalagem: embalagemSelecionada.nome,
        marca: embalagemSelecionada.marca,
        qtdeEmbalagem: embalagemSelecionada.quantidade,
        unidadeMedida: embalagemSelecionada.unidadeMedida,
        precoEmbalagem: embalagemSelecionada.preco,
      });
      setEmbalagens(novasEmbalagens);
    }
  };

  const handleQuantidadeEmbalagemChange = (index: number, quantidade: number) => {
    const novasEmbalagens = [...embalagens];
    novasEmbalagens[index] = calcularCustosEmbalagem({
      ...novasEmbalagens[index],
      quantidadeUtilizada: quantidade,
    });
    setEmbalagens(novasEmbalagens);
  };

  const handleRemoveEmbalagem = (index: number) => {
    setEmbalagens(embalagens.filter((_, i) => i !== index));
  };

  const custoTotal = 
    ingredientes.reduce((total, ing) => total + ing.custoReceita, 0) +
    embalagens.reduce((total, emb) => total + emb.custoReceita, 0);

  const handleSave = () => {
    if (!formData.nome.trim()) {
      toast.error("Por favor, informe o nome da receita");
      return;
    }

    if (!formData.tempoPreparo || Number(formData.tempoPreparo) <= 0) {
      toast.error("Por favor, informe um tempo de preparo válido");
      return;
    }

    if (!formData.rendimento || Number(formData.rendimento) <= 0) {
      toast.error("Por favor, informe um rendimento válido");
      return;
    }

    const receita: Receita = {
      id: id || Date.now().toString(),
      nome: formData.nome,
      tempoPreparo: Number(formData.tempoPreparo),
      unidadeTempo: formData.unidadeTempo,
      rendimento: Number(formData.rendimento),
      unidadeRendimento: formData.unidadeRendimento,
      ingredientes,
      embalagens,
      custoTotal,
    };

    if (id) {
      setReceitas(receitas.map(r => r.id === id ? receita : r));
      toast.success("Receita atualizada com sucesso!");
    } else {
      setReceitas([...receitas, receita]);
      toast.success("Receita criada com sucesso!");
    }

    navigate("/receitas");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/receitas")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <PageHeader
            title={id ? "Editar Receita" : "Nova Receita"}
            description="Preencha os dados da receita"
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="nome">Nome da Receita *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Bolo de Chocolate"
              />
            </div>

            <div>
              <Label htmlFor="tempoPreparo">Tempo de Preparo *</Label>
              <div className="flex gap-2">
                <Input
                  id="tempoPreparo"
                  type="number"
                  min="1"
                  value={formData.tempoPreparo}
                  onChange={(e) => setFormData({ ...formData, tempoPreparo: e.target.value })}
                  placeholder="Ex: 30"
                  className="flex-1"
                />
                <Select
                  value={formData.unidadeTempo}
                  onValueChange={(value: "minutos" | "horas") => setFormData({ ...formData, unidadeTempo: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutos">Minutos</SelectItem>
                    <SelectItem value="horas">Horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="rendimento">Rendimento *</Label>
              <div className="flex gap-2">
                <Input
                  id="rendimento"
                  type="number"
                  min="1"
                  value={formData.rendimento}
                  onChange={(e) => setFormData({ ...formData, rendimento: e.target.value })}
                  placeholder="Ex: 500"
                  className="flex-1"
                />
                <Select
                  value={formData.unidadeRendimento}
                  onValueChange={(value: "gramas" | "unidades") => setFormData({ ...formData, unidadeRendimento: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gramas">Gramas</SelectItem>
                    <SelectItem value="unidades">Unidades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Ingredientes</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddIngrediente}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Ingrediente
              </Button>
            </div>

            {ingredientes.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingrediente</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Qtde Embalagem</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Preço Emb.</TableHead>
                      <TableHead>Qtde Utilizada</TableHead>
                      <TableHead>Custo Unit.</TableHead>
                      <TableHead>Custo Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingredientes.map((ingrediente, index) => (
                      <TableRow key={ingrediente.id}>
                        <TableCell>
                          <Select
                            value={ingrediente.ingredienteId}
                            onValueChange={(value) => handleSelectIngrediente(index, value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {ingredientesCadastrados.map((ing) => (
                                <SelectItem key={ing.id} value={ing.id}>
                                  {ing.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm">{ingrediente.marca}</TableCell>
                        <TableCell className="text-sm">{ingrediente.qtdeEmbalagem || "-"}</TableCell>
                        <TableCell className="text-sm">{ingrediente.unidadeMedida}</TableCell>
                        <TableCell className="text-sm">
                          {ingrediente.precoEmbalagem ? `R$ ${ingrediente.precoEmbalagem.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={ingrediente.quantidadeUtilizada || ""}
                            onChange={(e) => handleQuantidadeChange(index, parseFloat(e.target.value) || 0)}
                            className="w-24"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell className="text-sm">
                          R$ {ingrediente.custoUnitario.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-sm font-semibold">
                          R$ {ingrediente.custoReceita.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveIngrediente(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {ingredientes.length > 0 && (
              <div className="flex justify-end">
                <div className="text-lg font-bold">
                  Custo Total dos Ingredientes: R$ {ingredientes.reduce((total, ing) => total + ing.custoReceita, 0).toFixed(2)}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Embalagens</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddEmbalagem}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Embalagem
              </Button>
            </div>

            {embalagens.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Embalagem</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Qtde Embalagem</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Preço Emb.</TableHead>
                      <TableHead>Qtde Utilizada</TableHead>
                      <TableHead>Custo Unit.</TableHead>
                      <TableHead>Custo Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {embalagens.map((embalagem, index) => (
                      <TableRow key={embalagem.id}>
                        <TableCell>
                          <Select
                            value={embalagem.embalagemId}
                            onValueChange={(value) => handleSelectEmbalagem(index, value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {embalagensCadastradas.map((emb) => (
                                <SelectItem key={emb.id} value={emb.id}>
                                  {emb.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm">{embalagem.marca}</TableCell>
                        <TableCell className="text-sm">{embalagem.qtdeEmbalagem || "-"}</TableCell>
                        <TableCell className="text-sm">{embalagem.unidadeMedida}</TableCell>
                        <TableCell className="text-sm">
                          {embalagem.precoEmbalagem ? `R$ ${embalagem.precoEmbalagem.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={embalagem.quantidadeUtilizada || ""}
                            onChange={(e) => handleQuantidadeEmbalagemChange(index, parseFloat(e.target.value) || 0)}
                            className="w-24"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell className="text-sm">
                          R$ {embalagem.custoUnitario.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-sm font-semibold">
                          R$ {embalagem.custoReceita.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveEmbalagem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {embalagens.length > 0 && (
              <div className="flex justify-end">
                <div className="text-lg font-bold">
                  Custo Total das Embalagens: R$ {embalagens.reduce((total, emb) => total + emb.custoReceita, 0).toFixed(2)}
                </div>
              </div>
            )}
          </div>

          {(ingredientes.length > 0 || embalagens.length > 0) && (
            <div className="flex justify-end pt-4 border-t">
              <div className="text-xl font-bold text-primary">
                Custo Total da Receita: R$ {custoTotal.toFixed(2)}
              </div>
            </div>
          )}


          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => navigate("/receitas")}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {id ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
