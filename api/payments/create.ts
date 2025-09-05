import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";
import { randomUUID } from "crypto";
import { z } from "zod";
import { 
  pixPaymentSchema, 
  cardPaymentSchema,
  type PixPayment,
  type CardPayment 
} from "../_shared/schemas/payment";
import { getServerConfig } from "../_shared/config/server";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Schema para validar request body inicial
    const requestBodySchema = z.object({
      payment_method_id: z.enum(['pix', 'credit_card', 'debit_card'])
    }).passthrough();
    
    // Validar body como unknown primeiro
    const rawBody = req.body as unknown;
    const { payment_method_id } = requestBodySchema.parse(rawBody);
    
    // Determinar tipo de pagamento
    const isPix = payment_method_id === 'pix';
    
    // Validar com schema específico (regra: sempre Zod primeiro)
    const paymentData: PixPayment | CardPayment = isPix
      ? pixPaymentSchema.parse(rawBody)
      : cardPaymentSchema.parse(rawBody);

    // Configuração lazy load
    const config = getServerConfig();

    // Construir payload para MercadoPago (tipagem explícita)
    const mercadoPagoPayload = {
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

    // Return payment data to frontend
    return res.status(200).json({
      id: response.data.id,
      status: response.data.status,
      status_detail: response.data.status_detail,
      point_of_interaction: response.data.point_of_interaction,
    });
  } catch (error: unknown) { // NUNCA any, sempre unknown
    console.error("[PAYMENT_CREATE] Erro:", error);
    
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
      console.error("[MERCADOPAGO] Erro da API:", mpError);
      
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