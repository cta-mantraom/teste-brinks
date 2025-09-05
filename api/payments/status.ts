import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";
import { z } from "zod";
import { getServerConfig } from "../_shared/config/server.js";

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

    // Configuração lazy load
    const config = getServerConfig();

    // Get payment status from MercadoPago
    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${config.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      }
    );

    // Return payment status to frontend
    return res.status(200).json({
      id: response.data.id,
      status: response.data.status,
      status_detail: response.data.status_detail,
      transaction_amount: response.data.transaction_amount,
      date_created: response.data.date_created,
      date_approved: response.data.date_approved,
      point_of_interaction: response.data.point_of_interaction,
      payer: response.data.payer,
      payment_method_id: response.data.payment_method_id,
      external_reference: response.data.external_reference
    });
  } catch (error: unknown) {
    console.error("[STATUS_CHECK] Erro:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Requisição inválida",
        details: error.issues,
      });
    }

    if (axios.isAxiosError(error)) {
      const mpError = error.response?.data;
      return res.status(error.response?.status || 500).json({
        error: mpError?.message || mpError?.cause?.description || "Falha ao obter status",
        cause: mpError?.cause
      });
    }

    const message = error instanceof Error ? error.message : 'Erro interno';
    return res.status(500).json({ error: message });
  }
}