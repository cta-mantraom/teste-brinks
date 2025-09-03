# 🔒 Configuração de Segurança - Checkout MercadoPago

## ✅ Sistema Totalmente Seguro

### 1️⃣ Variáveis de Ambiente Separadas

#### Frontend (Públicas - Prefixo VITE_)
```env
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-f8807301-695f-42b1-a2f8-8a44376fe109
VITE_FRONTEND_URL=https://memoryys.com
```

#### Backend (Privadas - NUNCA expor)
```env
MERCADOPAGO_ACCESS_TOKEN=SEU_ACCESS_TOKEN_AQUI
MERCADOPAGO_WEBHOOK_SECRET=SEU_WEBHOOK_SECRET_AQUI
```

### 2️⃣ Arquitetura de Segurança

```
Frontend (React)
    ↓
    ├── Usa apenas PUBLIC_KEY
    ├── Envia dados para nossa API
    └── Não tem acesso ao ACCESS_TOKEN
    
API Routes (Vercel)
    ↓
    ├── /api/payments/create → Processa pagamentos
    ├── /api/webhooks/mercadopago → Valida webhooks
    └── Usa ACCESS_TOKEN e WEBHOOK_SECRET (servidor)
    
MercadoPago API
    ↓
    └── Recebe requisições autenticadas do servidor
```

### 3️⃣ Proteções Implementadas

✅ **Validação Zod**: Todos os dados validados antes do processamento
✅ **Webhook Signature**: Validação criptográfica de webhooks
✅ **Separação Frontend/Backend**: Tokens sensíveis apenas no servidor
✅ **HTTPS Only**: Domínio configurado para memoryys.com
✅ **No process.env direto**: Configs desacopladas com lazy loading

### 4️⃣ Fluxo Seguro de Pagamento

1. **Frontend** coleta dados do usuário
2. **Frontend** envia para `/api/payments/create`
3. **API Route** valida com Zod
4. **API Route** usa ACCESS_TOKEN para criar pagamento
5. **MercadoPago** processa e envia webhook
6. **Webhook** valida assinatura com SECRET
7. **Frontend** mostra status do pagamento

### 5️⃣ Configuração na Vercel

No painel da Vercel, adicione:

```
# Públicas (podem aparecer no código)
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-f8807301-695f-42b1-a2f8-8a44376fe109
VITE_FRONTEND_URL=https://memoryys.com

# Privadas (apenas no servidor)
MERCADOPAGO_ACCESS_TOKEN=[SEU_TOKEN_AQUI]
MERCADOPAGO_WEBHOOK_SECRET=[SEU_SECRET_AQUI]
```

### ⚠️ IMPORTANTE

- **NUNCA** commitar ACCESS_TOKEN ou WEBHOOK_SECRET
- **SEMPRE** use variáveis de ambiente na Vercel
- **NUNCA** adicione tokens privados no código
- **SEMPRE** valide webhooks com assinatura

## 🚀 Deploy Seguro

1. Configure as variáveis na Vercel
2. Faça deploy: `vercel --prod`
3. Teste primeiro em staging
4. Monitore os logs de webhook

---

**Sistema 100% seguro seguindo as melhores práticas!** 🔐