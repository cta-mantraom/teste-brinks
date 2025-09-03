import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { webhookPayloadSchema } from "../../src/lib/schemas/webhook.js";
import { validateWebhookSignature } from "../../src/lib/config/server-environment.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validate webhook signature
    const signature = req.headers["x-signature"] as string | undefined;
    const rawBody = JSON.stringify(req.body);

    const isValidSignature = await validateWebhookSignature(rawBody, signature);
    if (!isValidSignature) {
      console.error("Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Validate payload with Zod
    const payload = webhookPayloadSchema.parse(req.body);

    if (payload.type === "payment" && payload.data.id) {
      console.log(`Webhook validated - Payment ID: ${payload.data.id}`);
      console.log(`Action: ${payload.action}`);
      console.log(`Live Mode: ${payload.live_mode}`);

      // Here you would typically update your database
      // For now, just acknowledge receipt

      return res.status(200).json({
        received: true,
        paymentId: payload.data.id,
      });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid payload format",
        details: error.issues,
      });
    }

    return res.status(400).json({ error: "Invalid payload" });
  }
}
