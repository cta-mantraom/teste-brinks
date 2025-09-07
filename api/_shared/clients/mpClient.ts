import { MercadoPagoConfig, Payment } from 'mercadopago';
import { getServerConfig } from '../config/server.js';

let mpConfig: MercadoPagoConfig | null = null;
let paymentClient: Payment | null = null;

/**
 * Inicializa o cliente do MercadoPago de forma lazy
 * Singleton pattern para reutilização
 */
function initializeClient(): void {
  if (paymentClient) return;
  
  const config = getServerConfig();
  
  // Cria a configuração do SDK v2
  mpConfig = new MercadoPagoConfig({
    accessToken: config.MERCADOPAGO_ACCESS_TOKEN,
    options: {
      timeout: 10000
    }
  });
  
  // Cria o cliente de pagamento
  paymentClient = new Payment(mpConfig);
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