import { z } from 'zod'

export const webhookPayloadSchema = z.object({
  action: z.string(),
  api_version: z.string(),
  data: z.object({
    id: z.string()
  }),
  date_created: z.string(),
  id: z.number(),
  live_mode: z.boolean(),
  type: z.literal('payment'),
  user_id: z.string()
})

export const webhookHeadersSchema = z.object({
  'x-signature': z.string().optional(),
  'x-request-id': z.string().optional()
})

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>
export type WebhookHeaders = z.infer<typeof webhookHeadersSchema>