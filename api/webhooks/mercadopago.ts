import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { webhookPayloadSchema } from "../_shared/schemas/webhook";
import { validateWebhookSignature } from "../_shared/utils/crypto";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validar assinatura
    const signature = req.headers["x-signature"] as string | undefined;
    const rawBody = JSON.stringify(req.body);

    const isValid = await validateWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error("[WEBHOOK] Assinatura inválida");
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Validar payload como unknown
    const body = req.body as unknown;
    const payload = webhookPayloadSchema.parse(body);

    if (payload.type === "payment" && payload.data.id) {
      console.log(`[WEBHOOK] Payment ID: ${payload.data.id}`);
      console.log(`[WEBHOOK] Action: ${payload.action}`);
      console.log(`[WEBHOOK] Live: ${payload.live_mode}`);

      // Aqui você processaria o webhook (atualizar DB, etc)
      
      return res.status(200).json({
        received: true,
        paymentId: payload.data.id,
      });
    }

    return res.status(200).json({ received: true });
    
  } catch (error: unknown) {
    console.error("[WEBHOOK] Erro:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Payload inválido",
        details: error.issues,
      });
    }

    return res.status(400).json({ error: "Invalid payload" });
  }
}
