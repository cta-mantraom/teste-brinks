import { z } from 'zod'

export const webhookPayloadSchema = z.object({
  action: z.string(),
  api_version: z.string(),
  data: z.object({
    id: z.string().min(1)
  }),
  date_created: z.string(),
  id: z.number().int().positive(),
  live_mode: z.boolean(),
  type: z.literal('payment'),
  user_id: z.string()
})

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>