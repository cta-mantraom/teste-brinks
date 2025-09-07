import { z } from 'zod'

// Schema Base PIX (email obrigatório, resto opcional)
export const pixPayerSchema = z.object({
  email: z.string().email('Email inválido'),
  first_name: z.string().optional().default(''),
  last_name: z.string().optional().default(''),
  entity_type: z.enum(['individual', 'association']).default('individual'),
  type: z.literal('customer').default('customer'),
  identification: z.object({
    type: z.literal('CPF').default('CPF'),
    number: z.string().optional().default('')
  }).optional(),
  phone: z.object({
    area_code: z.string().optional().default(''),
    number: z.string().optional().default('')
  }).optional()
})

// Schema Completo Cartão (todos campos obrigatórios)
export const cardPayerSchema = z.object({
  first_name: z.string().min(1, 'Nome obrigatório'),
  last_name: z.string().min(1, 'Sobrenome obrigatório'),
  email: z.string().email('Email inválido'),
  entity_type: z.enum(['individual', 'association']).default('individual'),
  type: z.literal('customer').default('customer'),
  identification: z.object({
    type: z.literal('CPF'),
    number: z.string()
      .regex(/^\d{11}$/, 'CPF deve ter 11 dígitos')
      .transform(val => val.replace(/\D/g, ''))
  }),
  phone: z.object({
    area_code: z.string().length(2, 'DDD deve ter 2 dígitos'),
    number: z.string().min(8).max(9, 'Telefone deve ter 8-9 dígitos')
  })
})

// Schema PIX Payment
export const pixPaymentSchema = z.object({
  transaction_amount: z.number().positive('Valor deve ser positivo'),
  payment_method_id: z.literal('pix'),
  payer: pixPayerSchema,
  description: z.string().default('Checkout Brinks'),
  installments: z.literal(1).default(1)
})

// Schema Card Payment - INCLUI TOKEN OBRIGATÓRIO
export const cardPaymentSchema = z.object({
  transaction_amount: z.number().positive('Valor deve ser positivo'),
  payment_method_id: z.string().min(1, 'Bandeira do cartão obrigatória'), // Bandeira: master, visa, elo, etc
  token: z.string().min(1, 'Token do cartão é obrigatório'), // TOKEN OBRIGATÓRIO
  issuer_id: z.number().optional(), // Banco emissor (opcional)
  payer: cardPayerSchema,
  description: z.string().default('Checkout Brinks'),
  installments: z.number().int().min(1).max(12).default(1)
})

// Types exportados (inferidos do Zod, nunca manuais)
export type PixPayment = z.infer<typeof pixPaymentSchema>
export type CardPayment = z.infer<typeof cardPaymentSchema>
export type PixPayer = z.infer<typeof pixPayerSchema>
export type CardPayer = z.infer<typeof cardPayerSchema>