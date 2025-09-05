William Freitas Rondon

Copy

Delete

para complemnetar veja os logs na vecel Sep 05 10:42:08.30

POST

500

memoryys.com

/api/payments/create

2025-09-05T13:42:09.271Z [error] Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/src/lib/schemas/payment' imported from /var/task/api/payments/create.js

at finalizeResolution (node:internal/modules/esm/resolve:281:11)

at moduleResolve (node:internal/modules/esm/resolve:866:10)

at moduleResolveWithNodePath (node:internal/modules/esm/resolve:990:14)

at defaultResolve (node:internal/modules/esm/resolve:1033:79)

at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:780:12)

at #cachedDefaultResolve (node:internal/modules/esm/loader:704:25)

at ModuleLoader.resolve (node:internal/modules/esm/loader:687:38)

at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:305:38)

at ModuleJob.\_link (node:internal/modules/esm/module_job:137:49) {

code: 'ERR_MODULE_NOT_FOUND',

url: 'file:///var/task/src/lib/schemas/payment'

}

Node.js process exited with exit status: 1. The logs above can help with debugging the issue.

Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/src/lib/schemas/payment' imported from /var/task/api/payments/create.js

at finalizeResolution (node:internal/modules/esm/resolve:281:11)

at moduleResolve (node:internal/modules/esm/resolve:866:10)

at moduleResolveWithNodePath (node:internal/modules/esm/resolve:990:14)

at defaultResolve (node:internal/modules/esm/resolve:1033:79)

at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:780:12)

at #cachedDefaultResolve (node:internal/modules/esm/loader:704:25)

at ModuleLoader.resolve (node:internal/modules/esm/loader:687:38)

at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:305:38)

at ModuleJob.\_link (node:internal/modules/esm/module_job:137:49) {

code: 'ERR_MODULE_NOT_FOUND',

url: 'file:///var/task/src/lib/schemas/payment'

}

Node.js process exited with exit status: 1. The logs above can help with debugging the issue.

Trae

src\lib\schemas\payment.ts 1 - 250

Obrigado! Os logs da Vercel confirmam exatamente o que diagnosticamos: o 500 acontece porque a função serverless está importando código fora de api/, e o bundler da Vercel não encontra esse módulo no tempo de execução.

Erro chave da Vercel

- Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/src/lib/schemas/payment' imported from /var/task/api/payments/create.js
- Ou seja, a função api/payments/create.ts está importando de ../../src/lib/schemas/payment e isso não é empacotado para a função serverless no deploy, gerando 500 e uma página HTML (por isso seu frontend viu “Unexpected token 'A'” ao tentar parsear JSON).
  O que vamos corrigir

- Remover dependências do backend (api/) em arquivos do src/.
- Criar uma cópia mínima dos utilitários necessários dentro de api/\_shared para garantir que o bundle da Vercel inclua tudo que a função precisa.
- Ajustar imports em api/payments/create.ts para apontar para esses novos utilitários.
  Atualizações de código

1. 1. Substituir importações em api/payments/create.ts

- Trocar:
  - import { paymentFormDataSchema } from "../../src/lib/schemas/payment"
  - import { getServerConfig } from "../../src/lib/config/server-environment"
- Por:
  - import { paymentFormDataSchema } from "../\_shared/payment-schema"
  - import { getServerConfig } from "../\_shared/server-config"

```
import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";
import { randomUUID } from "crypto";
import { z } from "zod";
// ... existing code ...
import { paymentFormDataSchema } from "../_shared/payment-schema";
// ... existing code ...
import { getServerConfig } from "../_shared/server-config";
// ... existing code ...

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ... existing code ...
}
// ... existing code ...
```

2. 1. Novo utilitário de configuração do servidor (evita importar de src/)

