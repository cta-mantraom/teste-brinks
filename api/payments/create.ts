import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";
import { z } from "zod";
import { paymentFormDataSchema } from "../../src/lib/schemas/payment";
import { getServerConfig } from "../../src/lib/config/server-environment";

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

    // Format payer data for MercadoPago API
    const mercadoPagoPayload = {
      transaction_amount: paymentData.transaction_amount,
      payment_method_id: paymentData.payment_method_id,
      description: paymentData.description || "Checkout Brinks",
      installments: paymentData.installments || 1,
      payer: {
        first_name: paymentData.payer.first_name,
        last_name: paymentData.payer.last_name,
        email: paymentData.payer.email,
        identification: {
          type: paymentData.payer.identification.type,
          number: paymentData.payer.identification.number
        },
        phone: {
          area_code: paymentData.payer.phone.area_code,
          number: paymentData.payer.phone.number
        }
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
      console.error("MercadoPago API Error:", error.response?.data);
      return res.status(error.response?.status || 500).json({
        error: error.response?.data?.message || error.response?.data?.cause?.description || "Payment processing failed",
        cause: error.response?.data?.cause
      });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
}