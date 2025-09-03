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

// Webhook signature validation
export const validateWebhookSignature = async (
  payload: string,
  signature: string | undefined
): Promise<boolean> => {
  if (!signature) return false
  
  try {
    const config = getServerConfig()
    
    // Use Web Crypto API for Vercel Edge Runtime
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(config.MERCADOPAGO_WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    )
    
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    return signature === `sha256=${expectedSignature}`
  } catch (error) {
    console.error('Error validating webhook signature:', error)
    return false
  }
}