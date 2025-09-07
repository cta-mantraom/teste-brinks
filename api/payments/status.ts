import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { getPaymentClient } from "../_shared/clients/mpClient.js";
import { logger } from "../_shared/utils/logger.js";

const statusQuerySchema = z.object({
  paymentId: z.string().min(1, 'paymentId obrigatório')
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validar query como unknown
    const query = req.query as unknown;
    const { paymentId } = statusQuerySchema.parse(query);

    logger.info('Payment status check requested', {
      service: 'payment',
      operation: 'status_check',
      paymentId
    });

    // Obter cliente SDK e buscar status do pagamento
    const paymentClient = getPaymentClient();
    const response = await paymentClient.get({
      id: paymentId
    });

    // Validar resposta
    if (!response || !response.id) {
      throw new Error('Invalid response from MercadoPago SDK');
    }

    logger.info('Payment status retrieved', {
      service: 'payment',
      operation: 'status_check',
      paymentId: response.id.toString(),
      status: response.status,
      status_detail: response.status_detail
    });

    // Return payment status to frontend
    return res.status(200).json({
      id: response.id,
      status: response.status,
      status_detail: response.status_detail,
      transaction_amount: response.transaction_amount,
      date_created: response.date_created,
      date_approved: response.date_approved,
      point_of_interaction: response.point_of_interaction,
      payer: response.payer,
      payment_method_id: response.payment_method_id,
      external_reference: response.external_reference
    });
  } catch (error: unknown) {
    logger.error('Payment status check failed', {
      service: 'payment',
      operation: 'status_check'
    }, error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Requisição inválida",
        details: error.issues,
      });
    }

    // Tratar erro do SDK MercadoPago
    if (error instanceof Error && 'status' in error) {
      const mpError = error as { status?: number; message?: string; cause?: unknown[] };
      logger.error('MercadoPago SDK error', {
        service: 'payment',
        operation: 'status_check',
        status: mpError.status,
        errorMessage: mpError.message
      }, error);
      
      return res.status(mpError.status || 500).json({
        error: mpError.message || "Falha ao obter status do pagamento",
        cause: mpError.cause
      });
    }

    const message = error instanceof Error ? error.message : 'Erro interno';
    return res.status(500).json({ error: message });
  }
}