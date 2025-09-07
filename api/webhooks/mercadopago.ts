import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { webhookPayloadSchema } from "../_shared/schemas/webhook.js";
import { validateMpWebhookSignatureFromRequest } from "../_shared/utils/crypto.js";
import { logger } from "../_shared/utils/logger.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Log estruturado inicial
    logger.webhook('notification_received', {
      method: req.method,
      url: req.url,
      headers: Object.keys(req.headers).join(", ")
    });
    
    // Validar assinatura usando nova função
    const isValid = await validateMpWebhookSignatureFromRequest(req);
    if (!isValid) {
      logger.warn('Invalid webhook signature', {
        service: 'webhook',
        operation: 'signature_validation'
      });
      return res.status(401).json({ error: "Invalid signature" });
    }
    
    logger.webhook('signature_validated', {})

    // Validar payload como unknown
    const body = req.body as unknown;
    const payload = webhookPayloadSchema.parse(body);

    // Log estruturado do payload
    logger.webhook('payload_processed', {
      type: payload.type,
      action: payload.action,
      dataId: payload.data?.id,
      liveMode: payload.live_mode,
      userId: payload.user_id,
      dateCreated: payload.date_created
    });

    if (payload.type === "payment" && payload.data.id) {
      // Log sanitizado - sem PII (dados pessoais)
      logger.payment('webhook_received', payload.data.id, {
        action: payload.action,
        liveMode: payload.live_mode,
        // Não logar userId direto, apenas indicar presença
        hasUserId: !!payload.user_id
      });

      // TODO: Implementar persistência em banco de dados
      // - Salvar status do pagamento
      // - Atualizar pedido
      // - Enviar notificação ao usuário
      // IMPORTANTE: Em produção, buscar detalhes do pagamento via SDK
      // e atualizar no banco de dados de forma segura
      
      logger.webhook('notification_processed', {
        paymentId: payload.data.id,
        processedAt: new Date().toISOString()
      });
      
      return res.status(200).json({
        received: true,
        paymentId: payload.data.id,
        timestamp: new Date().toISOString()
      });
    }

    logger.info('Non-payment notification received', {
      service: 'webhook',
      operation: 'notification',
      type: payload.type
    });
    return res.status(200).json({ 
      received: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: unknown) {
    logger.error('Webhook processing failed', {
      service: 'webhook',
      operation: 'process'
    }, error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Payload inválido",
        details: error.issues,
      });
    }

    return res.status(400).json({ error: "Invalid payload" });
  }
}
