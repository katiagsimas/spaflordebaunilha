import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import sugarboxLogo from "@/assets/sugarbox-logo.png";
export default function Login() {
  const [nome, setNome] = useState("");
  const [nomeNegocio, setNomeNegocio] = useLocalStorage<string>("nomeNegocio", "");
  const navigate = useNavigate();
  useEffect(() => {
    if (nomeNegocio) {
      navigate("/");
    }
  }, [nomeNegocio, navigate]);
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim()) {
      setNomeNegocio(nome.trim());
      navigate("/");
    }
  };
  return <div className="min-h-screen flex items-center justify-center gradient-subtle p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center">
            <img src={sugarboxLogo} alt="SugarBox - O Sistema Completo da Confeiteira" className="h-52 w-auto object-contain" />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Confeiteira/Negócio</Label>
              <Input id="nome" type="text" placeholder="Digite seu nome ou nome do negócio" value={nome} onChange={e => setNome(e.target.value)} required className="h-12" />
            </div>
            <Button type="submit" className="w-full h-12 text-base" size="lg">
              Entrar no Sistema
            </Button>
          </form>
          <p className="text-xs text-center text-muted-foreground mt-6">
            Seus dados ficam salvos apenas no seu navegador
          </p>
        </CardContent>
      </Card>
    </div>;
}