● 📋 ANÁLISE COMPLETA E PLANO DE REFATORAÇÃO - SDK MercadoPago

🔍 ANÁLISE DAS 3 DOCUMENTAÇÕES

Após análise profunda dos três documentos, identifiquei os pontos-chave:

✅ CONSENSO CORRETO:

1. Fluxo Bricks é: Frontend coleta → Backend cria pagamento → Webhook confirma
2. "Checkout Transparente" no painel é ESPERADO mesmo usando Bricks
3. SDK correto: mercadopago (Node) no backend, @mercadopago/sdk-react no frontend
4. Segurança: Token do cartão é transitório, ACCESS_TOKEN só no servidor

❌ CORREÇÃO IMPORTANTE:

- NÃO existe "Bricks puro" onde o frontend processa direto
- O backend SEMPRE cria o pagamento via /v1/payments

🎯 ARQUITETURA FINAL VALIDADA

graph LR
A[Payment Brick] -->|coleta + tokeniza| B[Frontend]
B -->|POST /api/payments/create| C[Backend API]
C -->|SDK mercadopago| D[MercadoPago API]
D -->|webhook| E[/api/webhooks/mercadopago]

🚀 PLANO DE REFATORAÇÃO COMPLETO

FASE 1: INSTALAÇÃO E CONFIGURAÇÃO BASE

1.1 Instalar SDK Oficial

npm install mercadopago

1.2 Criar Cliente Singleton do SDK

CRIAR ARQUIVO: api/\_shared/clients/mpClient.ts

import { MercadoPagoConfig, Payment } from 'mercadopago'
import { getServerConfig } from '../config/server.js'

let paymentClient: Payment | null = null

export const getPaymentClient = (): Payment => {
if (paymentClient) return paymentClient

    const { MERCADOPAGO_ACCESS_TOKEN } = getServerConfig()
    const sdkConfig = new MercadoPagoConfig({
      accessToken: MERCADOPAGO_ACCESS_TOKEN,
      options: { timeout: 5000 }
    })

    paymentClient = new Payment(sdkConfig)
    return paymentClient

}

Mudanças esperadas:

- ✅ Singleton pattern para reutilização
- ✅ Lazy loading do config
- ✅ Sem acesso direto a process.env

FASE 2: ATUALIZAR SCHEMAS DE VALIDAÇÃO

2.1 Ajustar Schema de Pagamento

MODIFICAR: api/\_shared/schemas/payment.ts

import { z } from 'zod'

// Schema base para PIX
const basePayerSchema = z.object({
email: z.string().email('Email inválido'),
first_name: z.string().optional().default(''),
last_name: z.string().optional().default(''),
entity_type: z.enum(['individual', 'association']).default('individual'),
type: z.literal('customer').default('customer'),
identification: z.object({
type: z.literal('CPF'),
number: z.string().optional().default('')
}).optional(),
phone: z.object({
area_code: z.string().optional().default(''),
number: z.string().optional().default('')
}).optional()
})

// Schema completo para Cartão
const fullPayerSchema = z.object({
first_name: z.string().min(1, 'Nome obrigatório'),
last_name: z.string().min(1, 'Sobrenome obrigatório'),
email: z.string().email('Email inválido'),
entity_type: z.enum(['individual', 'association']).default('individual'),
type: z.literal('customer').default('customer'),
identification: z.object({
type: z.literal('CPF'),
number: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos')
}),
phone: z.object({
area_code: z.string().length(2, 'DDD deve ter 2 dígitos'),
number: z.string().min(8).max(9, 'Telefone inválido')
})
})

// PIX Payment
export const pixPaymentSchema = z.object({
transaction_amount: z.number().positive('Valor deve ser positivo'),
payment_method_id: z.literal('pix'),
payer: basePayerSchema,
description: z.string().default('Checkout Brinks'),
installments: z.literal(1)
})

// Card Payment
export const cardPaymentSchema = z.object({
transaction_amount: z.number().positive('Valor deve ser positivo'),
payment_method_id: z.string().min(1), // bandeira: visa, master, elo
token: z.string().min(1, 'Token obrigatório'),
issuer_id: z.number().optional(),
payer: fullPayerSchema,
description: z.string().default('Checkout Brinks'),
installments: z.number().min(1).max(12).default(1)
})

export type PixPayment = z.infer<typeof pixPaymentSchema>
export type CardPayment = z.infer<typeof cardPaymentSchema>

Mudanças esperadas:

- ✅ Validação rigorosa sem any
- ✅ Tipos inferidos do Zod
- ✅ payment_method_id aceita bandeira para cartão

FASE 3: REFATORAR ENDPOINT DE CRIAÇÃO

3.1 Migrar para SDK com Segurança Reforçada

MODIFICAR: api/payments/create.ts

