# 🔧 CORREÇÃO DE WEBHOOK IMPLEMENTADA

## 📋 Problema Identificado
- **Erro**: Webhook retornando 401 (Assinatura Inválida)
- **Causa**: Implementação incorreta da validação de assinatura
- **Impacto**: 100% de falha nas notificações de pagamento

## ✅ Solução Implementada

### 1. Nova Função de Validação (`api/_shared/utils/crypto.ts`)
```typescript
validateMpWebhookSignatureFromRequest(req: VercelRequest)
```

#### Características:
- ✅ Parse correto do header `x-signature` (formato: `ts=timestamp,v1=hash`)
- ✅ Construção do manifest conforme documentação MercadoPago
- ✅ Normalização de `data.id` para minúsculas quando alfanumérico
- ✅ HMAC-SHA256 em hex comparado diretamente com `v1`
- ✅ Logs de diagnóstico sem expor secrets

### 2. Formato do Manifest
```
id:[data.id];request-id:[x-request-id];ts:[ts];
```
- Apenas campos presentes são incluídos
- Sempre termina com `;`
- `data.id` vem da query string
- `x-request-id` vem dos headers
- `ts` vem do próprio `x-signature`

### 3. Handler Atualizado (`api/webhooks/mercadopago.ts`)
- ✅ Usa nova função de validação
- ✅ Logs detalhados para debug na Vercel
- ✅ Retorna timestamp nas respostas
- ✅ Processa notificações de pagamento

## 📊 Logs de Diagnóstico
Os seguintes logs aparecerão na Vercel (usando `console.error`):

1. **Recebimento da Notificação**:
   - URL chamada
   - Headers recebidos
   - Method

2. **Validação**:
   - Manifest construído
   - Headers presentes (x-signature, x-request-id, data.id)
   - Resultado da validação

3. **Sucesso**:
   - "Assinatura válida. Skew (s): X"
   - Payment ID processado
   - Notificação processada com sucesso

4. **Falha**:
   - Hash esperado vs recebido (primeiros 10 chars)
   - Detalhes do erro

## 🚀 Deploy e Teste

### 1. Deploy na Vercel
```bash
git add .
git commit -m "fix: correção da validação de webhook do MercadoPago

- Implementa validação correta conforme documentação oficial
- Parse do header x-signature (ts e v1)
- Construção do manifest para HMAC
- Logs de diagnóstico para debug

Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```

### 2. Verificar na Vercel
1. Aguardar deploy automático
2. Verificar logs em: https://vercel.com/seu-projeto/functions
3. Filtrar por `[WEBHOOK]` para ver apenas logs relevantes

### 3. Teste com Pagamento Real
1. Criar um pagamento PIX de teste
2. Observar logs na Vercel:
   - Deve mostrar "Assinatura válida"
   - Payment ID deve ser logado
   - Resposta 200 deve ser retornada

## 📈 Resultados Esperados
- ✅ Webhooks retornando 200 (sucesso)
- ✅ Notificações sendo processadas
- ✅ Logs detalhados na Vercel
- ✅ Compatibilidade total com documentação MercadoPago

## 🔍 Monitoramento
Procurar nos logs da Vercel por:
- `[WEBHOOK] Assinatura válida` - Sucesso
- `[WEBHOOK] Payment ID:` - Pagamento processado
- `[WEBHOOK] Falha na validação` - Erro (não deve ocorrer)

## 📝 Notas Técnicas
- Usa `console.error` para garantir visibilidade na Vercel
- Segue regras do projeto: sem `any`, validação com Zod, lazy loading
- Compatível com ES Modules (`.js` nos imports)
- Não expõe secrets nos logs