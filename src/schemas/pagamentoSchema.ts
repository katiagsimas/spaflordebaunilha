import { z } from 'zod';

/**
 * Schema de validação para pagamentos
 */
export const pagamentoSchema = z.object({
  valor_pago: z.number()
    .positive('Valor deve ser positivo')
    .max(999999.99, 'Valor máximo excedido'),
  
  data_pagamento: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  
  banco_id: z.string()
    .uuid('Banco inválido')
    .optional(),
  
  tipo_documento_id: z.string()
    .uuid('Tipo de documento inválido')
    .optional(),
  
  observacao: z.string()
    .max(500, 'Observação muito longa (máximo 500 caracteres)')
    .optional(),
});

export type PagamentoFormData = z.infer<typeof pagamentoSchema>;