import type { VercelRequest, VercelResponse } from "@vercel/node"
import { randomUUID } from "crypto"
import { z } from "zod"
import {
pixPaymentSchema,
cardPaymentSchema,
type PixPayment,
type CardPayment
} from "../\_shared/schemas/payment.js"
import { getServerConfig } from "../\_shared/config/server.js"
import { logger } from "../\_shared/utils/logger.js"
import { getPaymentClient } from "../\_shared/clients/mpClient.js"

// Schema para valor imposto pelo servidor
const serverConfigSchema = z.object({
PAYMENT_AMOUNT: z.number().min(1).default(58) // R$ 58,00 padrão
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
if (req.method !== "POST") {
return res.status(405).json({ error: "Method not allowed" })
}

    try {
      // Validar body como unknown
      const rawBody = req.body as unknown

      // Schema inicial para determinar tipo
      const typeSchema = z.object({
        payment_method_id: z.string().min(1)
      }).passthrough()

      const { payment_method_id } = typeSchema.parse(rawBody)
      const isPix = payment_method_id === 'pix'

      // Validar com schema específico
      const paymentData: PixPayment | CardPayment = isPix
        ? pixPaymentSchema.parse(rawBody)
        : cardPaymentSchema.parse(rawBody)

      // Configurações do servidor
      const config = getServerConfig()
      const { PAYMENT_AMOUNT } = serverConfigSchema.parse({
        PAYMENT_AMOUNT: Number(process.env.PAYMENT_AMOUNT) || 58
      })

      // Construir payload (tipo seguro)
      const mercadoPagoPayload = {
        transaction_amount: PAYMENT_AMOUNT, // VALOR IMPOSTO PELO SERVIDOR
        payment_method_id: paymentData.payment_method_id,
        description: paymentData.description || "Checkout Brinks",
        installments: paymentData.installments || 1,
        payer: {
          email: paymentData.payer.email,
          entity_type: paymentData.payer.entity_type || 'individual',
          type: paymentData.payer.type || 'customer',
          ...(paymentData.payer.first_name && {
            first_name: paymentData.payer.first_name
          }),
          ...(paymentData.payer.last_name && {
            last_name: paymentData.payer.last_name
          }),
          ...(paymentData.payer.identification?.number && {
            identification: {
              type: 'CPF',
              number: paymentData.payer.identification.number
            }
          }),
          ...(paymentData.payer.phone?.number && {
            phone: {
              area_code: paymentData.payer.phone.area_code,
              number: paymentData.payer.phone.number
            }
          })
        },
        notification_url: `${config.FRONTEND_URL}/api/webhooks/mercadopago`,
        statement_descriptor: "CHECKOUT BRINKS",
        external_reference: `brinks-${Date.now()}`,
        // Campos específicos de cartão
        ...(!isPix && 'token' in paymentData ? {
          token: (paymentData as CardPayment).token,
          ...(paymentData as CardPayment).issuer_id && {
            issuer_id: (paymentData as CardPayment).issuer_id
          }
        } : {})
      }

      // Log sem dados sensíveis
      logger.payment('creating_payment', 'START', {
        payment_method: mercadoPagoPayload.payment_method_id,
        amount: mercadoPagoPayload.transaction_amount,
        hasToken: !!('token' in mercadoPagoPayload)
      })

      // Criar pagamento via SDK
      const paymentClient = getPaymentClient()
      const idempotencyKey = randomUUID()

      const result = await paymentClient.create({
        body: mercadoPagoPayload,
        requestOptions: { idempotencyKey }
      })

      // Log de sucesso
      logger.payment('payment_created', String(result.id), {
        status: result.status,
        status_detail: result.status_detail
      })

      // Retornar ao frontend
      return res.status(200).json({
        id: result.id,
        status: result.status,
        status_detail: result.status_detail,
        point_of_interaction: result.point_of_interaction
      })

    } catch (error: unknown) {
      logger.error('Payment creation failed', {
        service: 'payment',
        operation: 'create'
      }, error)

      // Tratar erro Zod
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Dados de pagamento inválidos",
          details: error.issues
        })
      }

      // Tratar erro do SDK
      if (error && typeof error === 'object' && 'message' in error) {
        const sdkError = error as { message: string; cause?: unknown }
        return res.status(500).json({
          error: sdkError.message || "Falha no processamento",
          cause: sdkError.cause
        })
      }

      // Erro genérico
      const message = error instanceof Error ? error.message : 'Erro interno'
      return res.status(500).json({
        error: message,
        type: "server_error"
      })
    }

}

Mudanças esperadas:

- ✅ SDK oficial ao invés de axios
- ✅ Valor imposto pelo servidor (anti-fraude)
- ✅ Idempotência nativa
- ✅ Zero uso de any
- ✅ Logs sem dados sensíveis

FASE 4: REFATORAR ENDPOINT DE STATUS

