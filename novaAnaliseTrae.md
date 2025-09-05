toolName: view_files

status: success

filePath: c:\Users\User\Desktop\Projetos\sos-moto\cta-mantraom\trae\teste-brinks\api\payments\status.ts
c:\Users\User\Desktop\Projetos\sos-moto\cta-mantraom\trae\teste-brinks\api\webhooks\mercadopago.ts

Perfeito — obrigado por compartilhar os arquivos “proposta.md” e “propostaQuetionada.md”. Eles confirmam o que vimos nos logs da Vercel: o 500 era causado por importações do backend (api/) apontando para arquivos do frontend (src/), o que quebra o bundle da Vercel e resulta nesse ERR_MODULE_NOT_FOUND.

Você também está correto em exigir um setup 100% produção. Portanto, vou ajustar a solução para:

- Remover totalmente as importações de src/ dentro de api/ (em todas as functions).
- Adotar um config de servidor que use apenas FRONTEND_URL (com fallback para VITE_FRONTEND_URL). Nada de VERCEL_URL, já que você está em domínio próprio.
- Manter o fluxo real com Checkout Bricks, sem mocks.

Abaixo estão as mudanças pontuais nos arquivos (com explicação) e os novos módulos compartilhados em api/\_shared para acabar com o erro e manter deploys estáveis na Vercel.

O que muda (resumo)

- Mover schemas e config usados pelo backend para api/\_shared/.
- Atualizar imports em:
  - api/payments/create.ts
  - api/payments/status.ts
  - api/webhooks/mercadopago.ts
- Ajustar validação: usar pixPaymentSchema para PIX e cardPaymentSchema para Cartão (sem duplicação de lógica).
- Garantir FRONTEND_URL 100% produção: se não existir, erro explícito.
- Reforçar o fetch do frontend para lidar com respostas não-JSON (caso infra volte a falhar no futuro).

