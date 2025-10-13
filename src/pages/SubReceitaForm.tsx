import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChefHat, Upload, X } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
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
interface SubReceita {
  id: string;
  nome: string;
  tempoPreparo: number;
  unidadeTempo: "minutos" | "horas";
  rendimento: number;
  unidadeRendimento: "gramas" | "unidades";
  ingredientes: IngredienteReceita[];
  modoPreparo?: string;
  custoTotal: number;
  imagens?: string[];
}
export default function SubReceitaForm() {
  const navigate = useNavigate();
  const {
    id
  } = useParams();
  const [subReceitas, setSubReceitas] = useLocalStorage<SubReceita[]>("subReceitas", []);
  const [ingredientesCadastrados, setIngredientesCadastrados] = useLocalStorage<Ingrediente[]>("ingredientes", []);
  const [formData, setFormData] = useState({
    nome: "",
    tempoPreparo: "",
    unidadeTempo: "minutos" as "minutos" | "horas",
    rendimento: "",
    unidadeRendimento: "gramas" as "gramas" | "unidades"
  });
  const [ingredientes, setIngredientes] = useState<IngredienteReceita[]>([]);
  const [modoPreparo, setModoPreparo] = useState("");
  const [imagens, setImagens] = useState<string[]>([]);
  useEffect(() => {
    if (id) {
      const subReceita = subReceitas.find(s => s.id === id);
      if (subReceita) {
        setFormData({
          nome: subReceita.nome,
          tempoPreparo: subReceita.tempoPreparo.toString(),
          unidadeTempo: subReceita.unidadeTempo,
          rendimento: subReceita.rendimento.toString(),
          unidadeRendimento: subReceita.unidadeRendimento
        });
        setIngredientes(subReceita.ingredientes);
        setModoPreparo(subReceita.modoPreparo || "");
        setImagens(subReceita.imagens || []);
      }
    }
  }, [id, subReceitas]);
  const calcularCustos = (ingrediente: IngredienteReceita): IngredienteReceita => {
    const custoUnitario = ingrediente.precoEmbalagem / ingrediente.qtdeEmbalagem;
    const custoReceita = custoUnitario * ingrediente.quantidadeUtilizada;
    return {
      ...ingrediente,
      custoUnitario,
      custoReceita
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
      custoReceita: 0
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
        precoEmbalagem: ingredienteSelecionado.preco
      });
      setIngredientes(novosIngredientes);
    }
  };
  const handleQuantidadeChange = (index: number, quantidade: number) => {
    const novosIngredientes = [...ingredientes];
    novosIngredientes[index] = calcularCustos({
      ...novosIngredientes[index],
      quantidadeUtilizada: quantidade
    });
    setIngredientes(novosIngredientes);
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImagens(prev => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleRemoveImage = (index: number) => {
    setImagens(imagens.filter((_, i) => i !== index));
  };

  const handleRemoveIngrediente = (index: number) => {
    setIngredientes(ingredientes.filter((_, i) => i !== index));
  };
  const custoTotal = ingredientes.reduce((total, ing) => total + ing.custoReceita, 0);
  const handleSave = () => {
    if (!formData.nome.trim()) {
      toast.error("Por favor, informe o nome da sub-receita");
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
    const subReceitaId = id || Date.now().toString();
    const subReceita: SubReceita = {
      id: subReceitaId,
      nome: formData.nome,
      tempoPreparo: Number(formData.tempoPreparo),
      unidadeTempo: formData.unidadeTempo,
      rendimento: Number(formData.rendimento),
      unidadeRendimento: formData.unidadeRendimento,
      ingredientes,
      modoPreparo,
      custoTotal,
      imagens
    };

    // Criar ou atualizar o ingrediente correspondente à sub-receita
    const ingredienteSubReceita: Ingrediente = {
      id: `sub-receita-${subReceitaId}`,
      nome: formData.nome,
      marca: "Sub-Receita",
      quantidade: Number(formData.rendimento),
      unidadeMedida: formData.unidadeRendimento === "gramas" ? "g" : "un",
      preco: custoTotal,
      dataAtualizacao: new Date().toISOString().split('T')[0]
    };
    if (id) {
      setSubReceitas(subReceitas.map(s => s.id === id ? subReceita : s));
      // Atualizar o ingrediente existente
      setIngredientesCadastrados(ingredientesCadastrados.map(ing => ing.id === `sub-receita-${id}` ? ingredienteSubReceita : ing));
      toast.success("Sub-receita atualizada com sucesso!");
    } else {
      setSubReceitas([...subReceitas, subReceita]);
      // Adicionar novo ingrediente
      setIngredientesCadastrados([...ingredientesCadastrados, ingredienteSubReceita]);
      toast.success("Sub-receita criada com sucesso!");
    }
    navigate("/sub-receitas");
  };
  return <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton to="/sub-receitas" />
        <div className="flex-1">
          <PageHeader title={id ? "Editar Pré-Preparo" : "Novo Pré-Preparo"} description="Preencha dos dados da sua Sub-Receita" />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="nome">Nome do Pré-Preparo *</Label>
              <Input id="nome" value={formData.nome} onChange={e => setFormData({
              ...formData,
              nome: e.target.value
            })} placeholder="Ex: Recheio de Brigadeiro" />
            </div>

            <div>
              <Label htmlFor="tempoPreparo">Tempo de Preparo *</Label>
              <div className="flex gap-2">
                <Input id="tempoPreparo" type="number" min="1" value={formData.tempoPreparo} onChange={e => setFormData({
                ...formData,
                tempoPreparo: e.target.value
              })} placeholder="Ex: 30" className="flex-1" />
                <Select value={formData.unidadeTempo} onValueChange={(value: "minutos" | "horas") => setFormData({
                ...formData,
                unidadeTempo: value
              })}>
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
                <Input id="rendimento" type="number" min="1" value={formData.rendimento} onChange={e => setFormData({
                ...formData,
                rendimento: e.target.value
              })} placeholder="Ex: 500" className="flex-1" />
                <Select value={formData.unidadeRendimento} onValueChange={(value: "gramas" | "unidades") => setFormData({
                ...formData,
                unidadeRendimento: value
              })}>
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

            {ingredientes.length > 0 && <div className="overflow-x-auto">
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
                    {ingredientes.map((ingrediente, index) => <TableRow key={ingrediente.id}>
                        <TableCell>
                          <Select value={ingrediente.ingredienteId} onValueChange={value => handleSelectIngrediente(index, value)}>
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {ingredientesCadastrados.map(ing => <SelectItem key={ing.id} value={ing.id}>
                                  {ing.nome}
                                </SelectItem>)}
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
                          <Input type="number" min="0" step="0.01" value={ingrediente.quantidadeUtilizada || ""} onChange={e => handleQuantidadeChange(index, parseFloat(e.target.value) || 0)} className="w-24" placeholder="0" />
                        </TableCell>
                        <TableCell className="text-sm">
                          R$ {ingrediente.custoUnitario.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-sm font-semibold">
                          R$ {ingrediente.custoReceita.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveIngrediente(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </div>}

            {ingredientes.length > 0 && <div className="flex justify-end">
                <div className="text-lg font-bold">
                  Custo Total da Receita: R$ {custoTotal.toFixed(2)}
                </div>
              </div>}
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="modo-preparo">
              <AccordionTrigger className="text-base font-semibold">
                <div className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5" />
                  Modo de Preparo
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Textarea value={modoPreparo} onChange={e => setModoPreparo(e.target.value)} placeholder="Descreva o modo de preparo da sub-receita..." className="min-h-[200px]" />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="space-y-4">
            <Label>Imagens do Pré-Preparo</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {imagens.map((imagem, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={imagem} 
                    alt={`Imagem ${index + 1}`} 
                    className="w-full h-40 object-cover rounded-lg border-2 border-border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center px-2">
                    Clique para adicionar imagem
                  </p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => navigate("/sub-receitas")}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {id ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>;
}