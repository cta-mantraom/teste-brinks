import { z } from 'zod'

// Server environment schema - Private variables (NEVER expose to frontend)
const serverEnvironmentSchema = z.object({
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1, 'Access token obrigatório'),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().min(1, 'Webhook secret obrigatório'),
  FRONTEND_URL: z.string().url().min(1, 'Frontend URL obrigatório'),
})

type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>

let serverConfig: ServerEnvironment | null = null

// This function should ONLY be called in API routes/server-side code
export const getServerConfig = (): ServerEnvironment => {
  if (serverConfig) return serverConfig
  
  // These environment variables are only available on the server
  const env = {
    MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN,
    MERCADOPAGO_WEBHOOK_SECRET: process.env.MERCADOPAGO_WEBHOOK_SECRET,
    FRONTEND_URL: process.env.VITE_FRONTEND_URL || 'https://memoryys.com',
  }
  
  serverConfig = serverEnvironmentSchema.parse(env)
  return serverConfig
}