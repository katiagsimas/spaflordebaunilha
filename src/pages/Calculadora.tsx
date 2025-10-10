import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Calculator as CalcIcon } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

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
  ingredients: Ingredient[];
  servings: number;
  laborCost: number;
  overhead: number;
}

const Calculadora = () => {
  const [recipes, setRecipes] = useLocalStorage<Recipe[]>("recipes", []);
  const [recipeName, setRecipeName] = useState("");
  const [servings, setServings] = useState(1);
  const [laborCost, setLaborCost] = useState(0);
  const [overhead, setOverhead] = useState(0);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    cost: 0,
    quantity: 0,
    unit: "un",
  });

  const addIngredient = () => {
    if (newIngredient.name && newIngredient.cost > 0) {
      setIngredients([
        ...ingredients,
        { ...newIngredient, id: Date.now().toString() },
      ]);
      setNewIngredient({ name: "", cost: 0, quantity: 0, unit: "un" });
    }
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter((ing) => ing.id !== id));
  };

  const calculateTotal = () => {
    const ingredientsCost = ingredients.reduce(
      (sum, ing) => sum + ing.cost * ing.quantity,
      0
    );
    const total = ingredientsCost + laborCost + overhead;
    return { ingredientsCost, total, perServing: total / servings };
  };

  const saveRecipe = () => {
    if (recipeName && ingredients.length > 0) {
      const newRecipe: Recipe = {
        id: Date.now().toString(),
        name: recipeName,
        ingredients,
        servings,
        laborCost,
        overhead,
      };
      setRecipes([...recipes, newRecipe]);
      setRecipeName("");
      setIngredients([]);
      setServings(1);
      setLaborCost(0);
      setOverhead(0);
    }
  };

  const { ingredientsCost, total, perServing } = calculateTotal();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Calculadora de Custos"
        description="Calcule o custo de produção das suas receitas"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader>
            <CardTitle>Nova Receita</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="recipeName">Nome da Receita</Label>
                <Input
                  id="recipeName"
                  placeholder="Ex: Bolo de Chocolate"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="servings">Porções</Label>
                <Input
                  id="servings"
                  type="number"
                  min="1"
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Ingredientes</h3>
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
                  placeholder="Custo (R$)"
                  value={newIngredient.cost || ""}
                  onChange={(e) =>
                    setNewIngredient({ ...newIngredient, cost: Number(e.target.value) })
                  }
                />
                <Input
                  type="number"
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
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
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
                        <p className="font-medium">{ing.name}</p>
                        <p className="text-sm text-muted-foreground">
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
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="labor">Custo de Mão de Obra (R$)</Label>
                <Input
                  id="labor"
                  type="number"
                  value={laborCost || ""}
                  onChange={(e) => setLaborCost(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="overhead">Despesas Gerais (R$)</Label>
                <Input
                  id="overhead"
                  type="number"
                  value={overhead || ""}
                  onChange={(e) => setOverhead(Number(e.target.value))}
                />
              </div>
            </div>

            <Button onClick={saveRecipe} className="w-full" disabled={!recipeName || ingredients.length === 0}>
              Salvar Receita
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalcIcon className="h-5 w-5 text-primary" />
              Resumo de Custos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ingredientes:</span>
                <span className="font-semibold">R$ {ingredientsCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mão de Obra:</span>
                <span className="font-semibold">R$ {laborCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Despesas Gerais:</span>
                <span className="font-semibold">R$ {overhead.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Custo Total:</span>
                  <span className="font-bold text-primary">R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-muted-foreground">Por Porção:</span>
                  <span className="font-semibold text-accent">R$ {perServing.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-secondary p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Sugestão de Preço</p>
              <p className="text-2xl font-bold text-primary">
                R$ {(perServing * 3).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                Margem de 200% por porção
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {recipes.length > 0 && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Receitas Salvas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe) => {
                const totalCost = recipe.ingredients.reduce(
                  (sum, ing) => sum + ing.cost * ing.quantity,
                  0
                ) + recipe.laborCost + recipe.overhead;
                const costPerServing = totalCost / recipe.servings;

                return (
                  <div
                    key={recipe.id}
                    className="p-4 border border-border rounded-lg hover:border-primary transition-colors"
                  >
                    <h3 className="font-semibold mb-2">{recipe.name}</h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">
                        {recipe.ingredients.length} ingredientes
                      </p>
                      <p className="text-muted-foreground">
                        {recipe.servings} porções
                      </p>
                      <p className="font-semibold text-primary mt-2">
                        R$ {costPerServing.toFixed(2)}/porção
                      </p>
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
