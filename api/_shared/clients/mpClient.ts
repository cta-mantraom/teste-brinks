import MercadoPago, { Payment } from 'mercadopago';
import { getServerConfig } from '../config/server';

let mpClient: MercadoPago | null = null;
let paymentClient: Payment | null = null;

/**
 * Inicializa o cliente do MercadoPago de forma lazy
 * Singleton pattern para reutilização
 */
function initializeClient(): void {
  if (mpClient) return;
  
  const config = getServerConfig();
  
  mpClient = new MercadoPago({
    accessToken: config.MERCADOPAGO_ACCESS_TOKEN,
    options: {
      timeout: 10000,
      idempotencyKey: 'brinks-integration'
    }
  });
  
  paymentClient = new Payment(mpClient);
}

/**
 * Retorna o cliente de pagamento do MercadoPago
 * Inicializa se necessário (lazy loading)
 */
export function getPaymentClient(): Payment {
  if (!paymentClient) {
    initializeClient();
  }
  
  if (!paymentClient) {
    throw new Error('Failed to initialize MercadoPago payment client');
  }
  
  return paymentClient;
}

/**
 * Retorna o cliente principal do MercadoPago
 * Inicializa se necessário (lazy loading)
 */
export function getMercadoPagoClient(): MercadoPago {
  if (!mpClient) {
    initializeClient();
  }
  
  if (!mpClient) {
    throw new Error('Failed to initialize MercadoPago client');
  }
  
  return mpClient;
}