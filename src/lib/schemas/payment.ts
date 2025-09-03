import { z } from 'zod'

export const paymentFormDataSchema = z.object({
  transaction_amount: z.number().positive('Valor deve ser positivo'),
  payment_method_id: z.enum(['pix', 'credit_card', 'debit_card']),
  payer: z.object({
    email: z.string().email('Email inválido'),
    identification: z.object({
      type: z.enum(['CPF', 'CNPJ']),
      number: z.string().min(11, 'Número do documento inválido')
    })
  })
})

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

export type PaymentFormData = z.infer<typeof paymentFormDataSchema>
export type PixPaymentResponse = z.infer<typeof pixPaymentResponseSchema>
export type PaymentStatus = z.infer<typeof paymentStatusSchema>