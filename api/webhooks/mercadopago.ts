import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { webhookPayloadSchema } from "../_shared/schemas/webhook.js";
import { validateMpWebhookSignatureFromRequest } from "../_shared/utils/crypto.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Log inicial para debug
    console.error("[WEBHOOK] Recebendo notificação");
    console.error("[WEBHOOK] Method:", req.method);
    console.error("[WEBHOOK] URL:", req.url);
    console.error("[WEBHOOK] Headers recebidos:", Object.keys(req.headers).join(", "));
    
    // Validar assinatura usando nova função
    const isValid = await validateMpWebhookSignatureFromRequest(req);
    if (!isValid) {
      console.error("[WEBHOOK] Falha na validação da assinatura");
      return res.status(401).json({ error: "Invalid signature" });
    }
    
    console.error("[WEBHOOK] Assinatura validada com sucesso")

    // Validar payload como unknown
    const body = req.body as unknown;
    const payload = webhookPayloadSchema.parse(body);

    // Log do payload processado
    console.error("[WEBHOOK] Payload processado:", {
      type: payload.type,
      action: payload.action,
      dataId: payload.data?.id,
      liveMode: payload.live_mode,
      userId: payload.user_id,
      dateCreated: payload.date_created
    });

    if (payload.type === "payment" && payload.data.id) {
      console.error(`[WEBHOOK] Payment ID: ${payload.data.id}`);
      console.error(`[WEBHOOK] Action: ${payload.action}`);
      console.error(`[WEBHOOK] Live Mode: ${payload.live_mode}`);
      console.error(`[WEBHOOK] User ID: ${payload.user_id}`);

      // TODO: Aqui você processaria o webhook (atualizar DB, etc)
      // Por enquanto, apenas confirma recebimento
      
      console.error("[WEBHOOK] Notificação processada com sucesso");
      
      return res.status(200).json({
        received: true,
        paymentId: payload.data.id,
        timestamp: new Date().toISOString()
      });
    }

    console.error("[WEBHOOK] Notificação recebida mas não é de pagamento");
    return res.status(200).json({ 
      received: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: unknown) {
    console.error("[WEBHOOK] Erro ao processar notificação:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Payload inválido",
        details: error.issues,
      });
    }

    return res.status(400).json({ error: "Invalid payload" });
  }
}
