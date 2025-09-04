import { z } from 'zod'

// Schema para os dados retornados pelo Payment Brick no onSubmit
export const paymentBrickSubmitSchema = z.object({
  selectedPaymentMethod: z.string().optional(),
  formData: z.record(z.string(), z.unknown()).optional()
})

export type PaymentBrickSubmitData = z.infer<typeof paymentBrickSubmitSchema>