import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";
import { randomUUID } from "crypto";
import { z } from "zod";
import { paymentFormDataSchema } from "../../src/lib/schemas/payment";
import { getServerConfig } from "../../src/lib/config/server-environment";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Para PIX, os dados do pagador são opcionais
    const isPix = req.body.payment_method_id === 'pix';
    
    // Validate input with Zod - relaxar validação para PIX
    let paymentData;
    if (isPix) {
      // Para PIX, apenas email é obrigatório
      const pixPaymentSchema = z.object({
        transaction_amount: z.number().positive('Valor deve ser positivo'),
        payment_method_id: z.enum(['pix', 'credit_card', 'debit_card']),
        payer: z.object({
          email: z.string().email('Email inválido'),
          first_name: z.string().optional().default(''),
          last_name: z.string().optional().default(''),
          entity_type: z.enum(['individual', 'association']).optional().default('individual'),
          type: z.string().optional().default('customer'),
          identification: z.object({
            type: z.string().optional().default('CPF'),
            number: z.string().optional().default('')
          }).optional(),
          phone: z.object({
            area_code: z.string().optional().default(''),
            number: z.string().optional().default('')
          }).optional()
        }),
        description: z.string().optional().default('Checkout Brinks'),
        installments: z.number().optional().default(1)
      });
      
      paymentData = pixPaymentSchema.parse(req.body);
    } else {
      // Para cartões, usar o schema completo com entity_type
      paymentData = paymentFormDataSchema.parse(req.body);
    }

    // Get server config with ACCESS_TOKEN
    const config = getServerConfig();

    // Format payer data for MercadoPago API
    const mercadoPagoPayload: Record<string, unknown> = {
      transaction_amount: paymentData.transaction_amount,
      payment_method_id: paymentData.payment_method_id,
      description: paymentData.description || "Checkout Brinks",
      installments: paymentData.installments || 1,
      payer: {
        email: paymentData.payer.email,
        entity_type: (paymentData.payer as any).entity_type || 'individual', // Obrigatório
        type: (paymentData.payer as any).type || 'customer',
      },
      notification_url: `${config.FRONTEND_URL}/api/webhooks/mercadopago`,
      statement_descriptor: "CHECKOUT BRINKS",
      external_reference: `brinks-${Date.now()}`
    };
    
    // Adicionar dados completos do pagador se disponíveis
    if (paymentData.payer.first_name) {
      (mercadoPagoPayload.payer as Record<string, unknown>).first_name = paymentData.payer.first_name;
    }
    if (paymentData.payer.last_name) {
      (mercadoPagoPayload.payer as Record<string, unknown>).last_name = paymentData.payer.last_name;
    }
    if (paymentData.payer.identification?.number) {
      (mercadoPagoPayload.payer as Record<string, unknown>).identification = {
        type: paymentData.payer.identification.type,
        number: paymentData.payer.identification.number
      };
    }
    if (paymentData.payer.phone?.number) {
      (mercadoPagoPayload.payer as Record<string, unknown>).phone = {
        area_code: paymentData.payer.phone.area_code,
        number: paymentData.payer.phone.number
      };
    }

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
  } catch (error: any) {
    console.error("Payment error:", error);
    console.error("Error details:", {
      message: error?.message,
      response: error?.response?.data,
      stack: error?.stack
    });

    // Sempre retornar JSON, nunca HTML
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid payment data",
        details: error.issues,
      });
    }

    if (axios.isAxiosError(error)) {
      console.error("MercadoPago API Error:", error.response?.data);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.response?.data?.cause?.description || 
                          "Payment processing failed";
      
      // Retornar detalhes específicos do erro
      return res.status(error.response?.status || 500).json({
        error: errorMessage,
        cause: error.response?.data?.cause,
        details: error.response?.data
      });
    }

    // Erro genérico - sempre retornar JSON
    return res.status(500).json({ 
      error: error?.message || "Internal server error",
      type: "server_error"
    });
  }
}