/**
 * Validação de Senha — Caixa de Açúcar
 * 
 * Regras:
 * 1. Mínimo de 6 caracteres
 * 2. Pelo menos uma letra maiúscula (A–Z)
 * 3. Pelo menos uma letra minúscula (a–z)
 * 4. Pelo menos um número (0–9)
 * 5. Pelo menos um símbolo especial: @ # $ % & * _ - + ! ?
 * 6. Não pode conter o nome, e-mail ou o termo "caixa", "acucar", "kasimas" (case-insensitive)
 * 7. Sem prazo de expiração
 */

interface ValidacaoSenhaInput {
  password: string;
  email?: string;
  name?: string;
}

interface ValidacaoSenhaResult {
  valid: boolean;
  message: string;
}

export function validarSenhaForte(input: ValidacaoSenhaInput): ValidacaoSenhaResult {
  const senha = input.password || "";
  const email = input.email || "";
  const nome = input.name || "";

  // Expressão regular para validar força da senha
  const regexSenhaForte = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%&*_\-+!?])[A-Za-z\d@#$%&*_\-+!?]{6,}$/;

  // Verifica se contém partes do nome, e-mail ou palavras proibidas
  const palavrasProibidas = [
    "caixa", 
    "acucar", 
    "kasimas", 
    nome.toLowerCase(), 
    email.split("@")[0].toLowerCase()
  ].filter(palavra => palavra && palavra.length > 0);
  
  const contemProibidas = palavrasProibidas.some(palavra => 
    senha.toLowerCase().includes(palavra)
  );

  // Validação principal
  if (!regexSenhaForte.test(senha)) {
    return {
      valid: false,
      message: "Sua senha deve ter no mínimo 6 caracteres e conter: letra maiúscula, letra minúscula, número e símbolo (@ # $ % & * _ - + ! ?)."
    };
  }

  if (contemProibidas) {
    return {
      valid: false,
      message: "Sua senha não pode conter partes do seu nome, e-mail ou termos como 'caixa', 'acucar' ou 'kasimas'."
    };
  }

  // Se tudo estiver certo
  return {
    valid: true,
    message: "Senha válida!"
  };
}
