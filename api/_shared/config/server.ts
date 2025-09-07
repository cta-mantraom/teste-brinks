import { z } from 'zod'

// Schema de validação PRIMEIRO (regra: sempre Zod primeiro)
const serverEnvironmentSchema = z.object({
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1, 'Access token obrigatório'),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().min(1, 'Webhook secret obrigatório'),
  FRONTEND_URL: z.string().url('FRONTEND_URL deve ser uma URL válida'),
  // Valor mínimo do carrinho - validação robusta com preprocess
  // Default: R$ 5,00 (valor mínimo permitido)
  MINIMUM_CART_VALUE: z.preprocess(
    (val) => val ?? 5,
    z.coerce.number().min(5, 'Valor mínimo: R$ 5,00')
  ),
})

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>

// Lazy loading com cache (singleton pattern)
let serverConfig: ServerEnvironment | null = null

export const getServerConfig = (): ServerEnvironment => {
  // Retorna cache se já inicializado
  if (serverConfig) return serverConfig

  // Configuração lazy - acesso ao process.env APENAS aqui
  const rawEnv = {
    MERCADOPAGO_ACCESS_TOKEN: getEnvVar('MERCADOPAGO_ACCESS_TOKEN'),
    MERCADOPAGO_WEBHOOK_SECRET: getEnvVar('MERCADOPAGO_WEBHOOK_SECRET'),
    FRONTEND_URL: getEnvVar('FRONTEND_URL') || getEnvVar('VITE_FRONTEND_URL'),
    MINIMUM_CART_VALUE: getEnvVar('MINIMUM_CART_VALUE'),
  }

  // Se FRONTEND_URL não existir, falha explícita (100% produção)
  if (!rawEnv.FRONTEND_URL) {
    throw new Error('[FATAL] FRONTEND_URL não configurada. Configure na Vercel: https://memoryys.com')
  }

  // Validação Zod SEMPRE
  serverConfig = serverEnvironmentSchema.parse(rawEnv)
  return serverConfig
}

// Helper para acessar env (centralizado, nunca direto)
const getEnvVar = (key: string): string | undefined => {
  // Único ponto de acesso ao process.env em toda aplicação
  return process.env[key]
}