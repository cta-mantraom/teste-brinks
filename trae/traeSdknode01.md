Sim, podemos e devemos usar o SDK oficial de servidor do Mercado Pago diretamente dentro de arquivos em /api. Isso é o mais adequado no seu caso, porque:

- /api é o seu backend serverless da Vercel e é onde as credenciais privadas vivem com segurança (getServerConfig lê MERCADOPAGO_ACCESS_TOKEN).
- O SDK server-side (“mercadopago”) foi feito para uso no servidor e encapsula as chamadas a /v1/payments, com tipagem e requestOptions para idempotência.
- Mantém o fluxo recomendado pelos Bricks: o frontend coleta dados/token e o backend cria/consulta o pagamento.

Sugestão de arquitetura

- Opção mínima: substituir as chamadas axios por SDK diretamente em api/payments/create.ts e api/payments/status.ts.
- Opção melhor: criar um pequeno client reutilizável (singleton) e importar nos handlers. Vou implementar assim para reduzir duplicação e manter inicialização preguiçosa com cache, alinhada ao padrão do seu getServerConfig.

Passo 1) Adicionar a dependência do SDK de servidor do Mercado Pago

```bash
npm i mercadopago
```

Passo 2) Criar um client único do SDK no backend (com cache)
Crie o arquivo abaixo para centralizar a inicialização do SDK e expor um client de payments.

```typescript:c:\Users\User\Desktop\Projetos\sos-moto\cta-mantraom\trae\teste-brinks\api_shared\utils\mpClient.ts
// Client central do Mercado Pago (SDK server-side) com cache de instância
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { getServerConfig } from '../config/server.js'

let paymentsClient: Payment | null = null

export const getPaymentsClient = (): Payment => {
  // Evita recriar cliente em cada invocação (reuso por instância da lambda)
  if (paymentsClient) return paymentsClient

  const cfg = getServerConfig()
  const client = new MercadoPagoConfig({ accessToken: cfg.MERCADOPAGO_ACCESS_TOKEN })

  paymentsClient = new Payment(client)
  return paymentsClient
}
```

Passo 3) Migrar api/payments/create.ts para usar o SDK em vez de axios

- Mantemos toda a validação com Zod e logs existentes.
- Substituímos o axios.post por payments.create({ body, requestOptions }).
- Preservamos o X-Idempotency-Key usando requestOptions.idempotencyKey.

```typescript:c:\Users\User\Desktop\Projetos\sos-moto\cta-mantraom\trae\teste-brinks\api\payments\create.ts
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
// ADIÇÃO: usar SDK server-side via client central
import { getPaymentsClient } from "../_shared/utils/mpClient.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ... existing code ...
  try {
    // ... existing code ...

    // Construir payload para MercadoPago (tipagem explícita)
    const mercadoPagoPayload: Record<string, unknown> = {
      transaction_amount: paymentData.transaction_amount,
      payment_method_id: paymentData.payment_method_id,
      description: paymentData.description,
      installments: paymentData.installments,
      payer: {
        // ... existing code ...
      },
      // Se cartão: token e issuer_id (se houver)
      ...(isPix ? {} : {
        token: (paymentData as CardPayment).token,
        ...(paymentData as CardPayment).issuer_id ? { issuer_id: (paymentData as CardPayment).issuer_id } : {}
      })
    };

    // ... existing code ...

    // Envio ao Mercado Pago via SDK (substitui axios.post)
    const payments = getPaymentsClient();
    const mpPayment = await payments.create({
      body: mercadoPagoPayload,
      requestOptions: {
        // Mantém idempotência equivalente ao header X-Idempotency-Key
        idempotencyKey: randomUUID(),
      }
    });

    // Log de sucesso (mantendo padrão de log)
    logger.payment('payment_created', mpPayment.id, {
      status: mpPayment.status,
      status_detail: mpPayment.status_detail,
      payment_method_id: mpPayment.payment_method_id
    });

    // Retorno ao frontend
    return res.status(200).json({
      id: mpPayment.id,
      status: mpPayment.status,
      status_detail: mpPayment.status_detail,
      point_of_interaction: mpPayment.point_of_interaction,
    });
  } catch (error: unknown) { // NUNCA any, sempre unknown
    // ... existing code ...
  }
  // ... existing code ...
}
```

Passo 4) Migrar api/payments/status.ts para usar o SDK em vez de axios

- Trocar o GET manual por payments.get({ id }).

```typescript:c:\Users\User\Desktop\Projetos\sos-moto\cta-mantraom\trae\teste-brinks\api\payments\status.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
// ... existing code ...
import { z } from "zod";
import { getServerConfig } from "../_shared/config/server.js";
// ADIÇÃO: usar SDK server-side via client central
import { getPaymentsClient } from "../_shared/utils/mpClient.js";

const statusQuerySchema = z.object({
  paymentId: z.string().min(1, 'paymentId obrigatório')
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ... existing code ...
  try {
    // ... existing code ...
    const config = getServerConfig();

    // Buscar status via SDK (substitui axios.get)
    const payments = getPaymentsClient();
    const mpPayment = await payments.get({ id: paymentId });

    return res.status(200).json({
      id: mpPayment.id,
      status: mpPayment.status,
      status_detail: mpPayment.status_detail,
      transaction_amount: mpPayment.transaction_amount,
      date_created: mpPayment.date_created,
      date_approved: mpPayment.date_approved,
      point_of_interaction: mpPayment.point_of_interaction,
      payer: mpPayment.payer,
      payment_method_id: mpPayment.payment_method_id,
      external_reference: mpPayment.external_reference
    });
  } catch (error: unknown) {
    // ... existing code ...
  }
}
```

Onde usar o SDK

- Exatamente nos endpoints de backend que hoje falam com a API do Mercado Pago:
  - api/payments/create.ts → payments.create({ body, requestOptions })
  - api/payments/status.ts → payments.get({ id })
- Opcionalmente, em outras rotas futuras (ex.: cancelamento/captura), reaproveitando o getPaymentsClient para manter uma única inicialização por instância.

Pontos importantes

- Permaneça importando esse client apenas em código do servidor (/api). Não importe em nada dentro de src/ que roda no browser.
- Mantenha a regra de idempotência (já feito nos snippets).
- Continue validando tudo com Zod (já está ok).
- Não envie payment_type_id no payload; deixe o MP inferir pelo token e payment_method_id (bandeira). Sua documentação local reforça token, issuer_id e payment_method_id como campos-chave para /v1/payments com cartão.

Se quiser, eu já posso:

- Ajustar também o cardPaymentSchema para aceitar payment_method_id como bandeira e issuer_id como number (se ainda não estiver).
- Substituir completamente o axios nesses arquivos (removendo os imports não usados).
- Rodar um teste de ponta a ponta com cartão de teste e Pix para validar a migração.
