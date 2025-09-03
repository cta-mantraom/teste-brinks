import { z } from 'zod'

// Frontend environment schema - ONLY public variables
const frontendEnvironmentSchema = z.object({
  MERCADOPAGO_PUBLIC_KEY: z.string().min(1, 'Public key obrigatório'),
  FRONTEND_URL: z.string().url().min(1, 'Frontend URL obrigatório'),
})

type FrontendEnvironment = z.infer<typeof frontendEnvironmentSchema>

let config: FrontendEnvironment | null = null

export const getFrontendConfig = (): FrontendEnvironment => {
  if (config) return config
  
  const env = {
    MERCADOPAGO_PUBLIC_KEY: import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY,
    FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'https://memoryys.com',
  }
  
  config = frontendEnvironmentSchema.parse(env)
  return config
}

export const isProduction = import.meta.env.PROD