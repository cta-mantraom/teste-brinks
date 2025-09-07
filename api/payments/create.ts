import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";
import { randomUUID } from "crypto";
import { z } from "zod";
import { 
  pixPaymentSchema, 
  cardPaymentSchema,
  type PixPayment,
  type CardPayment 
} from "../_shared/schemas/payment.js";
import { getServerConfig } from "../_shared/config/server.js";
import { logger } from "../_shared/utils/logger.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Schema para validar request body inicial
    const requestBodySchema = z.object({
      payment_method_id: z.string().min(1) // Pode ser "pix" ou bandeira do cartão
    }).passthrough();
    
    // Validar body como unknown primeiro
    const rawBody = req.body as unknown;
    const { payment_method_id } = requestBodySchema.parse(rawBody);
    
    // Determinar tipo de pagamento
    const isPix = payment_method_id === 'pix';
    
    // Log diagnóstico do payload recebido
    logger.info('Payment request received', {
      service: 'payment',
      operation: 'create_request',
      payment_method_id,
      isPix
    });
    
    // Validar com schema específico (regra: sempre Zod primeiro)
    const paymentData: PixPayment | CardPayment = isPix
      ? pixPaymentSchema.parse(rawBody)
      : cardPaymentSchema.parse(rawBody);

    // Configuração lazy load
    const config = getServerConfig();

    // Construir payload para MercadoPago (tipagem explícita)
    const mercadoPagoPayload: Record<string, unknown> = {
      transaction_amount: paymentData.transaction_amount,
      payment_method_id: paymentData.payment_method_id,
      description: paymentData.description,
      installments: paymentData.installments,
      payer: {
        email: paymentData.payer.email,
        entity_type: paymentData.payer.entity_type,
        type: paymentData.payer.type,
        ...(paymentData.payer.first_name && {
          first_name: paymentData.payer.first_name
        }),
        ...(paymentData.payer.last_name && {
          last_name: paymentData.payer.last_name
        }),
        ...(paymentData.payer.identification?.number && {
          identification: {
            type: 'CPF',
            number: paymentData.payer.identification.number
          }
        }),
        ...(paymentData.payer.phone?.number && {
          phone: {
            area_code: paymentData.payer.phone.area_code,
            number: paymentData.payer.phone.number
          }
        })
      },
      notification_url: `${config.FRONTEND_URL}/api/webhooks/mercadopago`,
      statement_descriptor: "CHECKOUT BRINKS",
      external_reference: `brinks-${Date.now()}`
    };
    
    // CRÍTICO: Incluir campos específicos para pagamentos com cartão
    if (!isPix && 'token' in paymentData) {
      const cardData = paymentData as CardPayment;
      mercadoPagoPayload.token = cardData.token;
      
      logger.payment('card_payment_prepared', cardData.token.substring(0, 10) + '...', {
        payment_method_id: cardData.payment_method_id, // Bandeira
        hasIssuer: !!cardData.issuer_id
      });
      
      if (cardData.issuer_id) {
        mercadoPagoPayload.issuer_id = cardData.issuer_id;
      }
    }

    // Log completo do payload final
    logger.payment('sending_to_mercadopago', 'N/A', {
      payload: {
        payment_method_id: mercadoPagoPayload.payment_method_id,
        hasToken: !!mercadoPagoPayload.token,
        issuer_id: mercadoPagoPayload.issuer_id,
        amount: mercadoPagoPayload.transaction_amount
      }
    });
    
    // Create payment on MercadoPago servers
    const response = await axios.post(
      "https://api.mercadopago.com/v1/payments",
      mercadoPagoPayload,
      {
        headers: {
          Authorization: `Bearer ${config.MERCADOPAGO_ACCESS_TOKEN}`,
          "X-Idempotency-Key": randomUUID(),
          "Content-Type": "application/json",
        },
      }
    );

    // Log de sucesso
    logger.payment('payment_created', response.data.id, {
      status: response.data.status,
      status_detail: response.data.status_detail,
      payment_method_id: response.data.payment_method_id
    });
    
    // Return payment data to frontend
    return res.status(200).json({
      id: response.data.id,
      status: response.data.status,
      status_detail: response.data.status_detail,
      point_of_interaction: response.data.point_of_interaction,
    });
  } catch (error: unknown) { // NUNCA any, sempre unknown
    logger.error('Payment creation failed', { 
      service: 'payment',
      operation: 'create'
    }, error);
    
    // Tratar erro Zod
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Dados de pagamento inválidos",
        details: error.issues,
      });
    }

    // Tratar erro Axios
    if (axios.isAxiosError(error)) {
      const mpError = error.response?.data;
      logger.error('MercadoPago API error', {
        service: 'payment',
        operation: 'mercadopago_api',
        status: error.response?.status,
        errorCode: mpError?.cause?.[0]?.code,
        errorMessage: mpError?.message
      }, error);
      
      return res.status(error.response?.status || 500).json({
        error: mpError?.message || mpError?.error || "Falha no processamento",
        cause: mpError?.cause,
        details: mpError
      });
    }

    // Erro genérico
    const message = error instanceof Error ? error.message : 'Erro interno';
    return res.status(500).json({ 
      error: message,
      type: "server_error"
    });
  }
}