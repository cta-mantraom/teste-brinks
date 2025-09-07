toolName: search_codebase

status: success

query: Open the api/payments/create.ts and api/payments/status.ts to see how axios is used and how to refactor to Mercado Pago Node SDK; also locate api/\_shared/config and schemas to know how env and validation are structured.

toolName: search_by_regex

status: success

query: class|export\s+const\s+cardPaymentSchema|pixPaymentSchema|issuer_id|token|payment_method_id

toolName: view_files

status: success

filePath: c:\Users\User\Desktop\Projetos\sos-moto\cta-mantraom\trae\teste-brinks\package.json

toolName: view_files

status: success

filePath: c:\Users\User\Desktop\Projetos\sos-moto\cta-mantraom\trae\teste-brinks\api_shared\schemas\payment.ts
c:\Users\User\Desktop\Projetos\sos-moto\cta-mantraom\trae\teste-brinks\api_shared\config\server.ts
c:\Users\User\Desktop\Projetos\sos-moto\cta-mantraom\trae\teste-brinks\src\components\checkout\PaymentBrick.tsx

Excelente — vamos fazer a migração completa do backend para o SDK oficial do Mercado Pago (Node), removendo o Axios na API e mantendo o padrão onSubmit → backend → /v1/payments (via SDK). Vou explicar a adaptação, entregar os patches de código com segurança reforçada e organizar o que vai em cada arquivo.

Visão geral da adaptação

- Fluxo correto Bricks: o Payment Brick coleta dados (incluindo o token de cartão) e envia ao backend; o backend cria o pagamento no Mercado Pago (via SDK oficial), e o webhook confirma os eventos. Isso mantém credenciais seguras e está alinhado com a documentação e melhores práticas do Mercado Pago.
- O que vamos mudar:
  - Migrar api/payments/create.ts e api/payments/status.ts para usar o SDK “mercadopago” (servidor) em vez de Axios.
  - Centralizar a inicialização do SDK com um client singleton, evitando expor tokens e repetição de código.
  - Reforçar segurança no backend: validação Zod rígida, idempotência, não logar dados sensíveis, e impor o valor do pagamento no servidor (evitando manipulação no cliente).
  - Não tocar no frontend, a menos que seja desejado no futuro. O Axios no frontend continua só para chamar nossa própria API — não há exposição de credenciais.

Respostas diretas às perguntas de segurança

- Estamos expondo dados sensíveis de maneira incorreta?
  - Não. O ACCESS_TOKEN e o WEBHOOK_SECRET ficam apenas no servidor (<mcfile name="server.ts" path="api/_shared/config/server.ts"></mcfile>). O frontend nunca vê essas credenciais. O token do cartão que o Brick gera é de uso único e transitório; no backend, evitamos logá-lo por completo (só mostramos um prefixo para diagnóstico).
- Existem brechas para execução de scripts maliciosos?
  - O backend trata req.body como unknown e valida tudo com Zod (sem eval, sem execução arbitrária). As rotas são same-origin, retornam JSON e não renderizam HTML — mitigando XSS via server. O Webhook valida assinatura antes de aceitar o payload (<mcfile name="mercadopago.ts" path="api/webhooks/mercadopago.ts"></mcfile>), reduzindo spoofing.
- Como prevenir fraude/burlar pagamentos?
  - Impomos o valor no servidor (não confiamos no amount vindo do cliente), usamos X-Idempotency-Key em cada criação para evitar duplicidade, correlacionamos pedidos por external_reference, e consideramos “pago” somente após confirmação via webhook assinado. Isso elimina o risco de o usuário manipular valores ou forjar sucesso no frontend.

O que vai em cada arquivo

- api/\_shared/clients/mpClient.ts (novo): client singleton do SDK mercadopago.
- api/payments/create.ts: troca Axios → SDK, mantém validações Zod, idempotência, logs, e impõe valor server-side.
- api/payments/status.ts: troca Axios → SDK.
- Nada muda no frontend (PaymentBrick e services). O Axios do frontend continua apenas para consumir nossa API.

Instalação do SDK servidor (uma vez, localmente e/ou na Vercel)

```bash
npm i mercadopago
```

Novos arquivos (completos)

```ts:api/_shared/clients/mpClient.ts
// Cliente singleton do SDK Mercado Pago no backend (Node)
// Mantém ACCESS_TOKEN seguro e evita reinitializations nas funções serverless

import { MercadoPagoConfig, Payment } from 'mercadopago'
import { getServerConfig } from '../config/server.js'

let paymentClient: Payment | null = null

export const getPaymentClient = (): Payment => {
  if (paymentClient) return paymentClient

  const { MERCADOPAGO_ACCESS_TOKEN } = getServerConfig()
  const sdkConfig = new MercadoPagoConfig({
    accessToken: MERCADOPAGO_ACCESS_TOKEN
  })

  paymentClient = new Payment(sdkConfig)
  return paymentClient
}
```

