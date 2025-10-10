import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2, Save } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";

interface Ingredient {
  id: string;
  name: string;
  cost: number;
  quantity: number;
  unit: string;
}

interface Recipe {
  id: string;
  name: string;
  category: string;
  servings: number;
  ingredients: Ingredient[];
  electricity: number;
  gas: number;
  water: number;
  packaging: number;
  otherCosts: number;
  prepTime: number;
  hourlyRate: number;
  profitMargin: number;
}

const Calculadora = () => {
  const [recipes, setRecipes] = useLocalStorage<Recipe[]>("recipes", []);
  const [recipeName, setRecipeName] = useState("");
  const [category, setCategory] = useState("Bolos");
  const [servings, setServings] = useState(1);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    cost: 0,
    quantity: 0,
    unit: "un",
  });
  const [electricity, setElectricity] = useState(0);
  const [gas, setGas] = useState(0);
  const [water, setWater] = useState(0);
  const [packaging, setPackaging] = useState(0);
  const [otherCosts, setOtherCosts] = useState(0);
  const [prepTime, setPrepTime] = useState(0);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [profitMargin, setProfitMargin] = useState([100]);

  const addIngredient = () => {
    if (newIngredient.name && newIngredient.cost > 0) {
      setIngredients([
        ...ingredients,
        { ...newIngredient, id: Date.now().toString() },
      ]);
      setNewIngredient({ name: "", cost: 0, quantity: 0, unit: "un" });
      toast.success("Ingrediente adicionado");
    }
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter((ing) => ing.id !== id));
    toast.success("Ingrediente removido");
  };

  const calculateCosts = () => {
    const ingredientsCost = ingredients.reduce(
      (sum, ing) => sum + ing.cost * ing.quantity,
      0
    );
    const operationalCost = electricity + gas + water + packaging + otherCosts;
    const laborCost = prepTime * hourlyRate;
    const totalCost = ingredientsCost + operationalCost + laborCost;
    const costPerServing = totalCost / servings;
    const sellingPrice = costPerServing * (1 + profitMargin[0] / 100);
    const profitPerServing = sellingPrice - costPerServing;

    return {
      ingredientsCost,
      operationalCost,
      laborCost,
      totalCost,
      costPerServing,
      sellingPrice,
      profitPerServing,
    };
  };

  const saveRecipe = () => {
    if (recipeName && ingredients.length > 0) {
      const newRecipe: Recipe = {
        id: Date.now().toString(),
        name: recipeName,
        category,
        servings,
        ingredients,
        electricity,
        gas,
        water,
        packaging,
        otherCosts,
        prepTime,
        hourlyRate,
        profitMargin: profitMargin[0],
      };
      setRecipes([...recipes, newRecipe]);
      toast.success("Cálculo salvo com sucesso!");
      resetForm();
    }
  };

  const resetForm = () => {
    setRecipeName("");
    setCategory("Bolos");
    setServings(1);
    setIngredients([]);
    setElectricity(0);
    setGas(0);
    setWater(0);
    setPackaging(0);
    setOtherCosts(0);
    setPrepTime(0);
    setHourlyRate(0);
    setProfitMargin([100]);
  };

  const costs = calculateCosts();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Calculadora de Precificação"
        description="Calcule o preço ideal considerando todos os custos"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Informações do Produto */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Informações do Produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Produto *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Bolo de Chocolate"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category" className="bg-popover">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="Bolos">Bolos</SelectItem>
                      <SelectItem value="Doces">Doces</SelectItem>
                      <SelectItem value="Salgados">Salgados</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="servings">Rendimento (porções) *</Label>
                  <Input
                    id="servings"
                    type="number"
                    min="1"
                    value={servings}
                    onChange={(e) => setServings(Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ingredientes */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Custos de Ingredientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-5">
                <Input
                  placeholder="Nome"
                  value={newIngredient.name}
                  onChange={(e) =>
                    setNewIngredient({ ...newIngredient, name: e.target.value })
                  }
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Custo (R$)"
                  value={newIngredient.cost || ""}
                  onChange={(e) =>
                    setNewIngredient({ ...newIngredient, cost: Number(e.target.value) })
                  }
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Quantidade"
                  value={newIngredient.quantity || ""}
                  onChange={(e) =>
                    setNewIngredient({ ...newIngredient, quantity: Number(e.target.value) })
                  }
                />
                <Input
                  placeholder="Unidade"
                  value={newIngredient.unit}
                  onChange={(e) =>
                    setNewIngredient({ ...newIngredient, unit: e.target.value })
                  }
                />
                <Button onClick={addIngredient} className="w-full">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {ingredients.length > 0 && (
                <div className="space-y-2">
                  {ingredients.map((ing) => (
                    <div
                      key={ing.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{ing.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {ing.quantity} {ing.unit} × R$ {ing.cost.toFixed(2)} = R${" "}
                          {(ing.cost * ing.quantity).toFixed(2)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIngredient(ing.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold text-sm">Subtotal:</span>
                    <span className="font-bold text-primary">
                      R$ {costs.ingredientsCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Custos Operacionais */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Custos Operacionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="electricity">Energia Elétrica (R$)</Label>
                  <Input
                    id="electricity"
                    type="number"
                    step="0.01"
                    value={electricity || ""}
                    onChange={(e) => setElectricity(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gas">Gás (R$)</Label>
                  <Input
                    id="gas"
                    type="number"
                    step="0.01"
                    value={gas || ""}
                    onChange={(e) => setGas(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="water">Água (R$)</Label>
                  <Input
                    id="water"
                    type="number"
                    step="0.01"
                    value={water || ""}
                    onChange={(e) => setWater(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packaging">Embalagens (R$)</Label>
                  <Input
                    id="packaging"
                    type="number"
                    step="0.01"
                    value={packaging || ""}
                    onChange={(e) => setPackaging(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="otherCosts">Outros Custos (R$)</Label>
                  <Input
                    id="otherCosts"
                    type="number"
                    step="0.01"
                    value={otherCosts || ""}
                    onChange={(e) => setOtherCosts(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold text-sm">Subtotal:</span>
                <span className="font-bold text-primary">
                  R$ {costs.operationalCost.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Custos de Produção */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Custos de Produção</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="prepTime">Tempo de Preparo (horas)</Label>
                  <Input
                    id="prepTime"
                    type="number"
                    step="0.5"
                    value={prepTime || ""}
                    onChange={(e) => setPrepTime(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Valor da Hora (R$/hora)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    value={hourlyRate || ""}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold text-sm">Subtotal:</span>
                <span className="font-bold text-primary">
                  R$ {costs.laborCost.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumo e Cálculo Final */}
        <div className="space-y-6">
          <Card className="shadow-soft sticky top-24">
            <CardHeader>
              <CardTitle>Cálculo Final</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ingredientes:</span>
                  <span className="font-semibold">R$ {costs.ingredientsCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Operacionais:</span>
                  <span className="font-semibold">R$ {costs.operationalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mão de Obra:</span>
                  <span className="font-semibold">R$ {costs.laborCost.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">Custo Total:</span>
                    <span className="font-bold text-lg">R$ {costs.totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-muted-foreground">Por Porção:</span>
                    <span className="font-semibold">R$ {costs.costPerServing.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Margem de Lucro: {profitMargin[0]}%</Label>
                <Slider
                  value={profitMargin}
                  onValueChange={setProfitMargin}
                  min={20}
                  max={200}
                  step={5}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>20%</span>
                  <span>200%</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-6 rounded-lg space-y-2 border-2 border-primary/20">
                <p className="text-sm font-medium text-muted-foreground">Preço de Venda Sugerido</p>
                <p className="text-4xl font-bold text-primary">
                  R$ {costs.sellingPrice.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Lucro: R$ {costs.profitPerServing.toFixed(2)} por porção
                </p>
              </div>

              <Button 
                onClick={saveRecipe} 
                className="w-full" 
                disabled={!recipeName || ingredients.length === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Cálculo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {recipes.length > 0 && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Cálculos Salvos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe) => {
                const ingredCost = recipe.ingredients.reduce(
                  (sum, ing) => sum + ing.cost * ing.quantity,
                  0
                );
                const opCost = recipe.electricity + recipe.gas + recipe.water + recipe.packaging + recipe.otherCosts;
                const labCost = recipe.prepTime * recipe.hourlyRate;
                const total = ingredCost + opCost + labCost;
                const perServing = total / recipe.servings;
                const selling = perServing * (1 + recipe.profitMargin / 100);

                return (
                  <div
                    key={recipe.id}
                    className="p-4 border border-border rounded-lg hover:border-primary transition-colors"
                  >
                    <div className="space-y-2">
                      <h3 className="font-semibold">{recipe.name}</h3>
                      <p className="text-xs text-muted-foreground">{recipe.category}</p>
                      <div className="pt-2 border-t space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Custo/porção:</span>
                          <span className="font-medium">R$ {perServing.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Venda sugerida:</span>
                          <span className="font-bold text-primary">R$ {selling.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Margem:</span>
                          <span>{recipe.profitMargin}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Calculadora;
