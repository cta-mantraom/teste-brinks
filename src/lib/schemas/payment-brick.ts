import { z } from 'zod'

// Schema para os dados do pagador no formData
const paymentBrickPayerSchema = z.object({
  email: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  identification: z.object({
    type: z.string().optional(),
    number: z.string().optional()
  }).optional(),
  phone: z.object({
    area_code: z.string().optional(),
    number: z.string().optional()
  }).optional()
})

// Schema para formData do Payment Brick
const paymentBrickFormDataSchema = z.object({
  email: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  identification: z.object({
    type: z.string().optional(),
    number: z.string().optional()
  }).optional(),
  phone: z.object({
    area_code: z.string().optional(),
    number: z.string().optional()
  }).optional(),
  payer: paymentBrickPayerSchema.optional(),
  installments: z.number().optional()
})

// Schema para os dados retornados pelo Payment Brick no onSubmit
export const paymentBrickSubmitSchema = z.object({
  selectedPaymentMethod: z.string().optional(),
  formData: paymentBrickFormDataSchema.optional()
})

export type PaymentBrickSubmitData = z.infer<typeof paymentBrickSubmitSchema>
export type PaymentBrickFormData = z.infer<typeof paymentBrickFormDataSchema>