Patches nos arquivos existentes

1. api/payments/create.ts — trocar Axios pelo SDK, impor valor no servidor, manter Zod e logs

```ts:api/payments/create.ts
// imports do topo do arquivo (remoção do axios e adição do client do SDK)
import type { VercelRequest, VercelResponse } from "@vercel/node";
// ... existing code ...
import { randomUUID } from "crypto";
import { z } from "zod";
import {
  pixPaymentSchema,
  cardPaymentSchema,
  type PixPayment,
  type CardPayment
} from "../_shared/schemas/payment.js";
import { getServerConfig } from "../_shared/config/server.js";
import { logger } from "../_shared/utils/logger.js";
import { getPaymentClient } from "../_shared/clients/mpClient.js"; // SDK MP (Node)
// ... existing code ...
```

```ts:api/payments/create.ts
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ... existing code ...

  try {
    // ... existing code ...

    // Determinar tipo de pagamento
    const isPix = payment_method_id === 'pix';

    // ... existing code ...

    // Configuração lazy load
    const config = getServerConfig();

    // REGRAS DE NEGÓCIO: impor o valor no servidor (prevenção de manipulação)
    // Valor mínimo/fechado: R$ 5,00 (ajuste aqui conforme regra do seu negócio)
    const SERVER_ENFORCED_AMOUNT = 5;

    // Construir payload para MercadoPago (tipagem explícita)
    const mercadoPagoPayload: Record<string, unknown> = {
      transaction_amount: SERVER_ENFORCED_AMOUNT, // impor valor no servidor
      payment_method_id: paymentData.payment_method_id,
      description: paymentData.description,
      installments: paymentData.installments,
      payer: {
        email: paymentData.payer.email,
        entity_type: paymentData.payer.entity_type,
        type: paymentData.payer.type,
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
      external_reference: `brinks-${Date.now()}`
    };

    // ... existing code ...

    // Log completo do payload final (sem dados sensíveis)
    logger.payment('sending_to_mercadopago', 'N/A', {
      payload: {
        payment_method_id: mercadoPagoPayload.payment_method_id,
        hasToken: !!mercadoPagoPayload.token,
        issuer_id: mercadoPagoPayload.issuer_id,
        amount: mercadoPagoPayload.transaction_amount
      }
    });

    // SDK Mercado Pago - criação do pagamento com idempotência
    const paymentClient = getPaymentClient();
    const idempotencyKey = randomUUID();

    const result = await paymentClient.create({
      body: mercadoPagoPayload,
      requestOptions: {
        idempotencyKey
      }
    });

    // Log de sucesso
    logger.payment('payment_created', String(result.id), {
      status: result.status,
      status_detail: result.status_detail,
      payment_method_id: (result as unknown as { payment_method_id?: string })?.payment_method_id
    });

    // Retornar dados essenciais ao frontend
    return res.status(200).json({
      id: result.id,
      status: result.status,
      status_detail: result.status_detail,
      point_of_interaction: result.point_of_interaction,
    });
  } catch (error: unknown) {
    logger.error('Payment creation failed', {
      service: 'payment',
      operation: 'create'
    }, error);

    // Tratar erro Zod
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Dados de pagamento inválidos",
        details: error.issues,
      });
    }

    // Tratar erro do SDK (estrutura semelhante à API)
    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;
      const mpError = err;
      logger.error('MercadoPago SDK error', {
        service: 'payment',
        operation: 'mercadopago_sdk',
        errorMessage: (mpError?.message as string) || 'SDK error',
        errorCause: mpError?.cause
      }, error);

      return res.status(500).json({
        error: (mpError?.message as string) || "Falha no processamento",
        cause: mpError?.cause,
        details: mpError
      });
    }

    // Erro genérico
    const message = error instanceof Error ? error.message : 'Erro interno';
    return res.status(500).json({
      error: message,
      type: "server_error"
    });
  }
}
```

2. api/payments/status.ts — trocar Axios pelo SDK

```ts:api/payments/status.ts
// imports do topo (remover axios, adicionar client do SDK)
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { getServerConfig } from "../_shared/config/server.js";
import { getPaymentClient } from "../_shared/clients/mpClient.js"; // SDK MP (Node)
// ... existing code ...
```

