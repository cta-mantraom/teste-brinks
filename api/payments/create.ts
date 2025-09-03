import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";
import { z } from "zod";
import { paymentFormDataSchema } from "../../src/lib/schemas/payment.js";
import { getServerConfig } from "../../src/lib/config/server-environment.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validate input with Zod
    const paymentData = paymentFormDataSchema.parse(req.body);

    // Get server config with ACCESS_TOKEN
    const config = getServerConfig();

    // Create payment on MercadoPago servers
    const response = await axios.post(
      "https://api.mercadopago.com/v1/payments",
      {
        ...paymentData,
        notification_url: `${config.FRONTEND_URL}/api/webhooks/mercadopago`,
        statement_descriptor: "CHECKOUT BRINKS",
      },
      {
        headers: {
          Authorization: `Bearer ${config.MERCADOPAGO_ACCESS_TOKEN}`,
          "X-Idempotency-Key": crypto.randomUUID(),
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
  } catch (error) {
    console.error("Payment error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid payment data",
        details: error.issues,
      });
    }

    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        error: error.response?.data?.message || "Payment processing failed",
      });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
}
