import { getServerConfig } from '../config/server'

export const validateWebhookSignature = async (
  payload: string,
  signature: string | undefined
): Promise<boolean> => {
  if (!signature) return false

  try {
    const config = getServerConfig() // Lazy load config
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
    console.error('[CRYPTO] Falha na validação de assinatura:', error)
    return false
  }
}