4.1 Migrar Consulta para SDK

MODIFICAR: api/payments/status.ts

import type { VercelRequest, VercelResponse } from "@vercel/node"
import { z } from "zod"
import { getPaymentClient } from "../\_shared/clients/mpClient.js"

const statusQuerySchema = z.object({
paymentId: z.string().min(1, 'Payment ID obrigatório')
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
if (req.method !== "GET") {
return res.status(405).json({ error: "Method not allowed" })
}

    try {
      // Validar query como unknown
      const query = req.query as unknown
      const { paymentId } = statusQuerySchema.parse(query)

      // Buscar via SDK
      const paymentClient = getPaymentClient()
      const result = await paymentClient.get({ id: paymentId })

      // Retornar status
      return res.status(200).json({
        id: result.id,
        status: result.status,
        status_detail: result.status_detail,
        transaction_amount: result.transaction_amount,
        date_created: result.date_created,
        date_approved: result.date_approved,
        point_of_interaction: result.point_of_interaction,
        payer: result.payer,
        payment_method_id: result.payment_method_id,
        external_reference: result.external_reference
      })

    } catch (error: unknown) {
      console.error("[STATUS_CHECK] Erro:", error)

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Requisição inválida",
          details: error.issues
        })
      }

      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as { status: number; message?: string }
        if (apiError.status === 404) {
          return res.status(404).json({ error: "Pagamento não encontrado" })
        }
      }

      return res.status(500).json({ error: "Erro ao buscar status" })
    }

}

Mudanças esperadas:

- ✅ SDK ao invés de axios
- ✅ Tratamento de erro 404
- ✅ Zero any

FASE 5: CONFIGURAÇÃO DE AMBIENTE

5.1 Atualizar Config do Servidor

MODIFICAR: api/\_shared/config/server.ts

import { z } from 'zod'

const serverEnvironmentSchema = z.object({
MERCADOPAGO_ACCESS_TOKEN: z.string().min(1, 'Access token obrigatório'),
MERCADOPAGO_WEBHOOK_SECRET: z.string().min(1, 'Webhook secret obrigatório'),
FRONTEND_URL: z.string().url('FRONTEND_URL inválida'),
PAYMENT_AMOUNT: z.string().transform(val => Number(val)).optional()
})

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>

let serverConfig: ServerEnvironment | null = null

export const getServerConfig = (): ServerEnvironment => {
if (serverConfig) return serverConfig

    const envData = {
      MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN,
      MERCADOPAGO_WEBHOOK_SECRET: process.env.MERCADOPAGO_WEBHOOK_SECRET,
      FRONTEND_URL: process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL,
      PAYMENT_AMOUNT: process.env.PAYMENT_AMOUNT
    }

    serverConfig = serverEnvironmentSchema.parse(envData)
    return serverConfig

}

FASE 6: LIMPEZA E REMOÇÃO

6.1 Remover Dependências Desnecessárias

REMOVER de package.json:

- axios (se não usado em outro lugar)

REMOVER imports em:

- api/payments/create.ts: remover import axios from "axios"
- api/payments/status.ts: remover import axios from "axios"

📊 RESUMO DAS MUDANÇAS

| Arquivo                          | Ação      | Mudança Principal                    |
| -------------------------------- | --------- | ------------------------------------ |
| package.json                     | Modificar | Adicionar mercadopago, remover axios |
| api/\_shared/clients/mpClient.ts | CRIAR     | Client singleton do SDK              |
| api/\_shared/schemas/payment.ts  | Modificar | Schemas rigorosos sem any            |
| api/\_shared/config/server.ts    | Modificar | Adicionar PAYMENT_AMOUNT             |
| api/payments/create.ts           | Modificar | SDK + valor servidor                 |
| api/payments/status.ts           | Modificar | SDK para consulta                    |

✅ VALIDAÇÃO FINAL

- Segurança: ACCESS_TOKEN só no servidor ✅
- Tipagem: Zero any, unknown + Zod ✅
- SDK Correto: mercadopago backend, @mercadopago/sdk-react frontend ✅
- Fluxo: Brick → Backend → MercadoPago ✅
- Lazy Loading: Configs com cache ✅
- Idempotência: UUID em cada criação ✅
- Anti-fraude: Valor imposto servidor ✅

🚀 ORDEM DE EXECUÇÃO

1. npm install mercadopago
2. Criar api/\_shared/clients/mpClient.ts
3. Atualizar api/\_shared/schemas/payment.ts
4. Atualizar api/\_shared/config/server.ts
5. Refatorar api/payments/create.ts
6. Refatorar api/payments/status.ts
7. Testar fluxo completo
8. Remover axios se não usado

Este plano mantém o Checkout Bricks funcionando corretamente, com o backend criando pagamentos via SDK oficial, seguindo todas as regras de segurança e tipagem rigorosa.
