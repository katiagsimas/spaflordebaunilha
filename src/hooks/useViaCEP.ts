import { useState } from "react";
import { toast } from "sonner";

interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

interface EnderecoData {
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export function useViaCEP() {
  const [loading, setLoading] = useState(false);

  const buscarCEP = async (cep: string): Promise<EnderecoData | null> => {
    // Remove caracteres não numéricos
    const cepLimpo = cep.replace(/\D/g, "");

    // Valida se tem 8 dígitos
    if (cepLimpo.length !== 8) {
      toast.error("CEP inválido. Digite 8 dígitos.");
      return null;
    }

    setLoading(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data: ViaCEPResponse = await response.json();

      if (data.erro) {
        toast.error("CEP não encontrado.");
        setLoading(false);
        return null;
      }

      toast.success("CEP encontrado!");
      setLoading(false);

      return {
        endereco: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        estado: data.uf,
      };
    } catch (error) {
      toast.error("Erro ao buscar CEP. Tente novamente.");
      setLoading(false);
      return null;
    }
  };

  return { buscarCEP, loading };
}