1. Novo: Config do servidor (somente produção)
   Este arquivo garante que FRONTEND_URL esteja sempre definido (https://memoryys.com no seu caso). Sem VERCEL_URL.

```typescript:c:\Users\User\Desktop\Projetos\sos-moto\cta-mantraom\trae\teste-brinks\api_shared\config\server.ts
// Configuração de servidor para funções em api/ (Vercel)
// 100% produção: usa somente FRONTEND_URL e VITE_FRONTEND_URL como fallback.
// Nenhum uso de VERCEL_URL para evitar ambientes "preview" ou domínios gerados.
import { z } from 'zod'

const serverEnvironmentSchema = z.object({
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1, 'Access token obrigatório'),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().min(1, 'Webhook secret obrigatório'),
  FRONTEND_URL: z.string().url('FRONTEND_URL inválida'),
})

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>

let serverConfig: ServerEnvironment | null = null

export const getServerConfig = (): ServerEnvironment => {
  if (serverConfig) return serverConfig

  // Para seu ambiente, simplesmente: FRONTEND_URL (ou VITE_FRONTEND_URL como fallback).
  const frontendUrl = process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL
  if (!frontendUrl) {
    // Falha explícita em produção para evitar URLs incorretas.
    throw new Error('FRONTEND_URL não configurada')
  }

  serverConfig = serverEnvironmentSchema.parse({
    MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN,
    MERCADOPAGO_WEBHOOK_SECRET: process.env.MERCADOPAGO_WEBHOOK_SECRET,
    FRONTEND_URL: frontendUrl,
  })

  return serverConfig
}
```

2. Novo: Schemas de pagamento (PIX e Cartão) para o backend
   O backend agora valida PIX e Cartão sem importar nada de src/.

```typescript:c:\Users\User\Desktop\Projetos\sos-moto\cta-mantraom\trae\teste-brinks\api_shared\schemas\payment.ts
// Schemas mínimos e adequados ao backend (serverless), sem dependências de src/
import { z } from 'zod'

// Base para PIX (dados opcionais, mas e-mail obrigatório)
export const basePayerSchema = z.object({
  email: z.string().email('Email inválido'),
  first_name: z.string().optional().default(''),
  last_name: z.string().optional().default(''),
  entity_type: z.enum(['individual', 'association']).optional().default('individual'),
  type: z.string().optional().default('customer'),
  identification: z.object({
    type: z.string().optional().default('CPF'),
    number: z.string().optional().default('')
  }).optional(),
  phone: z.object({
    area_code: z.string().optional().default(''),
    number: z.string().optional().default('')
  }).optional()
})

// Completo para Cartão (campos obrigatórios)
export const fullPayerSchema = z.object({
  first_name: z.string().min(1, 'Nome obrigatório'),
  last_name: z.string().min(1, 'Sobrenome obrigatório'),
  email: z.string().email('Email inválido'),
  entity_type: z.enum(['individual', 'association']).default('individual'),
  type: z.string().default('customer'),
  identification: z.object({
    type: z.literal('CPF'),
    number: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos')
  }),
  phone: z.object({
    area_code: z.string().min(2).max(2),
    number: z.string().min(8).max(9)
  })
})

// PIX
export const pixPaymentSchema = z.object({
  transaction_amount: z.number().positive('Valor deve ser positivo'),
  payment_method_id: z.literal('pix'),
  payer: basePayerSchema,
  description: z.string().optional().default('Checkout Brinks'),
  installments: z.number().optional().default(1)
})

// Cartão
export const cardPaymentSchema = z.object({
  transaction_amount: z.number().positive('Valor deve ser positivo'),
  payment_method_id: z.enum(['credit_card', 'debit_card']),
  payer: fullPayerSchema,
  description: z.string().default('Checkout Brinks'),
  installments: z.number().min(1).default(1)
})

// União (caso queira usar um único schema no futuro)
export const paymentFormDataSchema = z.union([pixPaymentSchema, cardPaymentSchema])
```

3. Novo: Schema mínimo de Webhook no backend
   Evita dependência de src/lib/schemas/webhook.

```typescript:c:\Users\User\Desktop\Projetos\sos-moto\cta-mantraom\trae\teste-brinks\api_shared\schemas\webhook.ts
import { z } from 'zod'

export const webhookPayloadSchema = z.object({
  action: z.string(),
  api_version: z.string(),
  data: z.object({
    id: z.string()
  }),
  date_created: z.string(),
  id: z.number(),
  live_mode: z.boolean(),
  type: z.literal('payment'),
  user_id: z.string()
})

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>
```

4. Novo: Utilitário de assinatura HMAC para Webhooks
   Traz a validação de assinatura para dentro de api/\_shared.

```typescript:c:\Users\User\Desktop\Projetos\sos-moto\cta-mantraom\trae\teste-brinks\api_shared\utils\crypto.ts
import { getServerConfig } from '../config/server'

export const validateWebhookSignature = async (
  payload: string,
  signature: string | undefined
): Promise<boolean> => {
  if (!signature) return false

  try {
    const config = getServerConfig()
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(config.MERCADOPAGO_WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    return signature === `sha256=${expectedSignature}`
  } catch (error) {
    console.error('Error validating webhook signature:', error)
    return false
  }
}
```

5. Patch: api/payments/create.ts

- Trocar imports de src/ por api/\_shared/.
- Usar pixPaymentSchema/cardPaymentSchema para validar.
- Usar config.FRONTEND_URL.

```typescript:c:\Users\User\Desktop\Projetos\sos-moto\cta-mantraom\trae\teste-brinks\api\payments\create.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";
import { randomUUID } from "crypto";
import { z } from "zod";
// ... existing code ...
// import { paymentFormDataSchema } from "../../src/lib/schemas/payment";
import { pixPaymentSchema, cardPaymentSchema } from "../_shared/schemas/payment";
import { getServerConfig } from "../_shared/config/server";
// ... existing code ...

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ... existing code ...
  try {
    // Para PIX, os dados do pagador são opcionais
    const isPix = req.body.payment_method_id === 'pix';

    // Validate input with Zod (sem importar de src/)
    const paymentData = isPix
      ? pixPaymentSchema.parse(req.body)
      : cardPaymentSchema.parse(req.body);

    // Get server config with ACCESS_TOKEN
    const config = getServerConfig();

    // Format payer data for MercadoPago API
    const mercadoPagoPayload: Record<string, unknown> = {
      transaction_amount: paymentData.transaction_amount,
      payment_method_id: paymentData.payment_method_id,
      description: (paymentData as any).description || "Checkout Brinks",
      installments: (paymentData as any).installments || 1,
      payer: {
        email: paymentData.payer.email,
        entity_type: (paymentData.payer as any).entity_type || 'individual',
        type: (paymentData.payer as any).type || 'customer',
      },
      notification_url: `${config.FRONTEND_URL}/api/webhooks/mercadopago`,
      statement_descriptor: "CHECKOUT BRINKS",
      external_reference: `brinks-${Date.now()}`
    };
    // ... existing code ...
  } catch (error: any) {
    // ... existing code ...
  }
}
```

6. Patch: api/payments/status.ts

- Remover import de src/lib/config/server-environment.

```typescript:c:\Users\User\Desktop\Projetos\sos-moto\cta-mantraom\trae\teste-brinks\api\payments\status.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";
import { z } from "zod";
// import { getServerConfig } from "../../src/lib/config/server-environment";
import { getServerConfig } from "../_shared/config/server";

const statusQuerySchema = z.object({
  paymentId: z.string().min(1)
});
// ... existing code ...
```

7. Patch: api/webhooks/mercadopago.ts

- Remover imports de src/ e usar os novos módulos.

```typescript:c:\Users\User\Desktop\Projetos\sos-moto\cta-mantraom\trae\teste-brinks\api\webhooks\mercadopago.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
// import { webhookPayloadSchema } from "../../src/lib/schemas/webhook";
// import { validateWebhookSignature } from "../../src/lib/config/server-environment";
import { webhookPayloadSchema } from "../_shared/schemas/webhook";
import { validateWebhookSignature } from "../_shared/utils/crypto";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ... existing code ...
}
```

8. Patch opcional: reforçar o fetch do frontend (respostas não-JSON)
   Isso evita que “Unexpected token 'A'” esconda erros de infra.

```tsx:c:\Users\User\Desktop\Projetos\sos-moto\cta-mantraom\trae\teste-brinks\src\components\checkout\PaymentBrick.tsx
export const PaymentBrick = ({
  // ... existing code ...
}: PaymentBrickProps) => {
  // ... existing code ...
  const handleSubmit = async (data: unknown): Promise<void> => {
    try {
      // ... existing code ...

      const apiBase = window.location.origin;
      const response = await fetch(`${apiBase}/api/payments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(paymentPayload),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";
        let errorMessage = `HTTP ${response.status} ao chamar /api/payments/create`;

        if (contentType.includes("application/json")) {
          const errorData = await response.json().catch(() => null);
          if (errorData) {
            console.error("Detalhes do erro da API:", errorData);
            errorMessage = errorData.error || JSON.stringify(errorData);
          }
        } else {
          const errorText = await response.text().catch(() => "");
          console.error("Resposta não-JSON da API (início):", errorText?.slice(0, 500));
          if (errorText) errorMessage = errorText;
        }

        throw new Error(errorMessage);
      }

      const paymentResult = await response.json();
      // ... existing code ...
    } catch (error) {
      // ... existing code ...
    }
  };
  // ... existing code ...
}
```

Por que isso atende seus questionamentos

- Você exigiu produção real com domínio customizado. A nova implementação usa somente FRONTEND_URL (ou VITE_FRONTEND_URL como fallback) e falha explicitamente se não configurado — sem VERCEL_URL nem domínios “preview”.
- O erro da Vercel (ERR_MODULE_NOT_FOUND) é resolvido: todo código consumido pelas APIs agora está dentro de api/ e será empacotado corretamente.
- O fluxo PIX/cartão continua 100% real, sem mocks. O Payment Brick envia dados, o backend cria o pagamento via Mercado Pago e retorna JSON com id/point_of_interaction.
- Os warnings <svg> do SDK não impactam o pagamento; você pode atualizar o @mercadopago/sdk-react mais tarde se quiser silenciá-los.

Próximos passos

- Subir esses arquivos novos e patches.
- Garantir, na Vercel, que as variáveis estão assim:
  - FRONTEND_URL=https://memoryys.com
  - VITE_FRONTEND_URL=https://memoryys.com
  - MERCADOPAGO_ACCESS_TOKEN=…
  - MERCADOPAGO_WEBHOOK_SECRET=…
- Fazer um pagamento PIX de teste. Esperado:
  - 200 com JSON contendo id/status e point_of_interaction.
  - Tela de status exibindo QR automaticamente (hidePixQrCode: false).
- Se algo retornar erro JSON do Mercado Pago, me envie o corpo de erro (agora você verá erro JSON completo) e eu ajusto rapidamente.

Se quiser, eu também padronizo a mesma estrutura “\_shared” nos outros endpoints (status, webhooks) — já deixei os patches prontos acima — e posso adicionar logs estruturados.

● 🎯 Explicação sobre a Configuração de URL

Você está absolutamente certo! Vou explicar melhor:

❌ Por que a proposta original está incorreta para seu caso:

// PROPOSTA ORIGINAL (desnecessária para você):
const computedFrontend =
process.env.FRONTEND_URL ||
process.env.VITE_FRONTEND_URL ||
(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) || // ❌ DESNECESSÁRIO
'https://memoryys.com'

Esta lógica com VERCEL_URL é para ambientes que usam URLs automáticas da Vercel como:

- meu-app-123abc.vercel.app (preview)
- meu-app.vercel.app (produção sem domínio customizado)

✅ Para seu ambiente de PRODUÇÃO REAL:

Você já tem:

- FRONTEND_URL = https://memoryys.com
- VITE_FRONTEND_URL = https://memoryys.com
- Domínio customizado configurado
- 100% produção, sem ambientes de teste

📝 Configuração CORRETA para seu caso:

// api/\_shared/config/server.ts
export const getServerConfig = () => {
// Para seu ambiente, simplesmente:
const frontendUrl = process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL

    if (!frontendUrl) {
      throw new Error('FRONTEND_URL não configurada')
    }

    return {
      MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN!,
      MERCADOPAGO_WEBHOOK_SECRET: process.env.MERCADOPAGO_WEBHOOK_SECRET!,
      FRONTEND_URL: frontendUrl // Sempre será https://memoryys.com
    }

}

🔧 No arquivo api/payments/create.ts:

// Linha 64 - URL de notificação do webhook
notification_url: `${config.FRONTEND_URL}/api/webhooks/mercadopago`,
// Resultará em: https://memoryys.com/api/webhooks/mercadopago

💡 Por que isso é melhor para você:

1. Sem complexidade desnecessária - não precisa verificar VERCEL_URL
2. Garantia de produção - sempre usa https://memoryys.com
3. Sem fallbacks confusos - URL sempre definida e correta
4. Checkout Brinks real - fluxo de pagamento em produção verdadeira

📊 Resumo das variáveis que você tem:

| Variável                    | Valor                | Uso               |
| --------------------------- | -------------------- | ----------------- |
| FRONTEND_URL                | https://memoryys.com | Backend (APIs)    |
| VITE_FRONTEND_URL           | https://memoryys.com | Frontend (React)  |
| MERCADOPAGO_ACCESS_TOKEN    | •••                  | Autenticação MP   |
| MERCADOPAGO_WEBHOOK_SECRET  | 73ffb4...            | Validação webhook |
| VITE_MERCADOPAGO_PUBLIC_KEY | •••                  | SDK Frontend      |

✅ Código ajustado para PRODUÇÃO REAL:

// api/\_shared/config/server.ts
import { z } from 'zod'

const serverEnvironmentSchema = z.object({
MERCADOPAGO_ACCESS_TOKEN: z.string().min(1),
MERCADOPAGO_WEBHOOK_SECRET: z.string().min(1),
FRONTEND_URL: z.string().url(), // Sempre https://memoryys.com
})

export const getServerConfig = () => {
const config = serverEnvironmentSchema.parse({
MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN,
MERCADOPAGO_WEBHOOK_SECRET: process.env.MERCADOPAGO_WEBHOOK_SECRET,
FRONTEND_URL: process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL,
})

    return config

}

Sem simulações, sem mocks, 100% produção com Checkout Brinks real! 🚀