```ts:api/payments/status.ts
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ... existing code ...

  try {
    // Validar query como unknown
    const query = req.query as unknown;
    const { paymentId } = statusQuerySchema.parse(query);

    // Configuração lazy load
    getServerConfig(); // garante envs válidos; client usa internamente

    // Obter status via SDK Mercado Pago
    const paymentClient = getPaymentClient();
    const result = await paymentClient.get({ id: paymentId });

    // Return payment status to frontend
    return res.status(200).json({
      id: result.id,
      status: result.status,
      status_detail: result.status_detail,
      transaction_amount: result.transaction_amount,
      date_created: result.date_created,
      date_approved: result.date_approved,
      point_of_interaction: result.point_of_interaction,
      payer: result.payer,
      payment_method_id: (result as unknown as { payment_method_id?: string })?.payment_method_id,
      external_reference: result.external_reference
    });
  } catch (error: unknown) {
    console.error("[STATUS_CHECK] Erro:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Requisição inválida",
        details: error.issues,
      });
    }

    // ... existing code ...
  }
}
```

Onde cada parte se encaixa e por quê

- <mcfile name="mpClient.ts" path="api/_shared/clients/mpClient.ts"></mcfile>: Centraliza a inicialização segura do SDK (carregando ACCESS_TOKEN via <mcfile name="server.ts" path="api/_shared/config/server.ts"></mcfile>). Evita duplicar código de setup e mantém um único ponto de verdade.
- <mcfile name="create.ts" path="api/payments/create.ts"></mcfile> (<mcsymbol name="handler" filename="create.ts" path="api/payments/create.ts" startline="1" type="function"></mcsymbol>): Cria pagamentos via SDK, com idempotência, validações Zod, logs estruturados, e enforcement server-side do valor do pagamento.
- <mcfile name="status.ts" path="api/payments/status.ts"></mcfile> (<mcsymbol name="handler" filename="status.ts" path="api/payments/status.ts" startline="1" type="function"></mcsymbol>): Consulta status pelo SDK (sem Axios), retornando exatamente o que o frontend precisa para exibir Status Screen e/ou confirmação.
- <mcfile name="mercadopago.ts" path="api/webhooks/mercadopago.ts"></mcfile>: Já possui a validação de assinatura e logs — sem mudanças funcionais necessárias agora.

Boas práticas de segurança aplicadas

- Segregação de segredos: ACCESS_TOKEN e WEBHOOK_SECRET apenas no servidor, via getServerConfig (Zod valida e falha cedo).
- Entrada como unknown + Zod: Nenhuma requisição é aceita sem validação rígida dos schemas (<mcfile name="payment.ts" path="api/_shared/schemas/payment.ts"></mcfile>).
- Idempotência: Toda criação usa requestOptions.idempotencyKey (evita duplicidades em replays).
- Não logar dados sensíveis: Só mostramos prefixos de token; nunca exibimos ACCESS_TOKEN. Recomendo também limitar logs de PII (nome/CPF) a ambientes dev.
- Confiança no server para valores: O valor do pagamento é imposto no backend (SERVER_ENFORCED_AMOUNT) para evitar manipulação no cliente (conforme “valor mínimo/fixo”).
- Webhook com assinatura: Não processamos notificações sem validar assinatura (<mcfile name="mercadopago.ts" path="api/webhooks/mercadopago.ts"></mcfile>).
- Superfície de ataque reduzida: endpoints aceitam apenas JSON, sem execuções dinâmicas, e mesmo domínio (sem CORS exposto).

Limpeza de código (sem legado)

- Removido import axios nas rotas de API.
- Adicionados imports do client SDK e remoção dos trechos específicos de Axios.
- Mantidos comentários e logs úteis; sem dead code.
- Frontend inalterado (continua chamando nossa API). Se quiser, podemos trocar Axios por fetch no frontend futuramente, mas não é necessário agora.

Próximos passos sugeridos (opcional, mas recomendado)

- Externalizar o valor mínimo/fixo para env (ex: MIN_PAYMENT_AMOUNT ou FIXED_PAYMENT_AMOUNT) e validar via Zod no <mcfile name="server.ts" path="api/_shared/config/server.ts"></mcfile>.
- Persistência de pedidos/status correlacionando external_reference no webhook (anti-fraude e auditoria).
- Rate limiting e proteção adicional nas rotas /api/payments/\* (Edge Middleware ou soluções externas).
- Sanitização de logs para LGPD (mas mantendo rastreabilidade em erros).

Se quiser, eu aplico mais dois ajustes finos:

- Promover SERVER_ENFORCED_AMOUNT a variável de ambiente com validação Zod.
- Adaptar o frontend (PaymentBrick) para ignorar completamente qualquer cálculo de amount e confiar só no amount server-side (hoje já é seguro — apenas enviamos por compat, e o servidor impõe o valor).

Diga-me se posso prosseguir com esses refinamentos extras.
