import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "crypto";
import { z } from "zod";
import { 
  createPaymentRequestSchema,
  pixPaymentSchema, 
  cardPaymentSchema,
  type PixPayment,
  type CardPayment,
  type CreatePaymentRequest
} from "../_shared/schemas/payment.js";
import { getServerConfig } from "../_shared/config/server.js";
import { getPaymentClient } from "../_shared/clients/mpClient.js";
import { logger } from "../_shared/utils/logger.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validar body como unknown primeiro
    const rawBody = req.body as unknown;
    const requestData = createPaymentRequestSchema.parse(rawBody);
    
    // Configuração lazy load
    const config = getServerConfig();
    
    // POLÍTICA DE VALOR MÍNIMO DE CARRINHO
    // Por enquanto: cobrar exatamente o mínimo configurado (R$ 5,00)
    // Futuro: Math.max(config.MINIMUM_CART_VALUE, valorCalculadoNoServidor)
    const enforcedAmount = Math.max(config.MINIMUM_CART_VALUE, requestData.transaction_amount || 0);
    
    logger.info('Enforcing minimum cart value policy', {
      service: 'payment',
      operation: 'validation',
      requested_amount: requestData.transaction_amount,
      enforced_amount: enforcedAmount,
      minimum_value: config.MINIMUM_CART_VALUE
    });
    
    // Determinar tipo de pagamento
    const isPix = requestData.payment_method_id === 'pix';
    
    // Log diagnóstico do payload recebido
    logger.info('Payment request received', {
      service: 'payment',
      operation: 'create_request',
      payment_method_id: requestData.payment_method_id,
      isPix,
      amount: requestData.transaction_amount
    });
    
    // Preparar dados específicos por tipo de pagamento
    let paymentData: PixPayment | CardPayment;
    
    if (isPix) {
      // Validar e construir payload PIX com valor enforced
      // Garantir nome/sobrenome para melhorar pontuação
      const pixPayer = {
        ...requestData.payer,
        first_name: requestData.payer.first_name || 'Cliente',
        last_name: requestData.payer.last_name || 'Brinks'
      };
      
      paymentData = pixPaymentSchema.parse({
        transaction_amount: enforcedAmount,
        payment_method_id: 'pix',
        payer: pixPayer,
        description: 'Checkout Brinks',
        installments: 1
      });
    } else {
      // Validar token obrigatório para cartão
      if (!requestData.token) {
        logger.error('Card payment without token', {
          service: 'payment',
          operation: 'validation',
          payment_method_id: requestData.payment_method_id
        });
        
        return res.status(400).json({
          error: "Token do cartão é obrigatório para pagamentos com cartão"
        });
      }
      
      // Validar e construir payload Cartão com valor enforced
      paymentData = cardPaymentSchema.parse({
        transaction_amount: enforcedAmount,
        payment_method_id: requestData.payment_method_id,
        token: requestData.token,
        issuer_id: requestData.issuer_id,
        payer: requestData.payer,
        description: 'Checkout Brinks',
        installments: requestData.installments || 1
      });
    }

    // Construir items para antifraude/qualidade
    const items = (requestData.items && requestData.items.length > 0)
      ? requestData.items
      : [{
          id: 'default',
          title: 'Checkout Brinks',
          description: 'Pagamento via Checkout Brinks',
          category_id: 'services',
          quantity: 1,
          unit_price: enforcedAmount
        }];

    // Construir payload para SDK MercadoPago
    const mercadoPagoPayload: Record<string, any> = {
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
      // Adiciona detalhes do carrinho para melhorar pontuação/antifraude
      additional_info: {
        items
      },
      notification_url: `${config.FRONTEND_URL}/api/webhooks/mercadopago`,
      statement_descriptor: "CHECKOUT BRINKS",
      external_reference: `brinks-${Date.now()}`
    };
    
    // Incluir campos específicos para pagamentos com cartão
    if (!isPix && 'token' in paymentData) {
      const cardData = paymentData as CardPayment;
      Object.assign(mercadoPagoPayload, {
        token: cardData.token,
        ...(cardData.issuer_id && { issuer_id: cardData.issuer_id })
      });
      
      logger.payment('card_payment_prepared', 'token_masked', {
        payment_method_id: cardData.payment_method_id,
        hasIssuer: !!cardData.issuer_id,
        hasToken: true
      });
    }

    // Device fingerprint para antifraude
    if (requestData.device_id) {
      mercadoPagoPayload.device = {
        fingerprint: {
          os: "OTHER",
          system_version: "UNKNOWN",
          ram: 0,
          disk_space: 0,
          model: "UNKNOWN",
          free_disk_space: 0,
          vendor_ids: [{
            name: "device_fingerprint_id",
            value: requestData.device_id
          }]
        }
      };
      logger.info('Device fingerprint included', {
        service: 'payment',
        operation: 'fingerprint',
        hasDeviceId: true
      });
    }
    
    // Log do payload final (sem dados sensíveis)
    logger.payment('sending_to_mercadopago', 'N/A', {
      payload: {
        payment_method_id: mercadoPagoPayload.payment_method_id,
        hasToken: !!('token' in mercadoPagoPayload),
        issuer_id: 'issuer_id' in mercadoPagoPayload ? mercadoPagoPayload.issuer_id : undefined,
        amount: mercadoPagoPayload.transaction_amount,
        itemsCount: items.length,
        hasAdditionalInfo: true,
        hasDeviceFingerprint: !!requestData.device_id
      }
    });
    
    // Obter cliente SDK e criar pagamento
    const paymentClient = getPaymentClient();
    const response = await paymentClient.create({
      body: mercadoPagoPayload,
      requestOptions: {
        idempotencyKey: randomUUID(),
        ...(requestData.device_id && {
          customHeaders: {
            'X-Device-Id': requestData.device_id
          }
        })
      }
    });

    // Validar resposta
    if (!response || !response.id) {
      throw new Error('Invalid response from MercadoPago SDK');
    }

    // Log de sucesso
    logger.payment('payment_created', response.id.toString(), {
      status: response.status,
      status_detail: response.status_detail,
      payment_method_id: response.payment_method_id
    });
    
    // Return payment data to frontend
    return res.status(200).json({
      id: response.id,
      status: response.status,
      status_detail: response.status_detail,
      point_of_interaction: response.point_of_interaction,
    });
  } catch (error: unknown) {
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

    // Tratar erro do SDK MercadoPago
    if (error instanceof Error && 'status' in error) {
      const mpError = error as { status?: number; message?: string; cause?: unknown[] };
      logger.error('MercadoPago SDK error', {
        service: 'payment',
        operation: 'mercadopago_sdk',
        status: mpError.status,
        errorMessage: mpError.message
      }, error);
      
      return res.status(mpError.status || 500).json({
        error: mpError.message || "Falha no processamento do pagamento",
        cause: mpError.cause
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