import { z } from 'zod'

// Schema para dados do pagador
export const payerSchema = z.object({
  first_name: z.string().min(1, 'Nome obrigatório'),
  last_name: z.string().min(1, 'Sobrenome obrigatório'),
  email: z.string().email('Email inválido'),
  identification: z.object({
    type: z.literal('CPF'),
    number: z.string()
      .regex(/^\d{11}$/, 'CPF deve ter 11 dígitos')
      .transform(val => val.replace(/\D/g, ''))
  }),
  phone: z.object({
    area_code: z.string()
      .min(2, 'DDD obrigatório')
      .max(2, 'DDD deve ter 2 dígitos'),
    number: z.string()
      .min(8, 'Telefone deve ter no mínimo 8 dígitos')
      .max(9, 'Telefone deve ter no máximo 9 dígitos')
  })
})

// Schema para dados do formulário de pagamento
export const paymentFormDataSchema = z.object({
  transaction_amount: z.number().positive('Valor deve ser positivo'),
  payment_method_id: z.enum(['pix', 'credit_card', 'debit_card']),
  payer: payerSchema,
  description: z.string().default('Checkout Brinks'),
  installments: z.number().min(1).default(1)
})

// Schema para resposta do pagamento PIX
export const pixPaymentResponseSchema = z.object({
  id: z.number(),
  status: z.string(),
  status_detail: z.string(),
  point_of_interaction: z.object({
    transaction_data: z.object({
      qr_code: z.string(),
      qr_code_base64: z.string(),
      ticket_url: z.string().url()
    })
  }).optional()
})

// Enum para status de pagamento
export const paymentStatusSchema = z.enum([
  'pending',
  'approved', 
  'authorized',
  'in_process',
  'in_mediation',
  'rejected',
  'cancelled',
  'refunded',
  'charged_back'
])

// Types exportados
export type Payer = z.infer<typeof payerSchema>
export type PaymentFormData = z.infer<typeof paymentFormDataSchema>
export type PixPaymentResponse = z.infer<typeof pixPaymentResponseSchema>
export type PaymentStatus = z.infer<typeof paymentStatusSchema>