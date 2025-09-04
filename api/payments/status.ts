import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";
import { z } from "zod";
import { getServerConfig } from "../../src/lib/config/server-environment";

const statusQuerySchema = z.object({
  paymentId: z.string().min(1)
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validate query params with Zod
    const { paymentId } = statusQuerySchema.parse(req.query);

    // Get server config with ACCESS_TOKEN
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
  } catch (error) {
    console.error("Status check error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request",
        details: error.issues,
      });
    }

    if (axios.isAxiosError(error)) {
      console.error("MercadoPago API Error:", error.response?.data);
      return res.status(error.response?.status || 500).json({
        error: error.response?.data?.message || error.response?.data?.cause?.description || "Failed to get payment status",
        cause: error.response?.data?.cause
      });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
}