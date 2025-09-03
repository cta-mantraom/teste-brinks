import { initMercadoPago } from '@mercadopago/sdk-react'
import { getFrontendConfig } from './environment'

let isInitialized = false

export const initializeMercadoPago = (): void => {
  if (isInitialized) return
  
  const config = getFrontendConfig()
  initMercadoPago(config.MERCADOPAGO_PUBLIC_KEY, {
    locale: 'pt-BR'
  })
  
  isInitialized = true
}

// Frontend config - only public data
export const getMercadoPagoPublicConfig = () => {
  const config = getFrontendConfig()
  return {
    publicKey: config.MERCADOPAGO_PUBLIC_KEY,
    frontendUrl: config.FRONTEND_URL,
    notificationUrl: `${config.FRONTEND_URL}/api/webhooks/mercadopago`
  }
}