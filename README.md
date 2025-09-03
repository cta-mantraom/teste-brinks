# Checkout MercadoPago - Brinks

Checkout completo com MercadoPago usando Payment Brick para pagamentos via PIX e Cartão de Crédito.

## Arquitetura

Projeto desenvolvido com arquitetura desacoplada seguindo as melhores práticas:
- Validação com Zod
- Serviços abstraídos
- Configurações com lazy loading
- Sem uso de `any`
- TypeScript strict

## Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:

```bash
cp .env.example .env
```

Adicione suas chaves de produção do MercadoPago:

```env
# Frontend (Públicas)
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-f8807301-695f-42b1-a2f8-8a44376fe109
VITE_FRONTEND_URL=https://memoryys.com

# Backend (Privadas - Configurar na Vercel)
MERCADOPAGO_ACCESS_TOKEN=seu_access_token_aqui
MERCADOPAGO_WEBHOOK_SECRET=seu_webhook_secret_aqui
```

### 3. Executar localmente

```bash
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

## Deploy na Vercel

### Deploy via CLI

1. Instale a Vercel CLI:
```bash
npm i -g vercel
```

2. Execute o deploy:
```bash
vercel
```

3. Configure as variáveis de ambiente no painel da Vercel:
   - Acesse: Settings > Environment Variables
   - Adicione as mesmas variáveis do `.env`

### Deploy via GitHub

1. Conecte seu repositório GitHub na Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

## Estrutura do Projeto

```
src/
├── lib/
│   ├── config/         # Configurações e inicialização
│   ├── schemas/        # Validações com Zod
│   ├── services/       # Serviços de pagamento
│   └── types/          # TypeScript types
├── components/
│   └── checkout/       # Componentes do checkout
├── hooks/              # React hooks customizados
└── api/
    └── webhooks/       # Webhooks do MercadoPago
```

## Funcionalidades

- ✅ Pagamento via PIX com QR Code
- ✅ Pagamento com Cartão de Crédito/Débito
- ✅ Status Screen do MercadoPago
- ✅ Webhook para notificações
- ✅ Validação completa com Zod
- ✅ Arquitetura desacoplada

## Segurança

- 🔐 Access Token e Webhook Secret mantidos apenas no servidor
- ✅ Validação de assinatura em todos os webhooks
- 🛡️ Todas as requisições validadas com Zod
- 🔒 Separação completa entre variáveis públicas e privadas

## Valor do Pagamento

O valor está fixado em **R$ 5,00** conforme requisito do projeto.

## Métodos de Pagamento Suportados

- PIX (com QR Code)
- Cartão de Crédito
- Cartão de Débito

## Suporte

Para dúvidas ou problemas, entre em contato com o desenvolvedor.