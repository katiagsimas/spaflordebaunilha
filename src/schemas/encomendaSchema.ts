import { z } from 'zod';

/**
 * Schema de validação para encomendas
 */
export const encomendaSchema = z.object({
  cliente: z.string()
    .trim()
    .min(1, 'Nome do cliente é obrigatório')
    .max(100, 'Nome muito longo (máximo 100 caracteres)'),
  
  data_pedido: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  
  data_entrega: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  
  valor: z.number()
    .positive('Valor deve ser positivo')
    .max(999999.99, 'Valor máximo excedido'),
  
  quantidade: z.number()
    .positive('Quantidade deve ser positiva')
    .int('Quantidade deve ser um número inteiro')
    .max(9999, 'Quantidade máxima: 9999'),
  
  status: z.enum(['pendente', 'confirmado', 'em_producao', 'pronto', 'entregue', 'cancelado']),
  
  observacoes: z.string()
    .max(1000, 'Observações muito longas (máximo 1000 caracteres)')
    .optional(),
  
  cep: z.string()
    .regex(/^\d{8}$/, 'CEP deve ter 8 dígitos')
    .optional()
    .or(z.literal('')),
  
  endereco: z.string()
    .max(200, 'Endereço muito longo')
    .optional(),
  
  bairro: z.string()
    .max(100, 'Bairro muito longo')
    .optional(),
  
  cidade: z.string()
    .max(100, 'Cidade muito longa')
    .optional(),
  
  estado: z.string()
    .max(2, 'Estado deve ter 2 caracteres')
    .optional(),
  
  telefone: z.string()
    .max(20, 'Telefone muito longo')
    .optional(),
});

export type EncomendaFormData = z.infer<typeof encomendaSchema>;
