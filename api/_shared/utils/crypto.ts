import type { VercelRequest } from '@vercel/node'
import { getServerConfig } from '../config/server.js'

/**
 * Valida assinatura de webhook do MercadoPago conforme documentação oficial
 * Formato do header x-signature: ts=timestamp,v1=hash
 * Manifest: id:[data.id];request-id:[x-request-id];ts:[ts];
 */
export const validateMpWebhookSignatureFromRequest = async (
  req: VercelRequest
): Promise<boolean> => {
  try {
    const config = getServerConfig()
    
    // Extrair x-signature header
    const xSignature = req.headers['x-signature'] as string | undefined
    if (!xSignature) {
      console.error('[WEBHOOK] Header x-signature ausente')
      return false
    }
    
    // Parse do x-signature: ts=...,v1=...
    const signatureParts = new Map<string, string>()
    xSignature.split(',').forEach(part => {
      const [key, value] = part.split('=')
      if (key && value) signatureParts.set(key, value)
    })
    
    const ts = signatureParts.get('ts')
    const v1 = signatureParts.get('v1')
    
    if (!ts || !v1) {
      console.error('[WEBHOOK] Formato inválido de x-signature')
      return false
    }
    
    // Extrair parâmetros para o manifest
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`)
    
    // data.id pode vir como "data.id" ou "id" na query
    let dataId = url.searchParams.get('data.id') || url.searchParams.get('id') || ''
    
    // Normalizar data.id para minúsculas se for alfanumérico
    if (dataId && /^[a-zA-Z0-9]+$/.test(dataId)) {
      dataId = dataId.toLowerCase()
    }
    
    // x-request-id do header
    const requestId = req.headers['x-request-id'] as string | undefined || ''
    
    // Construir manifest: apenas campos presentes, separados por ;
    const manifestParts: string[] = []
    
    if (dataId) {
      manifestParts.push(`id:${dataId}`)
    }
    
    if (requestId) {
      manifestParts.push(`request-id:${requestId}`)
    }
    
    if (ts) {
      manifestParts.push(`ts:${ts}`)
    }
    
    // Sempre terminar com ; se houver pelo menos um campo
    const manifest = manifestParts.length > 0 
      ? manifestParts.join(';') + ';'
      : ''
    
    // Log para debug (sem expor secrets)
    console.error('[WEBHOOK] URL chamada:', req.url)
    console.error('[WEBHOOK] Manifest construído:', manifest)
    console.error('[WEBHOOK] Headers presentes:', {
      'x-signature': !!xSignature,
      'x-request-id': !!requestId,
      'data.id': !!dataId
    })
    
    // Calcular HMAC-SHA256 em hex
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(config.MERCADOPAGO_WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(manifest)
    )
    
    const expectedHex = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    // Comparar hashes
    const isValid = expectedHex === v1
    
    if (isValid) {
      const skew = Math.abs(Date.now() / 1000 - parseInt(ts))
      console.error(`[WEBHOOK] Assinatura válida. Skew (s): ${skew}`)
    } else {
      console.error('[WEBHOOK] Assinatura inválida - hash não confere')
      console.error('[WEBHOOK] Hash esperado:', expectedHex.substring(0, 10) + '...')
      console.error('[WEBHOOK] Hash recebido:', v1.substring(0, 10) + '...')
    }
    
    return isValid
    
  } catch (error) {
    console.error('[WEBHOOK] Erro na validação:', error)
    return false
  }
}

// Manter função antiga para compatibilidade temporária
export const validateWebhookSignature = async (
  payload: string,
  signature: string | undefined
): Promise<boolean> => {
  console.error('[WEBHOOK] AVISO: Usando função deprecada validateWebhookSignature')
  return false // Sempre falha para forçar migração
}