```
// Utilitário isolado para ambiente do servidor (funções em api/)
// Mantém compatibilidade com Vercel/Serverless sem depender de arquivos do src/
import { z } from 'zod'

const serverEnvironmentSchema = z.object({
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1, 'Access token obrigatório'),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().min(1, 'Webhook secret obrigatório'),
  FRONTEND_URL: z.string().url().min(1, 'Frontend URL obrigatório'),
})

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>

let serverConfig: ServerEnvironment | null = null

export const getServerConfig = (): ServerEnvironment => {
  if (serverConfig) return serverConfig

  // Descobre FRONTEND_URL com prioridade: FRONTEND_URL > VITE_FRONTEND_URL > 
  VERCEL_URL > localhost
  const computedFrontend =
    process.env.FRONTEND_URL ||
    process.env.VITE_FRONTEND_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://
    localhost:3000')

  const env = {
    MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    MERCADOPAGO_WEBHOOK_SECRET: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
    FRONTEND_URL: computedFrontend,
  }

  serverConfig = serverEnvironmentSchema.parse(env)
  return serverConfig
}
```

3. 1. Novo schema local para validação de cartões no backend (cópia mínima do que o backend precisa)

```
// Schema mínimo para validação do fluxo de CARTÃO no backend.
// Para PIX, o create.ts já relaxa a validação e não exige todos os campos.
import { z } from 'zod'

export const payerSchema = z.object({
  first_name: z.string().min(1, 'Nome obrigatório'),
  last_name: z.string().min(1, 'Sobrenome obrigatório'),
  email: z.string().email('Email inválido'),
  entity_type: z.enum(['individual', 'association']).default('individual'),
  type: z.string().default('customer'),
  identification: z.object({
    type: z.literal('CPF'),
    number: z.string()
      .regex(/^\d{11}$/, 'CPF deve ter 11 dígitos')
      .transform(val => val.replace(/\D/g, ''))
  }),
  phone: z.object({
    area_code: z.string().min(2).max(2),
    number: z.string().min(8).max(9)
  })
})

export const paymentFormDataSchema = z.object({
  transaction_amount: z.number().positive('Valor deve ser positivo'),
  payment_method_id: z.enum(['pix', 'credit_card', 'debit_card']),
  payer: payerSchema,
  description: z.string().default('Checkout Brinks'),
  installments: z.number().min(1).default(1)
})
```

Por que isso resolve seu 500 na Vercel

- O bundler da função agora encontra todos os módulos necessários dentro de api/, não havendo mais importações para src/.
- A função volta a executar o try/catch e sempre responder JSON (erro ou sucesso).
- No frontend, o parse do JSON volta a funcionar e você verá erros detalhados (se houver) ou o id/point_of_interaction do pagamento quando for sucesso.
  O que testar depois do deploy

- Verifique as variáveis de ambiente na Vercel:
  - MERCADOPAGO_ACCESS_TOKEN (obrigatória)
  - MERCADOPAGO_WEBHOOK_SECRET (obrigatória, mesmo que o webhook ainda não esteja sendo usado ativamente)
  - FRONTEND_URL (recomendado apontar para seu domínio https)
  - Se não definir FRONTEND_URL, a função tentará usar VITE_FRONTEND_URL ou VERCEL_URL.
- Faça um pagamento PIX de teste:
  - No console do navegador, você deve ver “✅ Pagamento criado com sucesso” com id e point_of_interaction.
  - O fluxo deve navegar para a tela de status e exibir o QR automaticamente (hidePixQrCode: false).
- Se ainda houver falhas:

  - Agora a função já retorna JSON de erro. Cole o conteúdo do erro JSON aqui para eu ajustar rapidamente (ex.: erro de credenciais, campos, ou algo na conta do Mercado Pago).
    Sobre os warnings de SVG do SDK

- “Error:
  attribute width/height: Unexpected end of attribute…” são avisos da lib, não bloqueiam o pagamento. Pode manter assim ou testar atualizar @mercadopago/sdk-react para a última versão estável quando for conveniente.
  Quer que eu já aplique algum ajuste adicional (ex.: proxy local do /api para facilitar debug com vite, logs mais verbosos, ou atualização de SDK)?

Completed
